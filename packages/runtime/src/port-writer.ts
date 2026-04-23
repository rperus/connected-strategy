/**
 * Port Writer
 *
 * Writes live port resolutions back to ops/runtime/active_ports.json.
 * Only this module should mutate that file.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { getActivePortsPath as _getActivePortsPath } from './port-config.js';
import type { ActivePortsFile, ActivePortEntry } from './types.js';

const ACTIVE_PORTS_PATH = _getActivePortsPath();

// ─── Internal read/write ──────────────────────────────────────────────────────

function loadFile(): ActivePortsFile {
  if (existsSync(ACTIVE_PORTS_PATH)) {
    try {
      return JSON.parse(readFileSync(ACTIVE_PORTS_PATH, 'utf-8')) as ActivePortsFile;
    } catch {
      // Fall through to empty default
    }
  }
  return {
    last_updated: new Date().toISOString().slice(0, 10),
    source: 'runtime',
    services: {},
    projects: {},
  };
}

function saveFile(data: ActivePortsFile): void {
  data.last_updated = new Date().toISOString().slice(0, 10);
  const dir = dirname(ACTIVE_PORTS_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(ACTIVE_PORTS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Write the resolved (possibly fallback) port for a core service.
 */
export function writeServicePort(
  serviceName: string,
  preferredPort: number,
  activePort: number,
  status: 'running' | 'not_running' | 'unknown' = 'not_running',
  extras?: Partial<ActivePortEntry>,
): void {
  const data = loadFile();
  data.services[serviceName] = {
    preferred_port: preferredPort,
    active_port: activePort,
    status,
    resolved_at: new Date().toISOString(),
    ...extras,
  };
  saveFile(data);
}

/**
 * Write the resolved port for a discovered external project.
 */
export function writeProjectPort(
  projectId: string,
  preferredPort: number,
  activePort: number,
  status: 'running' | 'not_running' | 'unknown' = 'not_running',
  extras?: Partial<ActivePortEntry>,
): void {
  const data = loadFile();
  data.projects[projectId] = {
    preferred_port: preferredPort,
    active_port: activePort,
    status,
    resolved_at: new Date().toISOString(),
    ...extras,
  };
  saveFile(data);
}

/**
 * Mark a service as running with the given PID.
 */
export function markServiceRunning(
  serviceName: string,
  pid: number,
  bucket: 'services' | 'projects' = 'services',
): void {
  const data = loadFile();
  const target = data[bucket];
  if (target[serviceName]) {
    target[serviceName].status = 'running';
    target[serviceName].pid = pid;
    target[serviceName].resolved_at = new Date().toISOString();
  }
  saveFile(data);
}

/**
 * Mark a service as stopped.
 */
export function markServiceStopped(
  serviceName: string,
  bucket: 'services' | 'projects' = 'services',
): void {
  const data = loadFile();
  const target = data[bucket];
  if (target[serviceName]) {
    target[serviceName].status = 'not_running';
    delete target[serviceName].pid;
    target[serviceName].resolved_at = new Date().toISOString();
  }
  saveFile(data);
}

/**
 * Read the full file (for diagnostics / API routes).
 */
export function readActivePorts(): ActivePortsFile {
  return loadFile();
}
