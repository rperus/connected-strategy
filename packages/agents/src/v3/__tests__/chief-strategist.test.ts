import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeHealthScoreWithCI } from '../synthesis/health-score.js';
import { buildChiefStrategistPrompt } from '../synthesis/prompt-builder.js';
import { runChiefStrategist } from '../agents/chief-strategist.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { AgentV3Context } from '../types.js';

describe('Chief Strategist', () => {
  describe('Health Score CI', () => {
    it('computes empty state', () => {
      const state = {} as ProjectStateV3;
      const { value, ci } = computeHealthScoreWithCI(state);
      assert.equal(value, 50); // baseline
      assert.equal(ci[0], 22); // 50 - 28
      assert.equal(ci[1], 78); // 50 + 28
    });

    it('computes complete state with good values', () => {
      const state = {
        frontier: { selfPosition: 'above' },
        competitive: {
          competitors: [{}, {}, {}],
          activitySystem: { imitabilityScore: 0.8 }
        },
        swarm: { findings: [] },
        wharton: { ws06: { currentLevel: 3 }, ws08: { ideas: [{}, {}, {}] } }
      } as any;
      const { value, ci } = computeHealthScoreWithCI(state);
      // 50 + 30 (above) + 20 (imitability) + 20 (repeat) = 120 -> capped to 100
      assert.equal(value, 100);
      assert.equal(ci[0], 100);
      assert.equal(ci[1], 100);
    });
  });

  describe('Prompt Builder', () => {
    it('builds safely with minimal state', () => {
      const state = { projectName: 'Test' } as ProjectStateV3;
      const prompt = buildChiefStrategistPrompt(state);
      assert.ok(prompt.includes('Strategy Audit — Test'));
      assert.ok(prompt.includes('N/A'));
    });
  });

  describe('Tool Loop & runChiefStrategist', () => {
    it('returns validation error after 3 failures', async () => {
      const state = { projectName: 'Test' } as ProjectStateV3;
      
      const ctx: AgentV3Context = {
        runId: 'r1', projectId: 'p1', projectPath: '', startedAt: '',
        llm: {
          model: 'mock', available: true,
          generate: async () => ({ text: '{"bad": "json"}', model: 'mock', finishReason: 'stop' }),
          generateStructured: async () => null,
        },
        store: {} as any,
        fileReader: {} as any,
        maxTokens: 1000, maxToolCalls: 10, timeoutMs: 1000,
        log: () => {}
      };

      const result = await runChiefStrategist({ state }, ctx);
      assert.equal(result.success, false);
      assert.equal(result.llmCalls, 3);
      assert.ok(result.error?.includes('validation failed') || result.error?.includes('failed'));
    });

    it('returns success when LLM gives valid JSON directly', async () => {
      const state = { projectName: 'Test' } as ProjectStateV3;
      
      const validJson = {
        strategyAuditAnswers: {
          industryStateAndEvolution: 'A'.repeat(50),
          wtpAndCostDrivers: 'A'.repeat(50),
          competitorMovements: 'A'.repeat(50),
          bestPracticesVsDifferentiation: 'A'.repeat(50),
          synergies: null
        },
        threeFits: {
          internal: { score: 90, justification: 'J', gaps: [] },
          external: { score: 80, justification: 'J', gaps: [] },
          dynamic: { score: 70, justification: 'J', gaps: [] }
        },
        topPriorities: [
          { priorityId: '1', title: 'T1', summary: 'S', wharton_basis: ['WS01'], frontierMoveId: null, swarmFindingId: null, antigravityPromptHint: 'A'.repeat(20), estimatedImpact: 'high', estimatedEffort: 'days' },
          { priorityId: '2', title: 'T2', summary: 'S', wharton_basis: ['WS01'], frontierMoveId: null, swarmFindingId: null, antigravityPromptHint: 'A'.repeat(20), estimatedImpact: 'high', estimatedEffort: 'days' },
          { priorityId: '3', title: 'T3', summary: 'S', wharton_basis: ['WS01'], frontierMoveId: null, swarmFindingId: null, antigravityPromptHint: 'A'.repeat(20), estimatedImpact: 'high', estimatedEffort: 'days' }
        ],
        executiveSummary: 'Exec',
        healthScore: { value: 85, ci: [80, 90] }
      };

      const ctx: AgentV3Context = {
        runId: 'r1', projectId: 'p1', projectPath: '', startedAt: '',
        llm: {
          model: 'mock', available: true,
          generate: async () => ({ text: JSON.stringify(validJson), model: 'mock', finishReason: 'stop' }),
          generateStructured: async () => null,
        },
        store: {} as any,
        fileReader: {} as any,
        maxTokens: 1000, maxToolCalls: 10, timeoutMs: 1000,
        log: () => {}
      };

      const result = await runChiefStrategist({ state }, ctx);
      assert.equal(result.success, true);
      assert.equal(result.data?.executiveSummary, 'Exec');
    });
  });
});
