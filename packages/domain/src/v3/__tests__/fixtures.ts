import type {
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
} from '../worksheets-canonical.js';
import type {
  FiveForcesAnalysis,
  ScenarioAnalysis,
  CompetitorProfile,
  DriverScore,
  ActivitySystemMap,
  ThreeFitsAssessment,
  FrontierAnalysis
} from '../competitive-canonical.js';

// TODO: replace with real Sun King data from PDF
export const sunkingWS01: WS01_JourneyMap = {
  scope: { customerSegment: 'Off-grid households in Africa', useCase: 'Getting reliable lighting' },
  stages: {
    latent_need: { underlyingNeed: 'See at night', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    awareness: { underlyingNeed: 'Discover options', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    search: { underlyingNeed: 'Compare lamps', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    decide: { underlyingNeed: 'Choose lamp', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    order_pay: { underlyingNeed: 'Buy lamp', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    receive: { underlyingNeed: 'Get lamp', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    experience: { underlyingNeed: 'Use lamp', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] },
    post_purchase: { underlyingNeed: 'Fix or upgrade lamp', customerActions: [], decisionFactors: [], touchpoints: [], painPoints: [], wtpDrivers: [] }
  }
};

export const sunkingWS03: WS03_InfoFlow = {
  grid: {
    latent_need: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    awareness: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    search: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    decide: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    order_pay: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    receive: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    experience: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
    post_purchase: { description: '...', trigger: '...', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: '...' },
  }
};

export const sunkingWS04: WS04_WhyHowLadder = {
  rungs: [{ level: 1, statement: 'Buy lamp' }],
  topPurpose: 'Have light at night'
};

const createEmptyRecord = <K extends string | number | symbol, V>(keys: readonly K[], val: V): Record<K, V> => {
  const result = {} as Record<K, V>;
  keys.forEach(k => result[k] = val);
  return result;
};

import { CONNECTED_MODES, JOURNEY_STAGES, CONNECTION_ARCHITECTURES, STAR_DIMENSIONS, SUBFUNCTIONS_4R9 } from '../worksheets-canonical.js';

export const sunkingWS05: WS05_ResponseMatrix = {
  cells: createEmptyRecord(CONNECTED_MODES, createEmptyRecord(JOURNEY_STAGES, { response: '...', requiredInfo: [], currentlyImplemented: false }))
};

export const sunkingWS06: WS06_RepeatLearning = {
  currentLevel: 1,
  evidenceForLevel: [],
  learning: {
    customization: [],
    deeper_needs: [],
    optimization: [],
    new_offerings: [],
    efficiency: []
  },
  pathToNextLevel: '...'
};

export const sunkingWS07: WS07_ExistingMatrix = {
  cells: createEmptyRecord(CONNECTED_MODES, createEmptyRecord(CONNECTION_ARCHITECTURES, { selfActivities: [], competitorActivities: [], isWhitespace: true }))
};

export const sunkingWS08: WS08_NewIdeasMatrix = {
  ideas: []
};

export const sunkingWS09: WS09_SubfunctionGrid = {
  cells: createEmptyRecord(STAR_DIMENSIONS, createEmptyRecord(SUBFUNCTIONS_4R9, { description: '...' }))
};

export const sunkingWS10: WS10_TechSolutions = {
  cells: createEmptyRecord(STAR_DIMENSIONS, createEmptyRecord(SUBFUNCTIONS_4R9, { currentTech: '...', selectionScores: { convenience: 0, safety: 0, cost: 0 }, appliedIn: '...' }))
};

export const sunkingWS11: WS11_EmergingTech = {
  cells: createEmptyRecord(STAR_DIMENSIONS, createEmptyRecord(SUBFUNCTIONS_4R9, { emergingTechCandidates: [] }))
};

export const sunkingFiveForces: FiveForcesAnalysis = {
  customers: { attractiveness: 3, drivers: [], evidence: [] },
  suppliers: { attractiveness: 3, drivers: [], evidence: [] },
  rivalry: { attractiveness: 3, drivers: [], evidence: [] },
  entrants: { attractiveness: 3, drivers: [], evidence: [] },
  substitutes: { attractiveness: 3, drivers: [], evidence: [] },
  industryAttractiveness: 3
};

export const sunkingScenarios: ScenarioAnalysis = {
  uncertainties: [{ name: 'A', high: 'H', low: 'L' }, { name: 'B', high: 'H', low: 'L' }],
  scenarios: []
};

export const sunkingCompetitor: CompetitorProfile = {
  name: 'Kerosene',
  url: 'https://example.com',
  pricing: '...',
  positioning: '...',
  recentMoves: [],
  wtpScores: {},
  costScores: {}
};

export const sunkingDriverScore: DriverScore = {
  name: 'Reliability',
  weight: 1,
  selfScore: 1,
  competitorScores: {}
};

export const sunkingActivitySystem: ActivitySystemMap = {
  positioning: [],
  coreChoices: [],
  supportingActivities: [],
  reinforcementMatrix: {},
  oeVsSp: {},
  mermaid: 'graph TD;',
  imitabilityScore: 0.5
};

export const sunkingThreeFits: ThreeFitsAssessment = {
  internal: { score: 50, justification: '...', gaps: [] },
  external: { score: 50, justification: '...', gaps: [] },
  dynamic: { score: 50, justification: '...', gaps: [] }
};

export const sunkingFrontier: FrontierAnalysis = {
  axes: { wtpDrivers: [], costDrivers: [] },
  points: [],
  paretoFront: [],
  selfPosition: 'on',
  candidateMoves: []
};
