/**
 * @cs/reporting — types.ts
 * Report type contracts for the Connected Strategy platform.
 * Worker: SET-06
 */

// ─── Report template definitions ─────────────────────────────────────────────

export type ReportType = 'portfolio' | 'project' | 'proposal';

export interface ReportTemplate {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  sections: string[];
  printable: boolean;
  version: string;
}

// ─── Report metadata ──────────────────────────────────────────────────────────

export interface ReportMeta {
  id: string;
  title: string;
  type: ReportType;
  templateId: string;
  generatedAt: string;
  generatorVersion: string;
}

// ─── Report section ───────────────────────────────────────────────────────────

export interface ReportSection {
  id: string;
  title: string;
  /** Structured content — varies per section type */
  content: unknown;
}

// ─── Portfolio report ─────────────────────────────────────────────────────────

export interface PortfolioSummaryRow {
  projectId: string;
  projectName: string;
  maturity: string;
  strategicAdvantage: number;
  connectedExperience: number;
  closedLoopMaturity: number;
  switchingCostIndex: number;
  wtpUplift: number;
  dataScienceReadiness: number;
  architectureResilience: number;
  stack: string[];
  tags: string[];
}

export interface PortfolioReport {
  meta: ReportMeta;
  totalProjects: number;
  averageStrategicAdvantage: number;
  topProject: string | null;
  weakestProject: string | null;
  projects: PortfolioSummaryRow[];
  sections: ReportSection[];
}

// ─── Project report ───────────────────────────────────────────────────────────

export interface MetricRow {
  name: string;
  score: number;
  formula: string;
  rationale: string;
  inputs: Record<string, number>;
}

export interface ProposalSummaryRow {
  proposalId: string;
  title: string;
  status: string;
  riskLevel: string;
  changeType: string;
  raisesWTP: boolean;
  reducesCost: boolean;
  increasesSwitchingCosts: boolean;
  createdAt: string;
}

export interface WorksheetCompletionRow {
  worksheetId: string;
  worksheetTitle: string;
  answeredCount: number;
  totalQuestions: number;
  completedAt: string | undefined;
  confidence: Record<string, string>;
}

export interface ProjectReport {
  meta: ReportMeta;
  projectId: string;
  projectName: string;
  maturity: string;
  stack: string[];
  tags: string[];
  metrics: MetricRow[];
  worksheetCompletion: WorksheetCompletionRow[];
  proposals: ProposalSummaryRow[];
  sections: ReportSection[];
}

// ─── Proposal report ─────────────────────────────────────────────────────────

export interface EvidenceSummaryRow {
  id: string;
  type: string;
  reference: string;
  description: string;
  confidence: string;
}

export interface ProposalReport {
  meta: ReportMeta;
  proposalId: string;
  proposalTitle: string;
  context: string;
  objective: string;
  riskLevel: string;
  status: string;
  changeType: string;
  strategicMapping: {
    raisesWTP: boolean;
    reducesCost: boolean;
    increasesSwitchingCosts: boolean;
    improvesActivitySystem: boolean;
    strengthensBusinessModel: boolean;
    senseTransmitPhase: string;
    recognizeRequestPhase: string;
  };
  acceptanceCriteria: string[];
  affectedComponents: string[];
  evidence: EvidenceSummaryRow[];
  validationPlan: string | undefined;
  rollbackPlan: string | undefined;
  sections: ReportSection[];
}
