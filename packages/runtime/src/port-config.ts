/**
 * Port Config Reader
 * 
 * Canonical port resolution for Connected_Strategy.
 * Reads ops/runtime/active_ports.json first (live truth),
 * then falls back to config/port_registry.yaml (fixed preferred).
 * 
 * This is the ONLY module that should resolve ports.
 * No other file should hardcode port numbers.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Project root — works from any depth inside the monorepo (ESM-compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname_esm = resolve(__filename, '..');
const PROJECT_ROOT = resolve(__dirname_esm, '..', '..', '..');

const ACTIVE_PORTS_PATH = resolve(PROJECT_ROOT, 'ops', 'runtime', 'active_ports.json');
const PORT_REGISTRY_PATH = resolve(PROJECT_ROOT, 'config', 'port_registry.yaml');

export interface PortEntry {
  preferred_port: number;
  active_port: number;
  status: 'running' | 'not_running' | 'unknown';
}

export interface ActivePortsFile {
  last_updated: string;
  source: string;
  services: Record<string, PortEntry>;
  projects: Record<string, PortEntry>;
}

/**
 * Read live active ports from ops/runtime/active_ports.json
 */
function readActivePorts(): ActivePortsFile | null {
  try {
    if (existsSync(ACTIVE_PORTS_PATH)) {
      const raw = readFileSync(ACTIVE_PORTS_PATH, 'utf-8');
      return JSON.parse(raw) as ActivePortsFile;
    }
  } catch {
    // Silently fall through to registry fallback
  }
  return null;
}

/**
 * Simple YAML parser for port_registry.yaml (avoids dependency on yaml lib).
 * Extracts preferred_port values from core_services and project_defaults.
 */
function readPortRegistry(): Record<string, number> {
  const ports: Record<string, number> = {};
  try {
    if (existsSync(PORT_REGISTRY_PATH)) {
      const raw = readFileSync(PORT_REGISTRY_PATH, 'utf-8');
      const lines = raw.split('\n');
      let currentService = '';
      for (const line of lines) {
        const serviceMatch = line.match(/^\s{2}(\w+):\s*$/);
        if (serviceMatch) {
          currentService = serviceMatch[1];
          continue;
        }
        const portMatch = line.match(/^\s+preferred_port:\s*(\d+)/);
        if (portMatch && currentService) {
          ports[currentService] = parseInt(portMatch[1], 10);
        }
      }
    }
  } catch {
    // Silently return empty
  }
  return ports;
}

/**
 * Resolve the active port for a named service.
 * Priority: active_ports.json → port_registry.yaml → fallback
 */
export function resolvePort(serviceName: string, fallback: number): number {
  // 1. Try live runtime truth
  const active = readActivePorts();
  if (active) {
    const entry = active.services[serviceName] ?? active.projects[serviceName];
    if (entry?.active_port) {
      return entry.active_port;
    }
  }

  // 2. Try fixed preferred registry
  const registry = readPortRegistry();
  if (registry[serviceName]) {
    return registry[serviceName];
  }

  // 3. Use fallback
  return fallback;
}

/**
 * Get all known ports (merged from both sources).
 */
export function getAllPorts(): Record<string, { port: number; source: 'live' | 'registry' | 'unknown' }> {
  const result: Record<string, { port: number; source: 'live' | 'registry' | 'unknown' }> = {};

  // Load registry first (lower priority)
  const registry = readPortRegistry();
  for (const [name, port] of Object.entries(registry)) {
    result[name] = { port, source: 'registry' };
  }

  // Override with live ports (higher priority)
  const active = readActivePorts();
  if (active) {
    for (const [name, entry] of Object.entries(active.services)) {
      result[name] = { port: entry.active_port, source: 'live' };
    }
    for (const [name, entry] of Object.entries(active.projects)) {
      result[name] = { port: entry.active_port, source: 'live' };
    }
  }

  return result;
}

// Well-known service port accessors
export const ports = {
  get web() { return resolvePort('connected_strategy_web', 4310); },
  get api() { return resolvePort('connected_strategy_api', 4311); },
  get desktopDevtools() { return resolvePort('connected_strategy_desktop_devtools', 4312); },
};

export default ports;

// ─── Path helpers for sibling modules ────────────────────────────────────────

/**
 * Absolute path to the monorepo root.
 * Exported so port-writer and other runtime modules can share the same root
 * without each computing it independently.
 */
export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

/**
 * Absolute path to ops/runtime/active_ports.json.
 */
export function getActivePortsPath(): string {
  return ACTIVE_PORTS_PATH;
}

/**
 * Absolute path to config/port_registry.yaml.
 */
export function getPortRegistryPath(): string {
  return PORT_REGISTRY_PATH;
}
