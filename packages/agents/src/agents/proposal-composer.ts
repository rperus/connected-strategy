/**
 * @cs/agents — proposal-composer.ts
 *
 * Aggregates findings from all specialist analysts and composes
 * ImprovementProposal[] following the domain contract.
 * Each proposal includes context, evidence, expected impact, risk,
 * acceptance criteria, and strategic mapping.
 *
 * Loop phase: React (turning analysis into actionable proposals)
 */

import type { AgentContext, AgentResult, AnalystReport } from '../types.js';
import type { AgentId } from '../types.js';
import type { ImprovementProposal, StrategicMapping, ChangeType, RiskLevel } from '@cs/domain';

const AGENT_ID: AgentId = 'proposal-composer';

// ─── Priority to Risk mapping ─────────────────────────────────────────────────

function priorityToRisk(priority: 'high' | 'medium' | 'low'): RiskLevel {
  switch (priority) {
    case 'high': return 'medium';   // high priority → medium risk (must be done, but carefully)
    case 'medium': return 'low';
    case 'low': return 'low';
  }
}

function changeTypeToString(ct: string): ChangeType {
  const validTypes: ChangeType[] = ['feature', 'architecture', 'process', 'data', 'ui', 'infra', 'docs'];
  return validTypes.includes(ct as ChangeType) ? (ct as ChangeType) : 'feature';
}

// ─── Strategic mapping derivation ─────────────────────────────────────────────

function deriveStrategicMapping(finding: {
  impactOnWTP: 'positive' | 'negative' | 'neutral';
  impactOnCost: 'positive' | 'negative' | 'neutral';
  impactOnSwitchingCosts: 'positive' | 'negative' | 'neutral';
  loopPhase: string;
  category: string;
}): StrategicMapping {
  const loopPhase = finding.loopPhase as StrategicMapping['senseTransmitPhase'];
  const validSTPhases = ['Sense', 'Transmit', 'Analyze', 'React', 'Repeat'];
  const validRRPhases = ['Recognize', 'Request', 'Respond', 'Repeat'];

  return {
    raisesWTP: finding.impactOnWTP === 'positive',
    reducesCost: finding.impactOnCost === 'positive',
    increasesSwitchingCosts: finding.impactOnSwitchingCosts === 'positive',
    improvesActivitySystem: finding.category === 'activity-system' || finding.category === 'modularity',
    strengthensBusinessModel: finding.category === 'revenue-model' || finding.category === 'moat',
    senseTransmitPhase: validSTPhases.includes(loopPhase)
      ? (loopPhase as StrategicMapping['senseTransmitPhase'])
      : 'Analyze',
    recognizeRequestPhase: validRRPhases.includes(loopPhase)
      ? (loopPhase as StrategicMapping['recognizeRequestPhase'])
      : 'Respond',
  };
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateByTitle(proposals: ImprovementProposal[]): ImprovementProposal[] {
  const seen = new Set<string>();
  return proposals.filter((p) => {
    const key = p.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runProposalComposer(
  input: {
    projectId: string;
    reports: AnalystReport[];
  },
  context: AgentContext,
): Promise<AgentResult<ImprovementProposal[]>> {
  const startMs = Date.now();

  try {
    const proposals: ImprovementProposal[] = [];

    for (const report of input.reports) {
      for (const proposal of report.recommendedProposals) {
        // Find the originating finding for richer evidence
        const originFinding = report.findings.find((f) =>
          proposal.title.includes(f.title) || f.title.includes(proposal.title.replace(/^[^:]+:\s*/, '')),
        );

        const strategicMapping = originFinding
          ? deriveStrategicMapping(originFinding)
          : {
              raisesWTP: false,
              reducesCost: false,
              increasesSwitchingCosts: false,
              improvesActivitySystem: false,
              strengthensBusinessModel: false,
              senseTransmitPhase: 'Analyze' as const,
              recognizeRequestPhase: 'Respond' as const,
            };

        const changeType = changeTypeToString(proposal.changeType);
        const riskLevel = priorityToRisk(proposal.priority);

        const ip: ImprovementProposal = {
          id: `prop_${context.jobId}_${proposals.length.toString().padStart(3, '0')}`,
          projectId: input.projectId,
          title: proposal.title,
          context: report.summaryNarrative,
          evidence: originFinding?.evidence ?? [`agent:${report.agentId}`],
          expectedImpact: proposal.rationale,
          risk: riskLevel === 'high'
            ? 'High complexity change. Requires phased rollout and rollback plan.'
            : riskLevel === 'medium'
              ? 'Moderate risk. Validate in staging before production.'
              : 'Low risk. Can be implemented incrementally.',
          riskLevel,
          acceptanceCriteria: [
            `${proposal.title} is implemented and verified in staging.`,
            'No regressions in existing functionality.',
            'Evidence updated in the relevant worksheet.',
          ],
          changeType,
          affectedComponents: [report.agentId],
          strategicMapping,
          status: 'draft',
          sourceAgents: [report.agentId],
          requiresHumanApproval: proposal.priority === 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        proposals.push(ip);
      }
    }

    const deduplicated = deduplicateByTitle(proposals);

    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: true,
      data: deduplicated,
      durationMs: Date.now() - startMs,
      evidence: input.reports.map((r) => `agent:${r.agentId}`),
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
