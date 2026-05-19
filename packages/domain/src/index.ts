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
  WS15_FIVE_FORCES,
  ALL_WORKSHEETS,
  getWorksheetById,
  getAllQuestionIds,
  getScoringQuestions,
} from './worksheets.js';

export type {
  JourneyStage,
  ConnectedMode,
  StarDimension,
  Subfunction,
  WS01_JourneyMap,
  WS03_InfoFlow,
  WS04_WhyHowLadder,
  WS05_ResponseMatrix,
  WS06_RepeatLearning,
  WS07_ExistingMatrix,
  WS08_NewIdeasMatrix,
  WS09_SubfunctionGrid,
  WS10_TechSolutions,
  WS11_EmergingTech,
} from './v3/worksheets-canonical.js';

export {
  JOURNEY_STAGES,
  CONNECTED_MODES,
  CONNECTION_ARCHITECTURES,
  STAR_DIMENSIONS,
  SUBFUNCTIONS_4R9,
  REPEAT_LEVELS
} from './v3/worksheets-canonical.js';

export type {
  FiveForcesAnalysis,
  ForceAnalysis,
  ScenarioAnalysis,
  CompetitorProfile,
  DriverScore,
  ActivitySystemMap,
  ThreeFitsAssessment,
  FrontierAnalysis
} from './v3/competitive-canonical.js';

export {
  journeyStageEnum,
  connectedModeEnum,
  connectionArchitectureEnum,
  starDimensionEnum,
  subfunctionEnum,
  ws01Schema,
  ws03Schema,
  ws04Schema,
  ws05Schema,
  ws06Schema,
  ws07Schema,
  ws08Schema,
  ws09Schema,
  ws10Schema,
  ws11Schema,
  fiveForcesSchema,
  scenarioAnalysisSchema,
  competitorProfileSchema,
  driverScoreSchema,
  activitySystemMapSchema,
  threeFitsAssessmentSchema,
  frontierAnalysisSchema,
  synthesisSchema,
  manifestSchema
} from './v3/schemas.js';
