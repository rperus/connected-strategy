import fs from 'fs';
import path from 'path';
import { migrateState } from './migrators.js';

// Re-export all types from the standalone types file to preserve the public API
export type {
  DiscoveryResult,
  SpecialistFinding,
  Priority,
  ProjectStateV3,
  RunRecord,
  Citation,
} from './state-types.js';

import type { ProjectStateV3, RunRecord, Citation } from './state-types.js';
import { LRUCache } from 'lru-cache';

const stateCache = new LRUCache<string, ProjectStateV3>({
  max: 50, // Keep up to 50 project states in memory
});

export class ProjectStateStore {
  constructor(private rootDir: string = 'data/projects') {
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }
  }

  private getProjectPath(projectId: string): string {
    const base = path.resolve(this.rootDir);
    const resolved = path.resolve(base, projectId);
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      throw new Error(`Path traversal attempt detected in projectId: ${projectId}`);
    }
    return resolved;
  }

  private ensureProjectDir(projectId: string): string {
    const p = this.getProjectPath(projectId);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
    return p;
  }

  load(projectId: string): ProjectStateV3 | null {
    const cached = stateCache.get(projectId);
    if (cached) return cached;

    const p = path.join(this.getProjectPath(projectId), 'state.json');
    if (!fs.existsSync(p)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      const state = migrateState(raw);
      if (state) stateCache.set(projectId, state);
      return state;
    } catch (e) {
      console.error(`Failed to load state for ${projectId}`, e);
      return null;
    }
  }

  save(state: ProjectStateV3): void {
    stateCache.set(state.projectId, state);
    const dir = this.ensureProjectDir(state.projectId);
    const tmp = path.join(dir, 'state.json.tmp');
    const dest = path.join(dir, 'state.json');
    // Using stringify without pretty-print as suggested
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, dest);
  }

  appendHistory(projectId: string, runRecord: RunRecord): void {
    const dir = this.ensureProjectDir(projectId);
    const p = path.join(dir, 'history.jsonl');
    fs.appendFileSync(p, JSON.stringify(runRecord) + '\n');
  }

  appendCitation(projectId: string, citation: Citation): void {
    const dir = this.ensureProjectDir(projectId);
    const p = path.join(dir, 'citations.jsonl');
    fs.appendFileSync(p, JSON.stringify(citation) + '\n');
  }

  readContext(projectId: string): string {
    const p = path.join(this.getProjectPath(projectId), 'context.md');
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf-8');
  }

  appendContext(projectId: string, message: string, changes: string[]): void {
    const dir = this.ensureProjectDir(projectId);
    const p = path.join(dir, 'context.md');
    const update = `\n## Update ${new Date().toISOString()}\n\n${message}\n\nChanges:\n${changes.map(c => '- ' + c).join('\n')}\n`;
    fs.appendFileSync(p, update);
  }

  cacheLLM(projectId: string, promptHash: string, response: unknown): void {
    const dir = path.join(this.ensureProjectDir(projectId), 'llm-cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, `${promptHash}.json`);
    fs.writeFileSync(p, JSON.stringify(response));
  }

  readLLMCache(projectId: string, promptHash: string): unknown | null {
    const p = path.join(this.getProjectPath(projectId), 'llm-cache', `${promptHash}.json`);
    if (!fs.existsSync(p)) return null;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
      return null;
    }
  }

  snapshotState(projectId: string, runId: string): string {
    const state = this.load(projectId);
    if (!state) throw new Error('Cannot snapshot missing state');
    
    const snapshotsDir = path.join(this.ensureProjectDir(projectId), 'snapshots');
    if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });
    
    const p = path.join(snapshotsDir, `${runId}.json`);
    fs.writeFileSync(p, JSON.stringify(state));
    return p;
  }

  loadSnapshot(projectId: string, runId: string): ProjectStateV3 | null {
    const p = path.join(this.getProjectPath(projectId), 'snapshots', `${runId}.json`);
    if (!fs.existsSync(p)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return migrateState(raw);
    } catch {
      return null;
    }
  }

  diffSnapshots(projectId: string, runIdA: string, runIdB: string): unknown {
    const a = this.loadSnapshot(projectId, runIdA);
    const b = this.loadSnapshot(projectId, runIdB);
    if (!a || !b) return null;
    
    // A simple diff implementation or return both for external diffing
    return { a, b }; // Placeholder for actual diff implementation
  }
}
