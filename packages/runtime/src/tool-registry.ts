/**
 * Tool Registry
 *
 * Maintains the registry of external tools (Codex, Antigravity,
 * configurable URLs and desktop apps) that can be opened on launch.
 *
 * This is intentionally in-memory so the launcher can be policy-free.
 * Tools are registered from launch profiles; no .bat files required.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

import type { ExternalTool, ExternalToolKind } from './types.js';

// ─── In-memory registry ───────────────────────────────────────────────────────

const registry = new Map<string, ExternalTool>();

// ─── Built-in defaults ────────────────────────────────────────────────────────

const DEFAULTS: ExternalTool[] = [
  {
    id: 'codex',
    kind: 'codex',
    name: 'OpenAI Codex',
    target: 'https://chatgpt.com/codex',
    openOnLaunch: false,
    description: 'OpenAI Codex — AI coding assistant',
  },
  {
    id: 'antigravity',
    kind: 'antigravity',
    name: 'Antigravity',
    target: 'antigravity://',
    openOnLaunch: false,
    description: 'Antigravity — agentic coding assistant',
  },
];

for (const tool of DEFAULTS) {
  registry.set(tool.id, tool);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register (or update) a tool.
 */
export function registerTool(tool: ExternalTool): void {
  registry.set(tool.id, { ...tool });
}

/**
 * Register multiple tools (e.g., from a launch profile).
 */
export function registerTools(tools: ExternalTool[]): void {
  for (const t of tools) registerTool(t);
}

/**
 * Get a tool by ID.
 */
export function getTool(id: string): ExternalTool | undefined {
  return registry.get(id);
}

/**
 * List all registered tools.
 */
export function listTools(): ExternalTool[] {
  return [...registry.values()];
}

/**
 * Filter tools by kind.
 */
export function listToolsByKind(kind: ExternalToolKind): ExternalTool[] {
  return listTools().filter((t) => t.kind === kind);
}

/**
 * Get tools that should open on launch.
 */
export function getLaunchTools(): ExternalTool[] {
  return listTools().filter((t) => t.openOnLaunch);
}

/**
 * Remove a tool from the registry.
 */
export function deregisterTool(id: string): boolean {
  return registry.delete(id);
}

/**
 * Reset to defaults (useful for testing).
 */
export function resetToolRegistry(): void {
  registry.clear();
  for (const tool of DEFAULTS) {
    registry.set(tool.id, tool);
  }
}
