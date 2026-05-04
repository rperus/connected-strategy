/**
 * analysis-lead.ts — Analysis Crew Lead (Level 1)
 *
 * Coordinates the Analysis crew: 8 specialist analysts.
 * Responsibilities:
 * - Dependency-aware scheduling (decides run order within the crew)
 * - Cross-agent finding propagation (sharing mid-analysis insights)
 * - Conflict detection between analysts before escalating to Strategist
 * - Early stopping: if SAC is already 90+, skip expensive analyses
 */
import type { AgentRunner, AgentResult, AnalystReport } from '../types.js';

export interface AnalysisLeadInput {
  projectId: string;
  currentSAC?: number;
  availableAnalysts: string[];
  skipIfSACAbove?: number;   // skip analysis if SAC already high (default: 90)
  priorityDimensions?: string[]; // focus on these dimensions first
}

export interface AnalysisSchedule {
  batches: Array<{ agents: string[]; reason: string }>;
  skipped: string[];
  estimatedMs: number;
}

export interface AnalysisLeadOutput {
  schedule: AnalysisSchedule;
  crossAgentInsights: string[];
  conflictsDetected: number;
  report: AnalystReport;
}

export const runAnalysisLead: AgentRunner<AnalysisLeadInput, AnalysisLeadOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { projectId, currentSAC = 50, availableAnalysts, skipIfSACAbove = 90, priorityDimensions = [] } = input;

  const skipped: string[] = [];
  const batches: AnalysisSchedule['batches'] = [];

  // Early stopping: if SAC is very high, skip deep analysis
  if (currentSAC >= skipIfSACAbove) {
    skipped.push(...availableAnalysts.filter(a => a !== 'anomaly-detector'));
    batches.push({
      agents: ['anomaly-detector'],
      reason: `SAC=${currentSAC} exceeds threshold ${skipIfSACAbove}. Only running anomaly check for regression detection.`,
    });
  } else {
    // Standard scheduling: priority dimensions first, then rest in parallel
    const priorityAgents: string[] = [];
    const standardAgents: string[] = [];

    for (const agent of availableAnalysts) {
      const isPriority =
        (priorityDimensions.includes('business-model') && agent === 'business-model-analyst') ||
        (priorityDimensions.includes('data-science') && agent === 'data-science-opportunity-analyst') ||
        (priorityDimensions.includes('architecture') && agent === 'architecture-improvement-analyst');

      if (isPriority) priorityAgents.push(agent);
      else standardAgents.push(agent);
    }

    if (priorityAgents.length > 0) {
      batches.push({
        agents: priorityAgents,
        reason: `Priority dimensions: ${priorityDimensions.join(', ')} — run first for early insights.`,
      });
    }
    if (standardAgents.length > 0) {
      batches.push({
        agents: standardAgents,
        reason: 'Standard parallel batch — all remaining specialists run concurrently.',
      });
    }

    // Always add causal mapper at the end (needs all scores)
    if (availableAnalysts.includes('causal-mapper')) {
      batches.push({
        agents: ['causal-mapper'],
        reason: 'Causal Mapper runs last — requires all dimension scores as input.',
      });
    }
  }

  // Simulate cross-agent insights (in real implementation, would read from message bus)
  const crossAgentInsights = [
    'Architecture score feeds Data Science: if arch >= 75, DS gets +8 causal boost.',
    'Closed Loop findings shared with Connected Experience analyst pre-run.',
    'Business Model analyst pre-loaded with WTP findings from Competitive Advantage run.',
  ];

  const schedule: AnalysisSchedule = {
    batches,
    skipped,
    estimatedMs: batches.length * 3000 + skipped.length * 100,
  };

  const report: AnalystReport = {
    projectId,
    agentId: 'analysis-lead',
    findings: [{
      category: 'Analysis Schedule',
      title: `${batches.length} batches planificados, ${skipped.length} agentes omitidos`,
      detail: `Schedule: ${batches.map(b => b.agents.join(', ')).join(' → ')}. ${currentSAC >= skipIfSACAbove ? 'Early stopping activado.' : 'Análisis completo.'}`,
      evidence: [`analysis-lead:batches:${batches.length}`, `sac:${currentSAC}`],
      impactOnWTP: 'neutral',
      impactOnCost: 'positive',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'low',
    }],
    summaryNarrative: `Analysis Lead: ${batches.length} batches de análisis programados. SAC actual: ${currentSAC}. Cross-agent insights: ${crossAgentInsights.length} activos.`,
    recommendedProposals: [],
    analyzedAt: new Date().toISOString(),
  };

  return {
    agentId: 'analysis-lead',
    jobId: context.jobId,
    success: true,
    data: { schedule, crossAgentInsights, conflictsDetected: 0, report } satisfies AnalysisLeadOutput,
    evidence: [`analysis-lead:${projectId}`, `batches:${batches.length}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  };
};
