/**
 * Launch Profile Builder
 *
 * Creates LaunchProfile objects for a discovered repository.
 * Combines stack detection + safe port resolution + tool registration.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

import { basename, resolve } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { detectStack, detectAllStacks } from './stack-detector.js';
import { resolvePortSafe, resolvePortsBatch } from './collision-resolver.js';
import type { LaunchProfile, ServiceDefinition, ExternalTool, PortAssignment } from './types.js';

// ─── Default External Tools ───────────────────────────────────────────────────

const DEFAULT_TOOLS: ExternalTool[] = [
  {
    id: 'codex',
    kind: 'codex',
    name: 'OpenAI Codex',
    target: 'https://chatgpt.com/codex',
    openOnLaunch: false,
    description: 'OpenAI Codex — AI pair programmer',
  },
  {
    id: 'antigravity',
    kind: 'antigravity',
    name: 'Antigravity',
    target: 'antigravity://',
    openOnLaunch: false,
    description: 'Antigravity agentic coding assistant',
  },
];

// ─── Profile Builder ───────────────────────────────────────────────────────────

export interface BuildProfileOptions {
  repoPath: string;
  name?: string;
  extraTools?: ExternalTool[];
  /** Force a specific stack instead of auto-detecting */
  forceStack?: string;
  /** Additional reserved ports to avoid during fallback */
  reservedPorts?: Set<number>;
}

/**
 * Build a LaunchProfile for the repository at `repoPath`.
 *
 * Detects the stack, resolves safe ports (collision-free), and
 * wires up default external tools.
 */
export async function buildLaunchProfile(opts: BuildProfileOptions): Promise<LaunchProfile> {
  const { repoPath, name, extraTools = [], reservedPorts = new Set<number>() } = opts;

  const absPath = resolve(repoPath);
  const profileName = name ?? basename(absPath);
  const now = new Date().toISOString();

  // Detect stacks — use first match as primary, but detect all for monorepos
  const allStacks = detectAllStacks(absPath);
  const primaryDetection = allStacks[0] ?? detectStack(absPath);

  // Determine services based on detected stacks
  const serviceRequests = buildServiceRequests(absPath, allStacks.length > 0 ? allStacks : [primaryDetection]);

  // Resolve all ports in one collision-safe batch
  const assignments = await resolvePortsBatch(
    serviceRequests.map((sr) => ({
      name: sr.serviceName,
      fallback: sr.defaultPort,
      bucket: 'projects' as const,
    })),
  );

  // Build service definitions
  const services: ServiceDefinition[] = serviceRequests.map((sr) => {
    const assignment = assignments.get(sr.serviceName) ?? {
      serviceName: sr.serviceName,
      preferredPort: sr.defaultPort,
      resolvedPort: sr.defaultPort,
      isFallback: false,
      source: 'dynamic' as const,
    };

    const def: ServiceDefinition = {
      name: sr.serviceName,
      devCommand: sr.devCommand,
      cwd: sr.cwd,
      port: assignment,
    };

    if (sr.healthPath) {
      const { resolvedPort } = assignment;
      def.healthUrl = `http://127.0.0.1:${resolvedPort}${sr.healthPath}`;
    }

    if (sr.dockerComposePath) {
      def.dockerComposePath = sr.dockerComposePath;
    }

    return def;
  });

  const profile: LaunchProfile = {
    id: randomUUID(),
    name: profileName,
    repoPath: absPath,
    stack: primaryDetection.stack,
    services,
    externalTools: [...DEFAULT_TOOLS, ...extraTools],
    createdAt: now,
    updatedAt: now,
  };

  return profile;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface ServiceRequest {
  serviceName: string;
  defaultPort: number;
  devCommand: string;
  cwd: string;
  healthPath?: string;
  dockerComposePath?: string;
}

import type { StackDetectionResult } from './types.js';

function buildServiceRequests(
  repoPath: string,
  detections: StackDetectionResult[],
): ServiceRequest[] {
  const requests: ServiceRequest[] = [];
  const nameCount = new Map<string, number>();

  for (const detection of detections) {
    let baseName: string;
    switch (detection.stack) {
      case 'vite-web':
      case 'nextjs-web':
        baseName = 'web';
        break;
      case 'node-api':
        baseName = 'api';
        break;
      case 'python-api':
        baseName = 'python-api';
        break;
      case 'electron-desktop':
        baseName = 'desktop';
        break;
      case 'monorepo-node':
        baseName = 'monorepo';
        break;
      case 'docker-compose':
        baseName = 'docker';
        break;
      default:
        baseName = 'service';
    }

    // Deduplicate names in case multiple of same kind are detected
    const count = nameCount.get(baseName) ?? 0;
    nameCount.set(baseName, count + 1);
    const serviceName = count === 0 ? baseName : `${baseName}-${count + 1}`;

    const req: ServiceRequest = {
      serviceName,
      defaultPort: detection.defaultPort,
      devCommand: detection.devCommand,
      cwd: repoPath,
      healthPath: detection.healthPath,
    };

    // Hook for docker-compose
    if (detection.stack === 'docker-compose') {
      const composePath =
        existsSync(`${repoPath}/docker-compose.yml`)
          ? `${repoPath}/docker-compose.yml`
          : `${repoPath}/docker-compose.yaml`;
      req.dockerComposePath = composePath;
    }

    requests.push(req);
  }

  return requests;
}
