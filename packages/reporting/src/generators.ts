/**
 * @cs/reporting — generators.ts
 * Functions to build structured report objects from domain data.
 * Worker: SET-06
 */

import type {
  Project,
  StrategicMetrics,
  WorksheetAnswer,
  ImprovementProposal,
  EvidenceLink,
} from '@cs/domain';
import { ALL_WORKSHEETS } from '@cs/domain';

import type {
  PortfolioReport,
  PortfolioSummaryRow,
  ProjectReport,
  MetricRow,
  ProposalSummaryRow,
  WorksheetCompletionRow,
  ProposalReport,
  EvidenceSummaryRow,
  ReportMeta,
} from './types.js';
import { PORTFOLIO_TEMPLATE, PROJECT_TEMPLATE, PROPOSAL_TEMPLATE } from './templates.js';

const GENERATOR_VERSION = '1.0.0';

// ─── Utilities ────────────────────────────────────────────────────────────────

function makeMeta(
  type: 'portfolio' | 'project' | 'proposal',
  title: string,
  templateId: string,
): ReportMeta {
  return {
    id: `report-${type}-${Date.now()}`,
    title,
    type,
    templateId,
    generatedAt: new Date().toISOString(),
    generatorVersion: GENERATOR_VERSION,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ─── Portfolio Report ─────────────────────────────────────────────────────────

/**
 * Build a portfolio-level report comparing all projects by their strategic metrics.
 *
 * @param projects - Array of all projects in the portfolio
 * @param metricsMap - Map of projectId → StrategicMetrics (may be partial)
 */
export function generatePortfolioReport(
  projects: Project[],
  metricsMap: Map<string, StrategicMetrics>,
): PortfolioReport {
  const rows: PortfolioSummaryRow[] = projects.map((p) => {
    const m = metricsMap.get(p.id);
    return {
      projectId: p.id,
      projectName: p.name,
      maturity: p.maturity,
      strategicAdvantage: m?.strategicAdvantageComposite ?? 0,
      connectedExperience: m?.connectedExperienceScore ?? 0,
      closedLoopMaturity: m?.closedLoopMaturity ?? 0,
      switchingCostIndex: m?.switchingCostIndex ?? 0,
      wtpUplift: m?.wtpUpliftIndex ?? 0,
      dataScienceReadiness: m?.dataScienceReadiness ?? 0,
      architectureResilience: m?.architectureResilience ?? 0,
      stack: p.stack,
      tags: p.tags,
    };
  });

  const sorted = [...rows].sort((a, b) => b.strategicAdvantage - a.strategicAdvantage);
  const composites = rows.map((r) => r.strategicAdvantage).filter((s) => s > 0);

  const meta = makeMeta(
    'portfolio',
    `Portfolio Strategic Report — ${new Date().toLocaleDateString()}`,
    PORTFOLIO_TEMPLATE.id,
  );

  return {
    meta,
    totalProjects: projects.length,
    averageStrategicAdvantage: avg(composites),
    topProject: sorted[0]?.projectId ?? null,
    weakestProject: sorted[sorted.length - 1]?.projectId ?? null,
    projects: rows,
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        content: {
          totalProjects: projects.length,
          averageStrategicAdvantage: avg(composites),
          topProject: sorted[0]?.projectName ?? 'N/A',
          weakestProject: sorted[sorted.length - 1]?.projectName ?? 'N/A',
          rankedProjects: sorted.map((r) => ({
            name: r.projectName,
            score: r.strategicAdvantage,
          })),
        },
      },
      {
        id: 'portfolio-overview',
        title: 'Portfolio Overview',
        content: { rows },
      },
      {
        id: 'project-rankings',
        title: 'Project Rankings',
        content: { ranked: sorted },
      },
      {
        id: 'metric-heatmap',
        title: 'Metric Heatmap',
        content: {
          metrics: [
            'connectedExperience',
            'closedLoopMaturity',
            'switchingCostIndex',
            'wtpUplift',
            'dataScienceReadiness',
            'architectureResilience',
          ],
          data: rows.reduce<Record<string, Record<string, number>>>((acc, r) => {
            acc[r.projectId] = {
              connectedExperience: r.connectedExperience,
              closedLoopMaturity: r.closedLoopMaturity,
              switchingCostIndex: r.switchingCostIndex,
              wtpUplift: r.wtpUplift,
              dataScienceReadiness: r.dataScienceReadiness,
              architectureResilience: r.architectureResilience,
            };
            return acc;
          }, {}),
        },
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        content: {
          note: 'Run individual project reports for detailed improvement proposals.',
          priorityActions: sorted
            .filter((r) => r.strategicAdvantage < 50)
            .map((r) => ({
              projectId: r.projectId,
              projectName: r.projectName,
              score: r.strategicAdvantage,
              suggestion: 'Score below 50 — prioritize worksheet completion and proposal review.',
            })),
        },
      },
    ],
  };
}

