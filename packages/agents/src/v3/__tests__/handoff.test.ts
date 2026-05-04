import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { runHandoffPhase } from '../handoff/index.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { AgentV3Context } from '../types.js';

describe('handoff phase', () => {
  const testProjectId = 'test-handoff';
  const baseDir = path.join('data', 'projects', testProjectId, 'antigravity');

  beforeEach(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  it('generates 4 files per priority and an INDEX.md', async () => {
    const state = {
      projectId: testProjectId,
      projectName: 'Test Proj',
      lastRunAt: '2026-05-04',
      lastRunId: 'run-1',
      synthesis: {
        healthScore: { value: 90, ci: [80, 100] },
        topPriorities: [
          {
            priorityId: 'p1',
            title: 'Test Priority',
            summary: 'Summary',
            wharton_basis: ['WS01'],
            antigravityPromptHint: 'Hint',
            estimatedImpact: 'high',
            estimatedEffort: 'days'
          }
        ],
        executiveSummary: 'Exec summary'
      }
    } as any;

    const mockCtx = {
      log: () => {},
      llm: {
        generateStructured: async () => ({
          moveId: 'p1', title: 'Test', wharton_basis: ['WS01'], frontier_impact: { wtp_delta: 1, cost_delta: 1 },
          files_to_create: [], files_to_edit: [], files_to_delete: [], dependencies_to_add: [], dependencies_to_remove: [],
          estimated_loc: 100, estimated_hours: 4, references: { worksheets: [], findings: [] }
        }),
        generate: async () => ({ text: '## Functional\n## Code Quality\n## Strategic' }),
      },
      fileReader: {}
    } as any;

    const { movesGenerated, indexPath } = await runHandoffPhase(state, mockCtx);
    assert.equal(movesGenerated, 1);
    
    // Check INDEX.md exists
    const idxContent = await fs.readFile(indexPath, 'utf-8');
    assert.ok(idxContent.includes('Antigravity Moves — Test Proj'));
    assert.ok(idxContent.includes('Health Score: 90'));

    // Check move folder files
    const moveDir = path.join(baseDir, 'move-1');
    const files = await fs.readdir(moveDir);
    assert.ok(files.includes('manifest.json'));
    assert.ok(files.includes('acceptance-tests.md'));
    assert.ok(files.includes('strategy.md'));
    assert.ok(files.includes('prompt.md'));
  });
});
