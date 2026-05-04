/**
 * @cs/agents — frontier-mapper-agent.ts
 *
 * 📈 Frontier Mapper Agent
 * Computes the Pareto efficient frontier and competitive advantage.
 * 100% deterministic — no LLM needed. Pure math.
 *
 * Formulas from Wharton Connected Strategy:
 *   Value Created = WTP - Cost
 *   Competitive Advantage = Value_Own - Value_Competitor
 *   Pareto Frontier = set of entities not dominated by any other
 */

import type { AgentContext, AgentResult } from '../types.js';

export interface FrontierEntity {
  id: string;
  name: string;
  wtp: number;
  cost: number;
  valueCreated: number;
  isOwn: boolean;
  onFrontier: boolean;
}

export interface CompetitiveAdvantageEntry {
  competitorId: string;
  competitorName: string;
  ownValue: number;
  competitorValue: number;
  advantage: number;
  status: 'winning' | 'losing' | 'tied';
}

export interface FrontierMapperInput {
  projectId: string;
  entities: Array<{
    id: string;
    name: string;
    wtp: number;
    cost: number;
    isOwn: boolean;
  }>;
}

export interface FrontierMapperResult {
  projectId: string;
  entities: FrontierEntity[];
  frontierEntityIds: string[];
  competitiveAdvantages: CompetitiveAdvantageEntry[];
  overallStatus: 'on-frontier' | 'dominated' | 'no-data';
  strategicDirection: 'raise-wtp' | 'lower-cost' | 'both' | 'maintain';
  analyzedAt: string;
}

/**
 * Pure math agent. Computes Pareto frontier + CA calculations.
 */
export async function runFrontierMapperAgent(
  input: FrontierMapperInput,
  context: AgentContext,
): Promise<AgentResult<FrontierMapperResult>> {
  const start = Date.now();
  const evidence: string[] = ['pareto-frontier-algorithm', 'competitive-advantage-formula'];

  try {
    if (input.entities.length === 0) {
      return {
        agentId: 'frontier-mapper-agent' as any,
        jobId: context.jobId,
        success: true,
        data: {
          projectId: input.projectId,
          entities: [],
          frontierEntityIds: [],
          competitiveAdvantages: [],
          overallStatus: 'no-data',
          strategicDirection: 'maintain',
          analyzedAt: new Date().toISOString(),
        },
        durationMs: Date.now() - start,
        evidence,
        completedAt: new Date().toISOString(),
      };
    }

    // Compute value created for each entity
    const enriched: FrontierEntity[] = input.entities.map(e => ({
      ...e,
      valueCreated: e.wtp - e.cost,
      onFrontier: false,
    }));

    // Compute Pareto frontier
    // Entity A is dominated if there exists entity B such that B.wtp >= A.wtp AND B.cost <= A.cost (with at least one strict)
    const frontierIds: string[] = [];
    for (const a of enriched) {
      const dominated = enriched.some(b =>
        b.id !== a.id &&
        b.wtp >= a.wtp &&
        b.cost <= a.cost &&
        (b.wtp > a.wtp || b.cost < a.cost)
      );
      if (!dominated) {
        a.onFrontier = true;
        frontierIds.push(a.id);
      }
    }

    // Find own entity
    const own = enriched.find(e => e.isOwn);

    // Compute CA vs each competitor
    const advantages: CompetitiveAdvantageEntry[] = [];
    if (own) {
      for (const comp of enriched) {
        if (comp.isOwn) continue;
        const advantage = own.valueCreated - comp.valueCreated;
        advantages.push({
          competitorId: comp.id,
          competitorName: comp.name,
          ownValue: own.valueCreated,
          competitorValue: comp.valueCreated,
          advantage,
          status: advantage > 0 ? 'winning' : advantage < 0 ? 'losing' : 'tied',
        });
      }
    }

    // Strategic direction recommendation
    let strategicDirection: FrontierMapperResult['strategicDirection'] = 'maintain';
    if (own) {
      const avgCompWtp = enriched.filter(e => !e.isOwn).reduce((s, e) => s + e.wtp, 0) / Math.max(1, enriched.filter(e => !e.isOwn).length);
      const avgCompCost = enriched.filter(e => !e.isOwn).reduce((s, e) => s + e.cost, 0) / Math.max(1, enriched.filter(e => !e.isOwn).length);

      if (own.wtp < avgCompWtp && own.cost > avgCompCost) {
        strategicDirection = 'both';
      } else if (own.wtp < avgCompWtp) {
        strategicDirection = 'raise-wtp';
      } else if (own.cost > avgCompCost) {
        strategicDirection = 'lower-cost';
      }
    }

    const overallStatus = own?.onFrontier ? 'on-frontier' : own ? 'dominated' : 'no-data';

    return {
      agentId: 'frontier-mapper-agent' as any,
      jobId: context.jobId,
      success: true,
      data: {
        projectId: input.projectId,
        entities: enriched,
        frontierEntityIds: frontierIds,
        competitiveAdvantages: advantages,
        overallStatus,
        strategicDirection,
        analyzedAt: new Date().toISOString(),
      },
      durationMs: Date.now() - start,
      evidence,
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      agentId: 'frontier-mapper-agent' as any,
      jobId: context.jobId,
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
      evidence,
      completedAt: new Date().toISOString(),
    };
  }
}
