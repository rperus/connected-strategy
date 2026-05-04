/**
 * @cs/agents — competitive-intel-agent.ts
 *
 * 🕵️ Competitive Intelligence Agent
 * Structures competitor data from project context for the Efficiency Frontier.
 * Deterministic: extracts from worksheet answers + project_facts.
 * LLM enrichment: optional, for industry research.
 */

import type { AgentContext, AgentResult } from '../types.js';

export interface CompetitiveIntelInput {
  projectId: string;
  answers: Record<string, unknown>;
  projectPath?: string;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  wtpScore: number;
  costScore: number;
  valueCreated: number;
  isOwn: boolean;
  connectionArchitecture: string[];
  connectedExperiences: string[];
  strengths: string[];
  weaknesses: string[];
  source: 'worksheet' | 'inferred' | 'manual';
}

export interface CompetitiveIntelResult {
  projectId: string;
  competitors: CompetitorProfile[];
  industryContext: string;
  analyzedAt: string;
}

/**
 * Extracts competitor data from WS12 (Efficiency Frontier) and WS10 (Competitive)
 * worksheet answers. Structures it for the Frontier Mapper.
 */
export async function runCompetitiveIntelAgent(
  input: CompetitiveIntelInput,
  context: AgentContext,
): Promise<AgentResult<CompetitiveIntelResult>> {
  const start = Date.now();
  const competitors: CompetitorProfile[] = [];
  const evidence: string[] = [];

  try {
    const answers = input.answers;

    // Extract own company from WS12
    const ownName = (answers['ef_own_name'] as string) || 'Mi Empresa';
    const ownWtp = Number(answers['ef_own_wtp'] ?? 50);
    const ownCost = Number(answers['ef_own_cost'] ?? 50);

    competitors.push({
      id: 'own',
      name: ownName,
      wtpScore: ownWtp,
      costScore: ownCost,
      valueCreated: ownWtp - ownCost,
      isOwn: true,
      connectionArchitecture: extractMultiChoice(answers['sm_own_architectures']),
      connectedExperiences: extractMultiChoice(answers['sm_own_experiences']),
      strengths: [],
      weaknesses: [],
      source: 'worksheet',
    });
    evidence.push('ws12_efficiency_frontier:ef_own_name', 'ws12_efficiency_frontier:ef_own_wtp');

    // Extract up to 4 competitors from WS12
    for (let i = 1; i <= 4; i++) {
      const name = answers[`ef_comp_${i}_name`] as string;
      if (!name) continue;
      const wtp = Number(answers[`ef_comp_${i}_wtp`] ?? 50);
      const cost = Number(answers[`ef_comp_${i}_cost`] ?? 50);
      competitors.push({
        id: `comp_${i}`,
        name,
        wtpScore: wtp,
        costScore: cost,
        valueCreated: wtp - cost,
        isOwn: false,
        connectionArchitecture: [],
        connectedExperiences: [],
        strengths: [],
        weaknesses: [],
        source: 'worksheet',
      });
      evidence.push(`ws12_efficiency_frontier:ef_comp_${i}_name`);
    }

    return {
      agentId: 'competitive-intel-agent' as any,
      jobId: context.jobId,
      success: true,
      data: {
        projectId: input.projectId,
        competitors,
        industryContext: (answers['sm_competitor_positions'] as string) || '',
        analyzedAt: new Date().toISOString(),
      },
      durationMs: Date.now() - start,
      evidence,
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      agentId: 'competitive-intel-agent' as any,
      jobId: context.jobId,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
      evidence,
      completedAt: new Date().toISOString(),
    };
  }
}

function extractMultiChoice(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}
