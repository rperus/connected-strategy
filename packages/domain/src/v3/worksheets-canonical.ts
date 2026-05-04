export const JOURNEY_STAGES = [
  'latent_need',
  'awareness',
  'search',
  'decide',
  'order_pay',
  'receive',
  'experience',
  'post_purchase',
] as const;
export type JourneyStage = typeof JOURNEY_STAGES[number];

export const CONNECTED_MODES = [
  'respond_to_desire',
  'curated_offering',
  'coach_behavior',
  'automatic_execution',
] as const;
export type ConnectedMode = typeof CONNECTED_MODES[number];

export const CONNECTION_ARCHITECTURES = [
  'connected_producer',
  'connected_retailer',
  'market_maker',
  'crowd_orchestrator',
  'p2p_network_creator',
] as const;
export type ConnectionArchitecture = typeof CONNECTION_ARCHITECTURES[number];

export const STAR_DIMENSIONS = ['sense', 'transmit', 'analyze', 'react'] as const;
export type StarDimension = typeof STAR_DIMENSIONS[number];

export const SUBFUNCTIONS_4R9 = [
  // Recognize
  'become_aware',
  // Request
  'search_decide',
  'order',
  'pay',
  // Respond
  'receive',
  'experience',
  'after_sale',
  // Repeat
  'learn_connect',
  'monetize',
] as const;
export type Subfunction = typeof SUBFUNCTIONS_4R9[number];

// ─── WS01 + WS02 — Customer Journey + WTP/Pain ──────────────────────────────
export interface WS01_JourneyMap {
  scope: { customerSegment: string; useCase: string };
  stages: Record<JourneyStage, {
    underlyingNeed: string;
    customerActions: string[];
    decisionFactors: string[];
    touchpoints: string[];
    painPoints: string[];                     // ← WS02
    wtpDrivers: Array<{                       // ← WS02
      name: string;
      relativeScore: '++' | '+' | '0' | '-' | '--';   // vs competitor baseline
      competitorScores: Record<string, '++' | '+' | '0' | '-' | '--'>;
    }>;
  }>;
}

// ─── WS03 — Information Flow ─────────────────────────────────────────────────
export interface WS03_InfoFlow {
  grid: Record<JourneyStage, {
    description: string;
    trigger: string;
    frequency: 'event' | 'continuous' | 'periodic' | 'on_demand' | 'none';
    richness: 'low' | 'medium' | 'high';
    customerEffort: 'low' | 'medium' | 'high';
    inferenceParty: 'customer' | 'firm' | 'algorithm' | 'shared';
    improvementIdea: string;
  }>;
}

// ─── WS04 — Why-How Ladder ───────────────────────────────────────────────────
export interface WS04_WhyHowLadder {
  rungs: Array<{
    level: number;          // 1 = transactional, ↑ = deeper purpose
    statement: string;
    whyAbove?: string;      // why goes UP the ladder
    howBelow?: string;      // how goes DOWN the ladder
  }>;
  topPurpose: string;       // the deepest "in the eyes of the customer..."
}

// ─── WS05 — Response × Stage Matrix ──────────────────────────────────────────
export interface WS05_ResponseMatrix {
  cells: Record<ConnectedMode, Record<JourneyStage, {
    response: string;
    requiredInfo: string[];
    currentlyImplemented: boolean;
  }>>;
}

// ─── WS06 — Repeat Levels ────────────────────────────────────────────────────
export const REPEAT_LEVELS = {
  1: 'unified_experience',
  2: 'improved_customization',
  3: 'meta_data_insights',
  4: 'trusted_partner',
} as const;

export interface WS06_RepeatLearning {
  currentLevel: 1 | 2 | 3 | 4;
  evidenceForLevel: string[];
  learning: Record<
    'customization' | 'deeper_needs' | 'optimization' | 'new_offerings' | 'efficiency',
    Array<{ experienceN: number; observation: string; }>
  >;
  pathToNextLevel: string;
}

// ─── WS07 + WS08 — Connected Strategy Matrix ─────────────────────────────────
export interface WS07_ExistingMatrix {
  cells: Record<ConnectedMode, Record<ConnectionArchitecture, {
    selfActivities: string[];
    competitorActivities: Array<{ competitor: string; activity: string }>;
    isWhitespace: boolean;
  }>>;
}

export interface WS08_NewIdeasMatrix {
  ideas: Array<{
    cell: { mode: ConnectedMode; architecture: ConnectionArchitecture };
    description: string;
    businessModel: string;
    requiredConnections: string[];
    informationFlows: string[];
    revenueLevers: Array<'what' | 'when' | 'who' | 'why' | 'currency'>;
    feasibility: 1 | 2 | 3 | 4 | 5;
  }>;
}

// ─── WS09 / WS10 / WS11 — STAR × Subfunction Grid ────────────────────────────
export interface WS09_SubfunctionGrid {
  cells: Record<StarDimension, Record<Subfunction, { description: string }>>;
}

export interface WS10_TechSolutions {
  cells: Record<StarDimension, Record<Subfunction, {
    currentTech: string;
    selectionScores: { convenience: -2|-1|0|1|2; safety: -2|-1|0|1|2; cost: -2|-1|0|1|2 };
    appliedIn: string;   // ej: "auth in /api/login"
  }>>;
}

export interface WS11_EmergingTech {
  cells: Record<StarDimension, Record<Subfunction, {
    emergingTechCandidates: Array<{ name: string; readinessLevel: 1|2|3|4|5|6|7|8|9; unlocks: string }>;
  }>>;
}
