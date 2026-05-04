/**
 * @cs/domain — index.ts  (SET-02 extended)
 *
 * Re-exports all domain contracts from their individual modules.
 * Workers: SET-02 owns this package exclusively.
 * Others may import from @cs/domain but must not modify it.
 */

// Full type system
export type {
  // Loop phases
  SenseTransmitPhase,
  RecognizeRequestPhase,
  LoopMapping,
  // Project
  Project,
  ProjectMaturity,
  // Worksheets
  WorksheetQuestionType,
  WorksheetStatus,
  AnswerConfidence,
  WorksheetQuestion,
  WorksheetSection,
  WorksheetDefinition,
  WorksheetAnswer,
  WorksheetVersion,
  // Scoring
  ScoreBreakdown,
  StrategicMetrics,
  // Competitive
  FitType,
  ActivitySystemNode,
  Competitor,
  CompetitiveLandscape,
  // Business model
  BusinessModelProfile,
  // Customer journey
  JourneyStep,
  JourneyPainPoint,
  CustomerJourney,
  // Proposals
  ProposalStatus,
  RiskLevel,
  ChangeType,
  StrategicMapping,
  ImprovementProposal,
  // Evidence
  EvidenceType,
  EvidenceLink,
  // Signals
  SignalSource,
  StrategySignal,
  // Launch
  LaunchProfile,
  // Information flow
  InformationFlow,
  // Scoring weights
  ScoringWeights,
  // Efficiency Frontier (V2)
  EfficiencyFrontierData,
  // Strategy Matrix 5×4 (V2)
  ConnectedExperience,
  ConnectionArchitecture,
  StrategyMatrixCell,
  StrategyMatrix,
  // Project intelligence (skills, workflows, service access)
  ProjectSkill,
  ProjectWorkflow,
  ServiceAccess,
  // STAR Deconstruction (V2)
  STARPhase,
  CustomerJourneyPhase,
  STARCell,
  STARDeconstruction,
} from './types.js';

export { defaultScoringWeights } from './types.js';

// Scoring engine
export {
  scoreConnectedExperience,
  scoreClosedLoopMaturity,
  scoreSwitchingCostIndex,
  scoreWtpUpliftIndex,
  scoreCostReductionPotential,
  scoreCompetitivePositioningIndex,
  scoreBusinessModelStrength,
  scoreDataScienceReadiness,
  scoreArchitectureResilience,
  scoreStrategicAdvantageComposite,
  computeStrategicMetrics,
} from './scoring.js';

// Worksheet definitions and registry
export {
  WS01_PROBLEM_ACTORS,
  WS02_CONNECTED_LOOP,
  WS03_SWITCHING_COSTS,
  WS04_MVP,
  WS05_CANONICAL_DATA,
  WS06_CLOSED_LOOP,
  WS07_AGENT_DESIGN,
  WS08_DASHBOARDS,
  WS09_COMPLIANCE,
  WS10_COMPETITIVE,
  WS11_GTM,
  WS12_EFFICIENCY_FRONTIER,
  WS13_STRATEGY_MATRIX,
  WS14_STAR_DECONSTRUCTION,
  ALL_WORKSHEETS,
  getWorksheetById,
  getAllQuestionIds,
  getScoringQuestions,
} from './worksheets.js';

export * from './v3/worksheets-canonical.js';
export * from './v3/competitive-canonical.js';
