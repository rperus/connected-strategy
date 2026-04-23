/**
 * @cs/agents — data-science-opportunity-analyst.ts
 *
 * Evaluates data science readiness: data availability, instrumentation,
 * modeling capability, and statistical rigor requirements.
 * Maps to WS05, WS08.
 *
 * Loop phase: Analyze (data infrastructure assessment)
 */

import type { AgentContext, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { AgentId } from '../types.js';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';

const AGENT_ID: AgentId = 'data-science-opportunity-analyst';

function evaluateDataAvailability(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const dataAvailability = Number(answers['ws05_q_data_availability'] ?? 0);
  const hasCanonicalModel = answers['ws05_q_canonical_data_model'] === 'yes' ||
    answers['ws05_q_canonical_data_model'] === true;

  if (dataAvailability < 40) {
    findings.push({
      category: 'data-availability',
      title: 'Insufficient data volume for ML',
      detail: 'Current data availability is below the threshold required for reliable machine learning models. Data collection strategy must be prioritized.',
      evidence: ['worksheet:ws05'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Sense',
      severity: 'high',
    });
  }

  if (!hasCanonicalModel) {
    findings.push({
      category: 'data-model',
      title: 'No canonical data model defined',
      detail: 'Without a canonical data model, ML feature engineering is ad-hoc and expensive. A shared entity schema is prerequisite for scalable data science.',
      evidence: ['worksheet:ws05'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Transmit',
      severity: 'high',
    });
  }

  return findings;
}

function evaluateInstrumentation(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const instrumentationCoverage = Number(answers['ws08_q_instrumentation'] ?? 0);
  const hasDashboards = answers['ws08_q_has_kpi_dashboard'] === 'yes' ||
    answers['ws08_q_has_kpi_dashboard'] === true;

  if (instrumentationCoverage < 50) {
    findings.push({
      category: 'instrumentation',
      title: 'Low instrumentation coverage',
      detail: 'Less than 50% of key user interactions are tracked. Dark usage patterns cannot be analyzed or optimized.',
      evidence: ['worksheet:ws08'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Sense',
      severity: instrumentationCoverage < 20 ? 'high' : 'medium',
    });
  }

  if (!hasDashboards) {
    findings.push({
      category: 'observability',
      title: 'No KPI dashboard in place',
      detail: 'No institutional KPI dashboard detected. Data science outputs have no systematic consumption path.',
      evidence: ['worksheet:ws08'],
      impactOnWTP: 'neutral',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateModelingOpportunities(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const modelingCapability = Number(answers['ws05_q_modeling_capability'] ?? 0);
  const rigorLevel = answers['ws05_q_rigor_level'] as string | undefined;

  if (modelingCapability < 30) {
    findings.push({
      category: 'modeling',
      title: 'No internal modeling capability',
      detail: 'The organization lacks data scientists or ML engineers to build predictive models. External partnerships or upskilling are required.',
      evidence: ['worksheet:ws05'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  if (!rigorLevel || rigorLevel === 'low') {
    findings.push({
      category: 'rigor',
      title: 'Low statistical rigor in analysis',
      detail: 'Insights are generated without statistical validation. Correlations may be mistaken for causations. MITx rigor standards recommend hypothesis testing before action.',
      evidence: ['worksheet:ws05'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  return findings;
}

export async function runDataScienceOpportunityAnalyst(
  input: { projectId: string; answers: Record<string, unknown> },
  context: AgentContext,
): Promise<AgentResult<AnalystReport>> {
  const startMs = Date.now();

  try {
    const findings: AnalystFinding[] = [
      ...evaluateDataAvailability(input.answers),
      ...evaluateInstrumentation(input.answers),
      ...evaluateModelingOpportunities(input.answers),
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

    const dsScore = metrics?.dataScienceReadiness ?? 0;

    const report: AnalystReport = {
      projectId: input.projectId,
      agentId: AGENT_ID,
      findings,
      summaryNarrative:
        `Data Science Readiness: ${dsScore.toFixed(1)}/100. ` +
        `${findings.length} data science gaps identified. ` +
        (dsScore < 30
          ? 'Data infrastructure is pre-analytics. Foundational investment required before ML is viable.'
          : 'Platform has basic data readiness. Focus on instrumentation and canonical model.'),
      recommendedProposals: findings
        .filter((f) => f.severity !== 'low')
        .map((f) => ({
          title: `DS: ${f.title}`,
          rationale: f.detail,
          changeType: f.category === 'data-model' ? 'data' : 'architecture',
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
      evidence: [`project:${input.projectId}`, 'domain:ds-scoring'],
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
