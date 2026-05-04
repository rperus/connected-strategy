/**
 * action-lead.ts — Action Crew Lead (Level 1)
 *
 * Coordinates the Action crew: Proposal Composer, Validation Agent, Cost Estimator.
 * Responsibilities:
 * - Ensures proposals are validated before publishing
 * - Applies final cost/feasibility filter
 * - Generates the "publishable package": validated proposals + cost estimates
 * - Escalates unresolvable conflicts to Strategist Supervisor
 */
import type { AgentRunner, AgentResult, AnalystReport } from '../types.js';

export interface ActionLeadInput {
  projectId: string;
  proposalCount?: number;
  validationPassRate?: number;  // % from validation agent (0-100)
  estimatedCostUSD?: number;    // total cost from cost estimator
  budgetLimitUSD?: number;      // max acceptable cost per run (default: $5)
}

export interface ActionPackage {
  approved: boolean;
  publishableProposals: number;
  rejectedByValidation: number;
  rejectedByCost: boolean;
  totalCostUSD: number;
  escalatedToStrategist: boolean;
  escalationReason?: string;
  nextAction: 'publish' | 'escalate' | 'revise' | 'cost-review';
}

export interface ActionLeadOutput {
  actionPackage: ActionPackage;
  report: AnalystReport;
}

export const runActionLead: AgentRunner<ActionLeadInput, ActionLeadOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const {
    projectId,
    proposalCount = 0,
    validationPassRate = 100,
    estimatedCostUSD = 0,
    budgetLimitUSD = 5,
  } = input;

  const publishableProposals = Math.round(proposalCount * (validationPassRate / 100));
  const rejectedByValidation = proposalCount - publishableProposals;
  const rejectedByCost = estimatedCostUSD > budgetLimitUSD;
  const escalated = validationPassRate < 50 || rejectedByCost;

  let nextAction: ActionPackage['nextAction'] = 'publish';
  let escalationReason: string | undefined;

  if (validationPassRate < 50) {
    nextAction = 'escalate';
    escalationReason = `Validation pass rate ${validationPassRate}% < 50% threshold. Too many contradictory or low-quality proposals. Strategist must review.`;
  } else if (rejectedByCost) {
    nextAction = 'cost-review';
    escalationReason = `Estimated cost $${estimatedCostUSD.toFixed(2)} exceeds budget $${budgetLimitUSD}. Reduce LLM calls or switch to offline mode.`;
  } else if (rejectedByValidation > publishableProposals) {
    nextAction = 'revise';
    escalationReason = `More proposals rejected (${rejectedByValidation}) than approved (${publishableProposals}). Revise analyst outputs.`;
  }

  const actionPackage: ActionPackage = {
    approved: !escalated,
    publishableProposals,
    rejectedByValidation,
    rejectedByCost,
    totalCostUSD: estimatedCostUSD,
    escalatedToStrategist: escalated,
    escalationReason,
    nextAction,
  };

  const report: AnalystReport = {
    projectId,
    agentId: 'action-lead',
    findings: [{
      category: 'Action Package',
      title: `${publishableProposals}/${proposalCount} propuestas aprobadas → ${nextAction.toUpperCase()}`,
      detail: escalationReason ?? `Paquete listo para publicar. Pass rate: ${validationPassRate}%. Costo: $${estimatedCostUSD.toFixed(3)}.`,
      evidence: [
        `action-lead:pass-rate:${validationPassRate}%`,
        `action-lead:cost:$${estimatedCostUSD.toFixed(3)}`,
        `action-lead:next:${nextAction}`,
      ],
      impactOnWTP: 'positive',
      impactOnCost: rejectedByCost ? 'negative' : 'positive',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: escalated ? 'high' : 'low',
    }],
    summaryNarrative: `Action Lead: ${publishableProposals} propuestas publicables de ${proposalCount}. Validación: ${validationPassRate}%. Costo: $${estimatedCostUSD.toFixed(3)}. Siguiente paso: ${nextAction}.`,
    recommendedProposals: escalated ? [{
      title: escalationReason ?? 'Revisar propuestas rechazadas',
      rationale: 'Action Lead no puede publicar sin resolución del Strategist Supervisor.',
      changeType: 'process',
      priority: 'high' as const,
    }] : [],
    analyzedAt: new Date().toISOString(),
  };

  return {
    agentId: 'action-lead',
    jobId: context.jobId,
    success: true,
    data: { actionPackage, report } satisfies ActionLeadOutput,
    evidence: [`action-lead:${nextAction}`, `proposals:${publishableProposals}/${proposalCount}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  };
};