// ─── Project Report ───────────────────────────────────────────────────────────

/**
 * Build a deep-dive report for a single project.
 *
 * @param project - The project entity
 * @param metrics - Strategic metrics for this project
 * @param worksheetAnswers - All worksheet answers for this project
 * @param proposals - All improvement proposals for this project
 */
export function generateProjectReport(
  project: Project,
  metrics: StrategicMetrics,
  worksheetAnswers: WorksheetAnswer[],
  proposals: ImprovementProposal[],
): ProjectReport {
  // ─ Metric rows ─────────────────────────────────────────────────────────────
  const metricRows: MetricRow[] = [
    {
      name: 'Connected Experience Score',
      score: metrics.connectedExperienceScore,
      formula: metrics.connectedExperienceBreakdown.formula,
      rationale: metrics.connectedExperienceBreakdown.rationale,
      inputs: metrics.connectedExperienceBreakdown.inputs,
    },
    {
      name: 'Closed Loop Maturity',
      score: metrics.closedLoopMaturity,
      formula: metrics.closedLoopMaturityBreakdown.formula,
      rationale: metrics.closedLoopMaturityBreakdown.rationale,
      inputs: metrics.closedLoopMaturityBreakdown.inputs,
    },
    {
      name: 'Switching Cost Index',
      score: metrics.switchingCostIndex,
      formula: metrics.switchingCostBreakdown.formula,
      rationale: metrics.switchingCostBreakdown.rationale,
      inputs: metrics.switchingCostBreakdown.inputs,
    },
    {
      name: 'WTP Uplift Index',
      score: metrics.wtpUpliftIndex,
      formula: metrics.wtpUpliftBreakdown.formula,
      rationale: metrics.wtpUpliftBreakdown.rationale,
      inputs: metrics.wtpUpliftBreakdown.inputs,
    },
    {
      name: 'Cost Reduction Potential',
      score: metrics.costReductionPotential,
      formula: metrics.costReductionBreakdown.formula,
      rationale: metrics.costReductionBreakdown.rationale,
      inputs: metrics.costReductionBreakdown.inputs,
    },
    {
      name: 'Competitive Positioning Index',
      score: metrics.competitivePositioningIndex,
      formula: metrics.competitivePositioningBreakdown.formula,
      rationale: metrics.competitivePositioningBreakdown.rationale,
      inputs: metrics.competitivePositioningBreakdown.inputs,
    },
    {
      name: 'Business Model Strength',
      score: metrics.businessModelStrength,
      formula: metrics.businessModelBreakdown.formula,
      rationale: metrics.businessModelBreakdown.rationale,
      inputs: metrics.businessModelBreakdown.inputs,
    },
    {
      name: 'Data Science Readiness',
      score: metrics.dataScienceReadiness,
      formula: metrics.dataScienceBreakdown.formula,
      rationale: metrics.dataScienceBreakdown.rationale,
      inputs: metrics.dataScienceBreakdown.inputs,
    },
    {
      name: 'Architecture Resilience',
      score: metrics.architectureResilience,
      formula: metrics.architectureResilienceBreakdown.formula,
      rationale: metrics.architectureResilienceBreakdown.rationale,
      inputs: metrics.architectureResilienceBreakdown.inputs,
    },
    {
      name: 'Strategic Advantage Composite',
      score: metrics.strategicAdvantageComposite,
      formula: metrics.strategicAdvantageBreakdown.formula,
      rationale: metrics.strategicAdvantageBreakdown.rationale,
      inputs: metrics.strategicAdvantageBreakdown.inputs,
    },
  ];

  // ─ Worksheet completion ─────────────────────────────────────────────────────
  const answerIndex = new Map<string, WorksheetAnswer>();
  for (const ans of worksheetAnswers) {
    answerIndex.set(ans.worksheetId, ans);
  }

  const worksheetCompletion: WorksheetCompletionRow[] = ALL_WORKSHEETS.map((ws) => {
    const ans = answerIndex.get(ws.id);
    const totalQuestions = ws.sections.reduce((s, sec) => s + sec.questions.length, 0);
    const answeredCount = ans
      ? Object.keys(ans.answers).filter((k) => ans.answers[k] !== undefined && ans.answers[k] !== '')
          .length
      : 0;
    return {
      worksheetId: ws.id,
      worksheetTitle: ws.title,
      answeredCount,
      totalQuestions,
      completedAt: ans?.completedAt,
      confidence: ans?.confidence ?? {},
    };
  });

  // ─ Proposal rows ────────────────────────────────────────────────────────────
  const proposalRows: ProposalSummaryRow[] = proposals.map((p) => ({
    proposalId: p.id,
    title: p.title,
    status: p.status,
    riskLevel: p.riskLevel,
    changeType: p.changeType,
    raisesWTP: p.strategicMapping.raisesWTP,
    reducesCost: p.strategicMapping.reducesCost,
    increasesSwitchingCosts: p.strategicMapping.increasesSwitchingCosts,
    createdAt: p.createdAt,
  }));

  const meta = makeMeta('project', `${project.name} — Project Report`, PROJECT_TEMPLATE.id);

  return {
    meta,
    projectId: project.id,
    projectName: project.name,
    maturity: project.maturity,
    stack: project.stack,
    tags: project.tags,
    metrics: metricRows,
    worksheetCompletion,
    proposals: proposalRows,
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        content: {
          projectName: project.name,
          maturity: project.maturity,
          strategicAdvantage: metrics.strategicAdvantageComposite,
          totalProposals: proposals.length,
          openProposals: proposals.filter((p) => p.status === 'draft' || p.status === 'approved')
            .length,
          worksheetsCompleted: worksheetCompletion.filter(
            (w) => w.answeredCount === w.totalQuestions,
          ).length,
          totalWorksheets: ALL_WORKSHEETS.length,
        },
      },
      {
        id: 'project-profile',
        title: 'Project Profile',
        content: {
          id: project.id,
          name: project.name,
          path: project.path,
          stack: project.stack,
          maturity: project.maturity,
          tags: project.tags,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
      {
        id: 'scoring-breakdown',
        title: 'Scoring Breakdown',
        content: { metrics: metricRows, calculatedAt: metrics.calculatedAt },
      },
      {
        id: 'worksheet-completion',
        title: 'Worksheet Completion',
        content: { worksheets: worksheetCompletion },
      },
      {
        id: 'improvement-proposals',
        title: 'Improvement Proposals',
        content: { proposals: proposalRows },
      },
      {
        id: 'strategic-mapping',
        title: 'Strategic Loop Mapping',
        content: {
          sensetransmitLoop: 'Sense → Transmit → Analyze → React → Repeat',
          recognizerequestLoop: 'Recognize → Request → Respond → Repeat',
          proposalsByPhase: proposals.reduce<Record<string, number>>((acc, p) => {
            const phase = p.strategicMapping.senseTransmitPhase;
            acc[phase] = (acc[phase] ?? 0) + 1;
            return acc;
          }, {}),
        },
      },
      {
        id: 'next-actions',
        title: 'Next Actions',
        content: {
          incompleteWorksheets: worksheetCompletion
            .filter((w) => w.answeredCount < w.totalQuestions)
            .map((w) => ({
              worksheetId: w.worksheetId,
              title: w.worksheetTitle,
              remaining: w.totalQuestions - w.answeredCount,
            })),
          pendingProposals: proposals
            .filter((p) => p.status === 'draft')
            .map((p) => ({ proposalId: p.id, title: p.title })),
        },
      },
    ],
  };
}

