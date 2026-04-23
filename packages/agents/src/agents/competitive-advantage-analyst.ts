/**
 * @cs/agents — competitive-advantage-analyst.ts
 *
 * Evaluates switching costs, WTP uplift, and competitive positioning.
 * Maps to WS03, WS10 worksheets and competitive landscape scoring.
 *
 * Loop phase: Analyze (competitive intelligence processing)
 */

import type { AgentContext, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { AgentId } from '../types.js';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';

const AGENT_ID: AgentId = 'competitive-advantage-analyst';

function evaluateSwitchingCosts(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const dataLock = Number(answers['ws03_q_data_lock_in'] ?? 0);
  const networkEffect = Number(answers['ws03_q_network_effect'] ?? 0);
  const habitFormation = Number(answers['ws03_q_habit_formation'] ?? 0);

  if (dataLock < 40) {
    findings.push({
      category: 'switching-costs',
      title: 'Low data lock-in',
      detail: 'User data is portable and interoperable. Switching to competitors involves minimal data migration cost. Consider accumulating proprietary data assets.',
      evidence: ['worksheet:ws03'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Sense',
      severity: dataLock < 20 ? 'high' : 'medium',
    });
  }

  if (networkEffect < 30) {
    findings.push({
      category: 'switching-costs',
      title: 'Weak network effects',
      detail: 'The platform does not significantly benefit from more users. Adding network effects (shared data, benchmarking, community) would raise switching costs.',
      evidence: ['worksheet:ws03'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Repeat',
      severity: 'medium',
    });
  }

  if (habitFormation < 40) {
    findings.push({
      category: 'switching-costs',
      title: 'Habit formation not designed',
      detail: 'No evidence of deliberate habit loops (notifications, streaks, status updates). Users have low behavioral lock-in.',
      evidence: ['worksheet:ws03'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'React',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateActivitySystem(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const internalFit = answers['ws10_q_internal_fit'] as string | undefined;
  const differentiationClarity = answers['ws10_q_differentiation_clear'] as string | undefined;

  if (!internalFit || internalFit === 'low') {
    findings.push({
      category: 'activity-system',
      title: 'Weak internal activity system fit',
      detail: 'Strategic activities are not strongly reinforcing each other. Porter\'s Activity System should be mapped to identify missing linkages.',
      evidence: ['worksheet:ws10'],
      impactOnWTP: 'negative',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Analyze',
      severity: 'high',
    });
  }

  if (!differentiationClarity || differentiationClarity === 'no') {
    findings.push({
      category: 'positioning',
      title: 'Differentiation choices unclear',
      detail: 'The platform lacks clearly articulated trade-off choices. Without deliberate trade-offs, competitive convergence is inevitable.',
      evidence: ['worksheet:ws10'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateWTPUplift(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const convenienceDelta = Number(answers['ws01_q_convenience_uplift'] ?? 0);
  const painResolution = Number(answers['ws01_q_pain_resolution'] ?? 0);

  if (convenienceDelta < 30 && painResolution < 30) {
    findings.push({
      category: 'wtp-uplift',
      title: 'Low WTP uplift potential',
      detail: 'Neither convenience nor pain resolution scores indicate strong willingness-to-pay improvement. The platform may be competing on price rather than value.',
      evidence: ['worksheet:ws01'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Sense',
      severity: 'high',
    });
  }

  return findings;
}

export async function runCompetitiveAdvantageAnalyst(
  input: { projectId: string; answers: Record<string, unknown> },
  context: AgentContext,
): Promise<AgentResult<AnalystReport>> {
  const startMs = Date.now();

  try {
    const findings: AnalystFinding[] = [
      ...evaluateSwitchingCosts(input.answers),
      ...evaluateActivitySystem(input.answers),
      ...evaluateWTPUplift(input.answers),
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
    } catch { /* sparse inputs ok */ }

    const switchingScore = metrics?.switchingCostIndex ?? 0;
    const positioningScore = metrics?.competitivePositioningIndex ?? 0;
    const wtpScore = metrics?.wtpUpliftIndex ?? 0;

    const report: AnalystReport = {
      projectId: input.projectId,
      agentId: AGENT_ID,
      findings,
      summaryNarrative:
        `Switching Cost Index: ${switchingScore.toFixed(1)}/100. ` +
        `Competitive Positioning: ${positioningScore.toFixed(1)}/100. ` +
        `WTP Uplift Index: ${wtpScore.toFixed(1)}/100. ` +
        `${findings.length} competitive findings identified.`,
      recommendedProposals: findings
        .filter((f) => f.severity !== 'low')
        .map((f) => ({
          title: `Strengthen: ${f.title}`,
          rationale: f.detail,
          changeType: f.category === 'positioning' ? 'process' : 'feature',
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
      evidence: [`project:${input.projectId}`, 'domain:competitive-scoring'],
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
