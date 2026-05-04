/**
 * @cs/agents — cost-estimator-agent.ts
 *
 * 💰 Cost Estimator Agent
 * Calculates USD cost of AI-driven analysis workflows.
 * Uses deterministic pricing model based on token counts.
 *
 * Pricing model (Gemini 2.5, approximate):
 *   Flash:  Input $0.15/Mtok  Output $0.60/Mtok
 *   Pro:    Input $1.25/Mtok  Output $5.00/Mtok
 *   Local:  $0.00
 */

import type { AgentContext, AgentResult } from '../types.js';

export interface CostEstimatorInput {
  projectId: string;
  /** Which agents ran */
  agentRuns: Array<{
    agentId: string;
    durationMs: number;
    usedLlm: boolean;
    llmModel?: 'flash' | 'pro';
    estimatedInputTokens?: number;
    estimatedOutputTokens?: number;
  }>;
}

export interface AgentCostEntry {
  agentId: string;
  mode: 'offline' | 'gemini-flash' | 'gemini-pro';
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  durationMs: number;
}

export interface CostEstimatorResult {
  projectId: string;
  entries: AgentCostEntry[];
  totalCostUSD: number;
  totalTokens: number;
  /** Cost breakdown by mode */
  byMode: Record<string, { count: number; costUSD: number }>;
  estimatedAt: string;
}

// Pricing per million tokens (USD)
const PRICING = {
  flash:  { input: 0.15, output: 0.60 },
  pro:    { input: 1.25, output: 5.00 },
} as const;

// Default token estimates per agent type (if not measured)
const DEFAULT_TOKENS: Record<string, { input: number; output: number }> = {
  'portfolio-scanner':                { input: 0,     output: 0     },
  'worksheet-synthesizer':            { input: 2000,  output: 1500  },
  'connected-strategy-analyst':       { input: 3000,  output: 2000  },
  'competitive-advantage-analyst':    { input: 3000,  output: 2000  },
  'business-model-analyst':           { input: 2500,  output: 1500  },
  'data-science-opportunity-analyst': { input: 2500,  output: 1500  },
  'architecture-improvement-analyst': { input: 3000,  output: 2000  },
  'ai-frontier-analyst':              { input: 3000,  output: 2000  },
  'proposal-composer':                { input: 5000,  output: 3000  },
  'competitive-intel-agent':          { input: 4000,  output: 2500  },
  'frontier-mapper-agent':            { input: 0,     output: 0     }, // pure math
  'cost-estimator-agent':             { input: 0,     output: 0     }, // pure math
};

export async function runCostEstimatorAgent(
  input: CostEstimatorInput,
  context: AgentContext,
): Promise<AgentResult<CostEstimatorResult>> {
  const start = Date.now();

  try {
    const entries: AgentCostEntry[] = input.agentRuns.map(run => {
      const defaults = DEFAULT_TOKENS[run.agentId] || { input: 2000, output: 1000 };
      const inputTokens = run.estimatedInputTokens ?? defaults.input;
      const outputTokens = run.estimatedOutputTokens ?? defaults.output;

      let costUSD = 0;
      let mode: AgentCostEntry['mode'] = 'offline';

      if (run.usedLlm && run.llmModel) {
        mode = run.llmModel === 'pro' ? 'gemini-pro' : 'gemini-flash';
        const pricing = PRICING[run.llmModel];
        costUSD = (inputTokens / 1_000_000) * pricing.input +
                  (outputTokens / 1_000_000) * pricing.output;
      }

      return {
        agentId: run.agentId,
        mode,
        inputTokens,
        outputTokens,
        costUSD: Math.round(costUSD * 10000) / 10000, // 4 decimal places
        durationMs: run.durationMs,
      };
    });

    const totalCostUSD = entries.reduce((sum, e) => sum + e.costUSD, 0);
    const totalTokens = entries.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0);

    const byMode: Record<string, { count: number; costUSD: number }> = {};
    for (const entry of entries) {
      if (!byMode[entry.mode]) byMode[entry.mode] = { count: 0, costUSD: 0 };
      byMode[entry.mode].count++;
      byMode[entry.mode].costUSD += entry.costUSD;
    }

    return {
      agentId: 'cost-estimator-agent' as any,
      jobId: context.jobId,
      success: true,
      data: {
        projectId: input.projectId,
        entries,
        totalCostUSD: Math.round(totalCostUSD * 10000) / 10000,
        totalTokens,
        byMode,
        estimatedAt: new Date().toISOString(),
      },
      durationMs: Date.now() - start,
      evidence: ['gemini-pricing-model-2025'],
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      agentId: 'cost-estimator-agent' as any,
      jobId: context.jobId,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
      evidence: [],
      completedAt: new Date().toISOString(),
    };
  }
}