// ─── Proposal Report ──────────────────────────────────────────────────────────

/**
 * Build a single-proposal dossier with context, evidence, and strategic mapping.
 *
 * @param proposal - The improvement proposal entity
 * @param evidence - Evidence links attached to this proposal
 */
export function generateProposalReport(
  proposal: ImprovementProposal,
  evidence: EvidenceLink[],
): ProposalReport {
  const evidenceRows: EvidenceSummaryRow[] = evidence.map((e) => ({
    id: e.id,
    type: e.type,
    reference: e.reference,
    description: e.description,
    confidence: e.confidence,
  }));

  const meta = makeMeta('proposal', proposal.title, PROPOSAL_TEMPLATE.id);

  return {
    meta,
    proposalId: proposal.id,
    proposalTitle: proposal.title,
    context: proposal.context,
    objective: proposal.expectedImpact,
    riskLevel: proposal.riskLevel,
    status: proposal.status,
    changeType: proposal.changeType,
    strategicMapping: {
      raisesWTP: proposal.strategicMapping.raisesWTP,
      reducesCost: proposal.strategicMapping.reducesCost,
      increasesSwitchingCosts: proposal.strategicMapping.increasesSwitchingCosts,
      improvesActivitySystem: proposal.strategicMapping.improvesActivitySystem,
      strengthensBusinessModel: proposal.strategicMapping.strengthensBusinessModel,
      senseTransmitPhase: proposal.strategicMapping.senseTransmitPhase,
      recognizeRequestPhase: proposal.strategicMapping.recognizeRequestPhase,
    },
    acceptanceCriteria: proposal.acceptanceCriteria,
    affectedComponents: proposal.affectedComponents,
    evidence: evidenceRows,
    validationPlan: proposal.validationPlan,
    rollbackPlan: proposal.rollbackPlan,
    sections: [
      {
        id: 'proposal-header',
        title: 'Proposal Header',
        content: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          riskLevel: proposal.riskLevel,
          changeType: proposal.changeType,
          requiresHumanApproval: proposal.requiresHumanApproval,
          createdAt: proposal.createdAt,
          updatedAt: proposal.updatedAt,
        },
      },
      {
        id: 'strategic-context',
        title: 'Strategic Context',
        content: {
          context: proposal.context,
          expectedImpact: proposal.expectedImpact,
          strategicMapping: proposal.strategicMapping,
        },
      },
      {
        id: 'evidence-summary',
        title: 'Evidence Summary',
        content: {
          rawEvidence: proposal.evidence,
          linkedEvidence: evidenceRows,
        },
      },
      {
        id: 'acceptance-criteria',
        title: 'Acceptance Criteria',
        content: { criteria: proposal.acceptanceCriteria },
      },
      {
        id: 'risk-analysis',
        title: 'Risk Analysis',
        content: {
          risk: proposal.risk,
          riskLevel: proposal.riskLevel,
          rollbackPlan: proposal.rollbackPlan,
        },
      },
      {
        id: 'implementation-notes',
        title: 'Implementation Notes',
        content: {
          affectedComponents: proposal.affectedComponents,
          sourceAgents: proposal.sourceAgents ?? [],
          generatedArtifacts: proposal.generatedArtifacts ?? [],
        },
      },
      {
        id: 'validation-plan',
        title: 'Validation Plan',
        content: {
          plan: proposal.validationPlan ?? 'No validation plan provided.',
        },
      },
    ],
  };
}
