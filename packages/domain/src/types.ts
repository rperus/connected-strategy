/**
 * @cs/domain — types.ts
 * Full domain type contracts for Connected Strategy platform.
 * All scoring is transparent, formula-based, and human-editable.
 * Every entity maps to Sense/Transmit/Analyze/React/Repeat and
 * Recognize/Request/Respond/Repeat loops.
 */

// ─── Loop Phases ────────────────────────────────────────────────────────────
export type SenseTransmitPhase = 'Sense' | 'Transmit' | 'Analyze' | 'React' | 'Repeat';
export type RecognizeRequestPhase = 'Recognize' | 'Request' | 'Respond' | 'Repeat';

export interface LoopMapping {
  entityId: string;
  entityType: 'proposal' | 'signal' | 'journey' | 'worksheet';
  senseTransmitPhase: SenseTransmitPhase;
  recognizeRequestPhase: RecognizeRequestPhase;
  justification: string;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export type ProjectMaturity = 'nascent' | 'developing' | 'mature' | 'legacy';

export interface Project {
  id: string;
  name: string;
  path: string;
  stack: string[];
  maturity: ProjectMaturity;
  lastScanned?: string;
  tags: string[];
  platformId?: string; // for multi-platform support
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Worksheet Types ─────────────────────────────────────────────────────────
export type WorksheetQuestionType =
  | 'text'
  | 'number'
  | 'scale'          // 1-10 slider
  | 'choice'         // single option
  | 'multi-choice'   // multiple options
  | 'boolean'
  | 'evidence-link'; // attach evidence

export type WorksheetStatus = 'draft' | 'active' | 'archived';
export type AnswerConfidence = 'observed' | 'inferred' | 'confirmed';

export interface WorksheetQuestion {
  id: string;
  text: string;
  description?: string;
  type: WorksheetQuestionType;
  options?: string[];
  required: boolean;
  weight?: number;            // weight for scoring calculations
  loopPhase?: SenseTransmitPhase | RecognizeRequestPhase; // which loop phase this feeds
  tags?: string[];
}

export interface WorksheetSection {
  id: string;
  title: string;
  description?: string;
  questions: WorksheetQuestion[];
}

export interface WorksheetDefinition {
  id: string;
  title: string;
  description: string;
  version: number;
  status: WorksheetStatus;
  sections: WorksheetSection[];
  /** Deprecated: kept for backward compat, use sections instead */
  questions?: WorksheetQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface WorksheetAnswer {
  id: string;
  worksheetId: string;
  projectId: string;
  version: number;
  /** key = questionId, value = answer */
  answers: Record<string, unknown>;
  /** Confidence level per answer */
  confidence: Record<string, AnswerConfidence>;
  completedAt?: string;
  updatedAt: string;
  authorId?: string;
}

export interface WorksheetVersion {
  worksheetId: string;
  projectId: string;
  versionNumber: number;
  snapshot: WorksheetAnswer;
  changedFields: string[];
  createdAt: string;
  reason?: string;
}

// ─── Strategic Metrics ───────────────────────────────────────────────────────
/** All scores are 0-100. Each has a breakdown for transparency. */
export interface ScoreBreakdown {
  /** Components used to compute the score */
  inputs: Record<string, number>;
  /** Formula description */
  formula: string;
  /** Computed score 0-100 */
  score: number;
  /** Human-readable explanation */
  rationale: string;
}

export interface StrategicMetrics {
  projectId: string;
  connectedExperienceScore: number;
  connectedExperienceBreakdown: ScoreBreakdown;
  closedLoopMaturity: number;
  closedLoopMaturityBreakdown: ScoreBreakdown;
  switchingCostIndex: number;
  switchingCostBreakdown: ScoreBreakdown;
  wtpUpliftIndex: number;
  wtpUpliftBreakdown: ScoreBreakdown;
  costReductionPotential: number;
  costReductionBreakdown: ScoreBreakdown;
  competitivePositioningIndex: number;
  competitivePositioningBreakdown: ScoreBreakdown;
  businessModelStrength: number;
  businessModelBreakdown: ScoreBreakdown;
  dataScienceReadiness: number;
  dataScienceBreakdown: ScoreBreakdown;
  architectureResilience: number;
  architectureResilienceBreakdown: ScoreBreakdown;
  strategicAdvantageComposite: number;
  strategicAdvantageBreakdown: ScoreBreakdown;
  calculatedAt: string;
  calculationVersion: string; // formula version tag
}

// ─── Competitive Landscape ───────────────────────────────────────────────────
export type FitType = 'internal' | 'external' | 'dynamic';

export interface ActivitySystemNode {
  id: string;
  label: string;
  description: string;
  isCore: boolean;
  reinforces: string[]; // IDs of other nodes it strengthens
}

export interface Competitor {
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: number;
  wtpPosition?: 'higher' | 'similar' | 'lower';
  costPosition?: 'higher' | 'similar' | 'lower';
  switchingCostLevel?: 'high' | 'medium' | 'low';
  notes?: string;
  updatedAt: string;
}

export interface CompetitiveLandscape {
  projectId: string;
  competitors: Competitor[];
  internalFit: string;   // activity system coherence
  externalFit: string;   // customer value alignment
  dynamicFit: string;    // ability to evolve
  activitySystem: ActivitySystemNode[];
  wtpNarrative: string;
  costNarrative: string;
  differentiationChoices: string[];
  convergenceRisks: string[];
  updatedAt: string;
}

// ─── Business Model Profile ──────────────────────────────────────────────────
export interface BusinessModelProfile {
  projectId: string;
  valueProposition: string;
  targetCustomerSegments: string[];
  revenueStreams: string[];
  costStructure: string[];
  keyResources: string[];
  keyActivities: string[];
  keyPartners: string[];
  channels: string[];
  customerRelationships: string[];
  activitySystem: ActivitySystemNode[];
  connectedStrategyType?: 'respond-to-desire' | 'curated-offering' | 'coach-behavior' | 'automatic-execution';
  moatSources: string[];
  updatedAt: string;
}

// ─── Customer Journey ────────────────────────────────────────────────────────
export interface JourneyStep {
  id: string;
  label: string;
  description: string;
  userEffort: 'low' | 'medium' | 'high';
  isRedundant: boolean;
  informationFlow?: string;
  senseTransmitPhase: SenseTransmitPhase;
  recognizeRequestPhase: RecognizeRequestPhase;
}

export interface JourneyPainPoint {
  id: string;
  stepId: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  wtpImpact: boolean;
  costImpact: boolean;
  responseType?: 'respond-to-desire' | 'curated-offering' | 'coach-behavior' | 'automatic-execution';
}

export interface CustomerJourney {
  id: string;
  projectId: string;
  title: string;
  actor: string;
  steps: JourneyStep[];
  painPoints: JourneyPainPoint[];
  learningOpportunities: string[];
  updatedAt: string;
}

// ─── Improvement Proposals ───────────────────────────────────────────────────
export type ProposalStatus = 'draft' | 'approved' | 'rejected' | 'implemented' | 'archived';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ChangeType = 'feature' | 'architecture' | 'process' | 'data' | 'ui' | 'infra' | 'docs';

export interface StrategicMapping {
  raisesWTP: boolean;
  reducesCost: boolean;
  increasesSwitchingCosts: boolean;
  improvesActivitySystem: boolean;
  strengthensBusinessModel: boolean;
  senseTransmitPhase: SenseTransmitPhase;
  recognizeRequestPhase: RecognizeRequestPhase;
}

export interface ImprovementProposal {
  id: string;
  projectId: string;
  title: string;
  context: string;
  evidence: string[];
  expectedImpact: string;
  risk: string;
  riskLevel: RiskLevel;
  acceptanceCriteria: string[];
  changeType: ChangeType;
  affectedComponents: string[];
  strategicMapping: StrategicMapping;
  status: ProposalStatus;
  sourceAgents?: string[];
  validationPlan?: string;
  rollbackPlan?: string;
  requiresHumanApproval: boolean;
  generatedArtifacts?: string[];
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  implementedAt?: string;
}

// ─── Evidence ────────────────────────────────────────────────────────────────
export type EvidenceType = 'file' | 'url' | 'metric' | 'worksheet' | 'signal' | 'log' | 'test';

export interface EvidenceLink {
  id: string;
  proposalId?: string;
  worksheetId?: string;
  type: EvidenceType;
  reference: string;
  description: string;
  confidence: AnswerConfidence;
  createdAt: string;
}

// ─── Strategy Signals ────────────────────────────────────────────────────────
export type SignalSource =
  | 'backend_log'
  | 'frontend_error'
  | 'user_event'
  | 'ai_cost'
  | 'agent_trace'
  | 'test_result'
  | 'deploy_state'
  | 'integration_check';

export interface StrategySignal {
  id: string;
  projectId: string;
  source: SignalSource;
  category: string;
  payload: Record<string, unknown>;
  senseTransmitPhase: SenseTransmitPhase;
  capturedAt: string;
  processedAt?: string;
  linkedProposalId?: string;
}

// ─── Launch Profile ──────────────────────────────────────────────────────────
export interface LaunchProfile {
  projectId: string;
  stack: string;
  devCommand: string;
  buildCommand?: string;
  preferredPort: number;
  healthUrl?: string;
  envOverrides: Record<string, string>;
  sessionName?: string;
  startupDelayMs?: number;
  dependsOn?: string[]; // other projectIds that must start first
}

// ─── Information Flow ────────────────────────────────────────────────────────
export interface InformationFlow {
  id: string;
  projectId: string;
  trigger: string;
  source: string;
  frequency: 'real-time' | 'periodic' | 'on-demand' | 'manual';
  richness: 'low' | 'medium' | 'high';
  inferenceQuality: 'low' | 'medium' | 'high';
  userEffort: 'low' | 'medium' | 'high';
  improvementIdeas: string[];
  sensePhase: SenseTransmitPhase;
}

// ─── Scoring Weights (editable per project) ──────────────────────────────────
export interface ScoringWeights {
  projectId: string;
  connectedExperience: Record<string, number>;
  closedLoopMaturity: Record<string, number>;
  switchingCost: Record<string, number>;
  wtpUplift: Record<string, number>;
  costReduction: Record<string, number>;
  competitivePositioning: Record<string, number>;
  businessModelStrength: Record<string, number>;
  dataScienceReadiness: Record<string, number>;
  architectureResilience: Record<string, number>;
  strategicAdvantageComposite: Record<string, number>;
  updatedAt: string;
  updatedBy?: string;
}

export function defaultScoringWeights(projectId: string): ScoringWeights {
  return {
    projectId,
    connectedExperience: { respondToDesire: 0.25, curatedOffering: 0.25, coachBehavior: 0.25, automaticExecution: 0.25 },
    closedLoopMaturity: { senseQuality: 0.3, transmitCoverage: 0.2, analyzeDepth: 0.3, reactSpeed: 0.2 },
    switchingCost: { dataLock: 0.3, habitFormation: 0.3, integrationDepth: 0.25, networkEffect: 0.15 },
    wtpUplift: { valuePerception: 0.4, painResolution: 0.35, convenienceDelta: 0.25 },
    costReduction: { automationCoverage: 0.4, manualOpsReduction: 0.35, supportBurdenReduction: 0.25 },
    competitivePositioning: { internalFit: 0.3, externalFit: 0.3, dynamicFit: 0.2, differentiationClarity: 0.2 },
    businessModelStrength: { revenueModelClarity: 0.25, moatDepth: 0.3, scalability: 0.25, customerRelationshipDepth: 0.2 },
    dataScienceReadiness: { dataAvailability: 0.3, instrumentationCoverage: 0.3, modelingCapability: 0.2, rigorLevel: 0.2 },
    architectureResilience: { modularity: 0.25, testCoverage: 0.25, observability: 0.25, recoverability: 0.25 },
    strategicAdvantageComposite: {
      connectedExperience: 0.15,
      closedLoopMaturity: 0.12,
      switchingCost: 0.12,
      wtpUplift: 0.12,
      costReduction: 0.1,
      competitivePositioning: 0.12,
      businessModelStrength: 0.12,
      dataScienceReadiness: 0.08,
      architectureResilience: 0.07,
    },
    updatedAt: new Date().toISOString(),
  };
}
