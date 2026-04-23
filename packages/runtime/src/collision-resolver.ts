/**
 * Collision Resolver
 *
 * Detects whether a port is in use and finds the next available port.
 * Writes fallback resolutions back to active_ports.json via port-writer.
 *
 * Policy (from PORT_REGISTRY_POLICY.md):
 *  1. Read active_ports.json first
 *  2. Fall back to port_registry.yaml
 *  3. If preferred port is busy, assign a free port and write override
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

import { createServer } from 'net';
import { resolvePort } from './port-config.js';
import { writeServicePort, writeProjectPort } from './port-writer.js';
import type { PortAssignment, CollisionRecord } from './types.js';

// ─── Port Availability ────────────────────────────────────────────────────────

/**
 * Check if a TCP port is available on 127.0.0.1.
 * Returns true if the port is free.
 */
export function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find the next free port starting at `start`, up to `maxAttempts` tries.
 * Skips ports in the `reserved` set.
 */
export async function findFreePort(
  start: number,
  reserved: Set<number> = new Set(),
  maxAttempts = 50,
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = start + attempt;
    if (reserved.has(candidate)) continue;
    if (await isPortFree(candidate)) return candidate;
  }
  throw new Error(`No free port found starting at ${start} after ${maxAttempts} attempts`);
}

// ─── Collision Resolution ─────────────────────────────────────────────────────

const collisionLog: CollisionRecord[] = [];

/**
 * Resolve the port for a named service, handling collisions.
 *
 * Steps:
 * 1. Resolve preferred port (active_ports.json → port_registry.yaml → fallback)
 * 2. If preferred is free, return it as-is
 * 3. If busy, find a free port and write the override to active_ports.json
 *
 * @param serviceName   Canonical service name (must match port_registry keys)
 * @param fallback      Hard fallback if registry has no entry
 * @param bucket        'services' for core services, 'projects' for discovered repos
 * @param reserved      Extra ports to avoid during fallback search
 */
export async function resolvePortSafe(
  serviceName: string,
  fallback: number,
  bucket: 'services' | 'projects' = 'services',
  reserved: Set<number> = new Set(),
): Promise<PortAssignment> {
  const preferred = resolvePort(serviceName, fallback);

  if (await isPortFree(preferred)) {
    return {
      serviceName,
      preferredPort: preferred,
      resolvedPort: preferred,
      isFallback: false,
      source: 'port_registry',
    };
  }

  // Port is busy — find alternative
  const free = await findFreePort(preferred + 1, reserved);

  const record: CollisionRecord = {
    serviceName,
    requestedPort: preferred,
    resolvedPort: free,
    resolvedAt: new Date().toISOString(),
    writebackPath: 'ops/runtime/active_ports.json',
  };
  collisionLog.push(record);

  console.warn(
    `[collision-resolver] Port ${preferred} busy for "${serviceName}" → using ${free}`,
  );

  // Write override to active_ports.json
  if (bucket === 'services') {
    writeServicePort(serviceName, preferred, free, 'not_running');
  } else {
    writeProjectPort(serviceName, preferred, free, 'not_running');
  }

  return {
    serviceName,
    preferredPort: preferred,
    resolvedPort: free,
    isFallback: true,
    source: 'dynamic',
  };
}

/**
 * Resolve ports for multiple services without collisions between them.
 * Guarantees uniqueness across the batch.
 */
export async function resolvePortsBatch(
  services: Array<{ name: string; fallback: number; bucket?: 'services' | 'projects' }>,
): Promise<Map<string, PortAssignment>> {
  const result = new Map<string, PortAssignment>();
  const reserved = new Set<number>();

  for (const svc of services) {
    const assignment = await resolvePortSafe(
      svc.name,
      svc.fallback,
      svc.bucket ?? 'services',
      reserved,
    );
    result.set(svc.name, assignment);
    reserved.add(assignment.resolvedPort);
  }

  return result;
}

/**
 * Return the collision log (useful for diagnostics / API routes).
 */
export function getCollisionLog(): readonly CollisionRecord[] {
  return collisionLog;
}
