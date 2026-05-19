import { describe, it, expect } from 'vitest';
import { runCustomerJourneyMapper } from '../agents/customer-journey-mapper.js';
import { runCodeCartographer } from '../agents/code-cartographer.js';
import { FileReader } from '../file-reader.js';

describe('V3 Agents Smoke Tests', () => {
  it('code-cartographer executes without llm', async () => {
    const ctx = {
      runId: '1', projectId: 'test', projectPath: process.cwd(), startedAt: '',
      llm: {} as any, store: {} as any, fileReader: new FileReader(process.cwd()),
      maxTokens: 1000, maxToolCalls: 1, timeoutMs: 1000, log: () => {}
    };

    const res = await runCodeCartographer({ projectPath: process.cwd() }, ctx);
    expect(res.success).toBe(true);
    expect(res.data?.fileDiscovery).toBeTruthy();
  });

  it('customer-journey-mapper validates schema with mock provider', async () => {
    const mockProvider = {
      model: 'test',
      available: true,
      generate: async () => ({
        text: JSON.stringify({
          scope: { customerSegment: 'test', useCase: 'test' },
          stages: {}
        }),
        model: 'test',
        finishReason: 'stop'
      }),
      generateStructured: async () => null
    };

    const ctx = {
      runId: '1', projectId: 'test', projectPath: process.cwd(), startedAt: '',
      llm: mockProvider, store: {} as any, fileReader: new FileReader(process.cwd()),
      maxTokens: 1000, maxToolCalls: 1, timeoutMs: 1000, log: () => {}
    };

    const res = await runCustomerJourneyMapper({
      projectName: 'Test',
      customerSegment: 'test',
      useCase: 'test',
      competitorNames: ['A']
    }, ctx);
    
    expect(res.success).toBe(true);
    expect(res.data?.ws01.scope).toBeTruthy();
  });
});
