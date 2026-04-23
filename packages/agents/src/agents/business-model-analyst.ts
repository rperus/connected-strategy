/**
 * @cs/agents — business-model-analyst.ts
 *
 * Evaluates revenue model clarity, moat depth, scalability, and
 * customer relationship depth. Maps to WS04, WS11.
 *
 * Loop phase: Analyze (business model evaluation)
 */

import type { AgentContext, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { AgentId } from '../types.js';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';

const AGENT_ID: AgentId = 'business-model-analyst';

function evaluateRevenueModel(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const revenueClarity = answers['ws11_q_revenue_clarity'] as string | undefined;
  const pricingStrategy = answers['ws11_q_pricing_strategy'] as string | undefined;

  if (!revenueClarity || revenueClarity === 'unclear') {
    findings.push({
      category: 'revenue-model',
      title: 'Revenue model lacks clarity',
      detail: 'The platform does not have a well-articulated revenue model. Unclear monetization makes it difficult to align incentives across the value chain.',
      evidence: ['worksheet:ws11'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'high',
    });
  }

  if (!pricingStrategy || pricingStrategy === 'unknown') {
    findings.push({
      category: 'pricing',
      title: 'No deliberate pricing strategy',
      detail: 'Pricing appears reactive rather than strategic. A value-based pricing approach aligned to WTP improvement would increase margins.',
      evidence: ['worksheet:ws11'],
      impactOnWTP: 'positive',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateMoat(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const moatSources = answers['ws10_q_moat_sources'] as string | undefined;
  const hasProprietaryData = answers['ws05_q_proprietary_data'] === 'yes' ||
    answers['ws05_q_proprietary_data'] === true;

  if (!moatSources || moatSources === '' || moatSources === 'none') {
    findings.push({
      category: 'moat',
      title: 'No identified moat sources',
      detail: 'The business model does not articulate clear sources of competitive moat. Without moat, competitive advantage erodes quickly.',
      evidence: ['worksheet:ws10'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Analyze',
      severity: 'high',
    });
  }

  if (!hasProprietaryData) {
    findings.push({
      category: 'moat',
      title: 'No proprietary data assets',
      detail: 'The platform does not accumulate proprietary data that competitors cannot easily replicate. Data accumulation is a key moat strategy.',
      evidence: ['worksheet:ws05'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Sense',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateScalability(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const scalabilityScore = Number(answers['ws04_q_scalability'] ?? 0);
  const automationLevel = Number(answers['ws04_q_automation_level'] ?? 0);

  if (scalabilityScore < 40) {
    findings.push({
      category: 'scalability',
      title: 'Low scalability headroom',
      detail: 'The current architecture or process design does not scale efficiently. Marginal cost of serving additional users is high.',
      evidence: ['worksheet:ws04'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: 'medium',
    });
  }

  if (automationLevel < 30) {
    findings.push({
      category: 'scalability',
      title: 'High manual operations burden',
      detail: 'Manual operations dominate the value delivery process. Automation investment would reduce cost-to-serve and enable scaling.',
      evidence: ['worksheet:ws04'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: 'medium',
    });
  }

  return findings;
}

export async function runBusinessModelAnalyst(
  input: { projectId: string; answers: Record<string, unknown> },
  context: AgentContext,
): Promise<AgentResult<AnalystReport>> {
  const startMs = Date.now();

  try {
    const findings: AnalystFinding[] = [
      ...evaluateRevenueModel(input.answers),
      ...evaluateMoat(input.answers),
      ...evaluateScalability(input.answers),
    ];

    const syntheticAnswer: WorksheetAnswer = {
      id: 'synthetic',
      worksheetId: 'all',
      projectId: input.projectId,
      version: 1,
      answers: input.answers,
      confidence: {},
      updatedAt: new Date().toISOString(),
    };

    let metrics = null;
    try {
      metrics = computeStrategicMetrics(input.projectId, syntheticAnswer, defaultScoringWeights(input.projectId));
    } catch { /* ok */ }

    const bmScore = metrics?.businessModelStrength ?? 0;
    const costScore = metrics?.costReductionPotential ?? 0;

    const report: AnalystReport = {
      projectId: input.projectId,
      agentId: AGENT_ID,
      findings,
      summaryNarrative:
        `Business Model Strength: ${bmScore.toFixed(1)}/100. ` +
        `Cost Reduction Potential: ${costScore.toFixed(1)}/100. ` +
        `${findings.length} business model findings.`,
      recommendedProposals: findings
        .filter((f) => f.severity !== 'low')
        .map((f) => ({
          title: `Improve: ${f.title}`,
          rationale: f.detail,
          changeType: f.category === 'scalability' ? 'architecture' : 'process',
          priority: f.severity === 'high' ? 'high' as const : 'medium' as const,
        })),
      analyzedAt: new Date().toISOString(),
    };

    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: true,
      data: report,
      durationMs: Date.now() - startMs,
      evidence: [`project:${input.projectId}`, 'domain:bm-scoring'],
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: false,
      errorMessage: String(err),
      durationMs: Date.now() - startMs,
      evidence: [],
      completedAt: new Date().toISOString(),
    };
  }
}
