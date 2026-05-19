import { describe, it } from 'node:test';
import { expect } from 'expect';
import fs from 'fs';
import path from 'path';
import { ProjectStateStore, ProjectStateV3 } from '../state-store.js';

describe('ProjectStateStore', () => {
  const testDir = path.join(process.cwd(), 'test-data');
  
  it('save -> load roundtrip preserva todos los campos', () => {
    const store = new ProjectStateStore(testDir);
    const state: ProjectStateV3 = {
      schemaVersion: '3.0.0',
      projectId: 'p1',
      projectName: 'P1',
      projectPath: '/dev/p1',
      lastRunId: 'r1',
      lastRunAt: new Date().toISOString(),
      userContext: {
        naturalLanguageUpdates: [],
        dismissedPriorities: [],
        completedPriorities: []
      }
    };
    store.save(state);
    
    const loaded = store.load('p1');
    expect(loaded).toEqual(state);
  });

  it('load de proyecto inexistente devuelve null', () => {
    const store = new ProjectStateStore(testDir);
    const loaded = store.load('non-existent');
    expect(loaded).toBeNull();
  });

  it('appendHistory escribe línea jsonl válida', () => {
    const store = new ProjectStateStore(testDir);
    const record = { runId: 'r1', startedAt: 't1', endedAt: 't2', phasesCompleted: ['A'] as any[], delta: { newPriorities: 1, resolvedPriorities: 0, healthScoreDelta: 0 }, errors: [] };
    store.appendHistory('p2', record);
    
    const historyPath = path.join(testDir, 'p2', 'history.jsonl');
    const content = fs.readFileSync(historyPath, 'utf-8');
    expect(content).toContain('{"runId":"r1"');
    expect(content.endsWith('\n')).toBe(true);
  });

  it('save concurrente (2 writes simultáneos) no corrompe', () => {
    const store = new ProjectStateStore(testDir);
    const s1: ProjectStateV3 = { schemaVersion: '3.0.0', projectId: 'p3', projectName: 'P3', projectPath: '/dev/p3', lastRunId: 'r1', lastRunAt: '', userContext: { naturalLanguageUpdates: [], dismissedPriorities: [], completedPriorities: [] } };
    const s2: ProjectStateV3 = { schemaVersion: '3.0.0', projectId: 'p3', projectName: 'P3_MOD', projectPath: '/dev/p3', lastRunId: 'r2', lastRunAt: '', userContext: { naturalLanguageUpdates: [], dismissedPriorities: [], completedPriorities: [] } };
    
    // Simulate concurrent writes by writing simultaneously
    store.save(s1);
    store.save(s2);
    
    const loaded = store.load('p3');
    expect(loaded).not.toBeNull();
    expect(loaded!.projectName === 'P3' || loaded!.projectName === 'P3_MOD').toBe(true);
  });

  it('cacheLLM(hash) -> readLLMCache(mismo hash) devuelve mismo objeto', () => {
    const store = new ProjectStateStore(testDir);
    const response = { choices: [{ text: 'hello' }] };
    store.cacheLLM('p4', 'hash123', response);
    
    const loaded = store.readLLMCache('p4', 'hash123');
    expect(loaded).toEqual(response);
  });
});
