/**
 * Runtime Collision Launcher — Type Contracts
 *
 * All shared interfaces for launch profiles, sessions,
 * port assignments, and external tools.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

// ─── Stack Detection ─────────────────────────────────────────────────────────

export type StackType =
  | 'vite-web'
  | 'nextjs-web'
  | 'node-api'
  | 'python-api'
  | 'electron-desktop'
  | 'monorepo-node'
  | 'docker-compose'
  | 'unknown';

export interface StackDetectionResult {
  stack: StackType;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
  devCommand: string;
  defaultPort: number;
  healthPath?: string;
}

// ─── Port Assignment ─────────────────────────────────────────────────────────

export interface PortAssignment {
  serviceName: string;
  preferredPort: number;
  resolvedPort: number;
  isFallback: boolean;
  source: 'active_ports' | 'port_registry' | 'dynamic';
}

// ─── Launch Profile ──────────────────────────────────────────────────────────

export interface LaunchProfile {
  id: string;
  name: string;
  repoPath: string;
  stack: StackType;
  services: ServiceDefinition[];
  externalTools: ExternalTool[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDefinition {
  name: string;
  devCommand: string;
  cwd: string;
  port: PortAssignment;
  healthUrl?: string;
  env?: Record<string, string>;
  dockerComposePath?: string;  // populated when stack includes docker
}

// ─── Runtime Session ─────────────────────────────────────────────────────────

export type SessionStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

export interface RuntimeSession {
  id: string;
  profileId: string;
  profileName: string;
  startedAt: string;
  endedAt?: string;
  status: SessionStatus;
  services: ServiceStatus[];
  pid?: number;
}

export interface ServiceStatus {
  name: string;
  status: SessionStatus;
  port: number;
  healthUrl?: string;
  lastHealthCheck?: HealthCheckResult;
  pid?: number;
  error?: string;
}

// ─── Health Checks ───────────────────────────────────────────────────────────

export interface HealthCheckResult {
  service: string;
  url: string;
  ok: boolean;
  statusCode?: number;
  latencyMs?: number;
  checkedAt: string;
  error?: string;
}

// ─── External Tools ───────────────────────────────────────────────────────────

export type ExternalToolKind = 'codex' | 'antigravity' | 'url' | 'app';

export interface ExternalTool {
  id: string;
  kind: ExternalToolKind;
  name: string;
  /** For url/app: the launch target. For codex/antigravity: the executable or URL. */
  target: string;
  openOnLaunch: boolean;
  description?: string;
}

// ─── Collision Resolution ─────────────────────────────────────────────────────

export interface CollisionRecord {
  serviceName: string;
  requestedPort: number;
  conflictingPid?: number;
  resolvedPort: number;
  resolvedAt: string;
  writebackPath: string;
}

// ─── Active Ports File (extended from port-config.ts) ───────────────────────

export interface ActivePortEntry {
  preferred_port: number;
  active_port: number;
  status: 'running' | 'not_running' | 'unknown';
  pid?: number;
  health_url?: string;
  resolved_at?: string;
}

export interface ActivePortsFile {
  last_updated: string;
  source: string;
  services: Record<string, ActivePortEntry>;
  projects: Record<string, ActivePortEntry>;
}
