/**
 * Session Manager
 *
 * Manages ephemeral runtime sessions: tracks which services are running,
 * their PIDs, health status, and lifecycle events.
 *
 * Sessions are in-memory; the port truth is persisted via port-writer.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

import { randomUUID } from 'crypto';
import type { RuntimeSession, ServiceStatus, LaunchProfile, SessionStatus } from './types.js';
import { markServiceRunning, markServiceStopped } from './port-writer.js';

// ─── In-memory session store ──────────────────────────────────────────────────

const sessions = new Map<string, RuntimeSession>();

// ─── Health Check ─────────────────────────────────────────────────────────────

import type { HealthCheckResult } from './types.js';

/**
 * Ping a health URL and return a HealthCheckResult.
 */
export async function checkHealth(
  serviceName: string,
  healthUrl: string,
): Promise<HealthCheckResult> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(3000),
    });
    return {
      service: serviceName,
      url: healthUrl,
      ok: response.ok,
      statusCode: response.status,
      latencyMs: Date.now() - start,
      checkedAt,
    };
  } catch (err) {
    return {
      service: serviceName,
      url: healthUrl,
      ok: false,
      latencyMs: Date.now() - start,
      checkedAt,
      error: String(err),
    };
  }
}

// ─── Session Lifecycle ────────────────────────────────────────────────────────

/**
 * Create a new session for the given profile.
 * Does NOT actually launch processes — that is the launcher's job.
 * The session tracks state and provides the status surface.
 */
export function createSession(profile: LaunchProfile): RuntimeSession {
  const id = randomUUID();
  const now = new Date().toISOString();

  const serviceStatuses: ServiceStatus[] = profile.services.map((svc) => ({
    name: svc.name,
    status: 'starting' as SessionStatus,
    port: svc.port.resolvedPort,
    healthUrl: svc.healthUrl,
  }));

  const session: RuntimeSession = {
    id,
    profileId: profile.id,
    profileName: profile.name,
    startedAt: now,
    status: 'starting',
    services: serviceStatuses,
  };

  sessions.set(id, session);
  return session;
}

/**
 * Update service status within a session.
 */
export function updateServiceStatus(
  sessionId: string,
  serviceName: string,
  status: SessionStatus,
  pid?: number,
  error?: string,
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const svc = session.services.find((s) => s.name === serviceName);
  if (svc) {
    svc.status = status;
    if (pid !== undefined) svc.pid = pid;
    if (error !== undefined) svc.error = error;
  }

  // Update the session-level status
  session.status = deriveSessionStatus(session.services);

  // Persist to active_ports.json if relevant
  if (status === 'running' && pid !== undefined) {
    markServiceRunning(serviceName, pid, 'projects');
  } else if (status === 'stopped') {
    markServiceStopped(serviceName, 'projects');
  }
}

/**
 * Record health check result on a service within a session.
 */
export function recordHealthCheck(
  sessionId: string,
  result: HealthCheckResult,
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const svc = session.services.find((s) => s.name === result.service);
  if (svc) {
    svc.lastHealthCheck = result;
    if (!result.ok && svc.status === 'running') {
      // Keep status as running but record the failure
    }
  }
}

/**
 * Close a session (mark everything as stopped).
 */
export function closeSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.status = 'stopped';
  session.endedAt = new Date().toISOString();

  for (const svc of session.services) {
    svc.status = 'stopped';
    markServiceStopped(svc.name, 'projects');
  }
}

/**
 * Get a session by ID.
 */
export function getSession(sessionId: string): RuntimeSession | undefined {
  return sessions.get(sessionId);
}

/**
 * List all sessions (most recent first).
 */
export function listSessions(): RuntimeSession[] {
  return [...sessions.values()].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

/**
 * Get active (non-stopped) sessions.
 */
export function getActiveSessions(): RuntimeSession[] {
  return listSessions().filter((s) => s.status !== 'stopped' && s.status !== 'error');
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function deriveSessionStatus(services: ServiceStatus[]): SessionStatus {
  if (services.every((s) => s.status === 'stopped')) return 'stopped';
  if (services.some((s) => s.status === 'error')) return 'error';
  if (services.every((s) => s.status === 'running')) return 'running';
  if (services.some((s) => s.status === 'starting')) return 'starting';
  return 'stopping';
}
