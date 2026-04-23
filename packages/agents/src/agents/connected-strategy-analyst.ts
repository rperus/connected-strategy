/**
 * @cs/agents — connected-strategy-analyst.ts
 *
 * Evaluates a project's Connected Experience loop depth and maturity.
 * Maps findings to Sense→Transmit→Analyze→React→Repeat.
 * Uses @cs/domain scoring formulas as the backbone — no LLM required.
 *
 * Loop phase: Analyze
 */

import type { AgentContext, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { AgentId } from '../types.js';
import type { WorksheetAnswer } from '@cs/domain';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';

const AGENT_ID: AgentId = 'connected-strategy-analyst';

// ─── Finding Generators ───────────────────────────────────────────────────────

function evaluateConnectedExperience(
  answers: Record<string, unknown>,
): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  // Check for respond-to-desire signals
  const hasRespondToDesire = answers['ws01_q_trigger_recognized'] === true ||
    answers['ws01_q_customer_need_recognized'] === 'yes';

  if (!hasRespondToDesire) {
    findings.push({
      category: 'connected-experience',
      title: 'No Recognize phase detected',
      detail: 'The platform does not clearly identify the moment a customer need is recognized. This breaks the R4 loop at the entry point.',
      evidence: ['worksheet:ws01'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Recognize',
      severity: 'high',
    });
  }

  // Check for automatic execution capability
  const hasAutoExecution = answers['ws04_q_automation_level'] !== undefined &&
    Number(answers['ws04_q_automation_level']) > 50;

  if (!hasAutoExecution) {
    findings.push({
      category: 'connected-experience',
      title: 'Automatic Execution not enabled',
      detail: 'The platform lacks automatic execution of recognized needs. Manual intervention is still required for most workflows.',
      evidence: ['worksheet:ws04'],
      impactOnWTP: 'negative',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'React',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateClosedLoop(
  answers: Record<string, unknown>,
): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const hasDataFeedback = answers['ws05_q_feedback_loop'] === true ||
    answers['ws05_q_data_returns_to_sense'] === 'yes';

  if (!hasDataFeedback) {
    findings.push({
      category: 'closed-loop',
      title: 'Feedback loop not closed',
      detail: 'No evidence that output data is fed back into the Sense phase. The loop is open — each cycle starts cold.',
      evidence: ['worksheet:ws05', 'worksheet:ws06'],
      impactOnWTP: 'negative',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Repeat',
      severity: 'high',
    });
  }

  return findings;
}

function evaluateInformationRichness(
  answers: Record<string, unknown>,
): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const richness = answers['ws05_q_data_richness'] as string | undefined;
  if (!richness || richness === 'low') {
    findings.push({
      category: 'information-flow',
      title: 'Low information richness in data pipeline',
      detail: 'The data transmitted per transaction is sparse. Richer data enables better inference and higher WTP.',
      evidence: ['worksheet:ws05'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Transmit',
      severity: 'medium',
    });
  }

  return findings;
}

// ─── Metrics Integration ──────────────────────────────────────────────────────

function buildAnswerForScoring(answers: Record<string, unknown>): WorksheetAnswer {
  return {
    id: 'synthetic',
    worksheetId: 'all',
    projectId: 'unknown',
    version: 1,
    answers,
    confidence: {},
    updatedAt: new Date().toISOString(),
  };
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runConnectedStrategyAnalyst(
  input: { projectId: string; answers: Record<string, unknown> },
  context: AgentContext,
): Promise<AgentResult<AnalystReport>> {
  const startMs = Date.now();

  try {
    const findings: AnalystFinding[] = [
      ...evaluateConnectedExperience(input.answers),
      ...evaluateClosedLoop(input.answers),
      ...evaluateInformationRichness(input.answers),
    ];

    // Run scoring engine for quantitative signals
    const syntheticAnswer = buildAnswerForScoring(input.answers);
    let metrics = null;
    try {
      metrics = computeStrategicMetrics(input.projectId, syntheticAnswer, defaultScoringWeights(input.projectId));
    } catch {
      // scoring may fail on sparse inputs — findings still valid
    }

    const connectedScore = metrics?.connectedExperienceScore ?? 0;
    const loopScore = metrics?.closedLoopMaturity ?? 0;

    const report: AnalystReport = {
      projectId: input.projectId,
      agentId: AGENT_ID,
      findings,
      summaryNarrative:
        `Connected Experience Score: ${connectedScore.toFixed(1)}/100. ` +
        `Closed Loop Maturity: ${loopScore.toFixed(1)}/100. ` +
        `${findings.length} findings identified. ` +
        (findings.some((f) => f.severity === 'high')
          ? 'Critical gaps in the Recognize-Request-Respond-Repeat loop require immediate attention.'
          : 'No critical gaps detected. Incremental improvements recommended.'),
      recommendedProposals: findings
        .filter((f) => f.severity === 'high')
        .map((f) => ({
          title: `Address: ${f.title}`,
          rationale: f.detail,
          changeType: f.category === 'connected-experience' ? 'feature' : 'process',
          priority: 'high' as const,
        })),
      analyzedAt: new Date().toISOString(),
    };

    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: true,
      data: report,
      durationMs: Date.now() - startMs,
      evidence: [`project:${input.projectId}`, 'domain:scoring-engine'],
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
