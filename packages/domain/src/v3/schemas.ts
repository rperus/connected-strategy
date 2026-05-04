import { z } from 'zod';
import {
  JOURNEY_STAGES,
  CONNECTED_MODES,
  CONNECTION_ARCHITECTURES,
  STAR_DIMENSIONS,
  SUBFUNCTIONS_4R9,
} from './worksheets-canonical.js';

export const journeyStageEnum = z.enum(JOURNEY_STAGES);
export const connectedModeEnum = z.enum(CONNECTED_MODES);
export const connectionArchitectureEnum = z.enum(CONNECTION_ARCHITECTURES);
export const starDimensionEnum = z.enum(STAR_DIMENSIONS);
export const subfunctionEnum = z.enum(SUBFUNCTIONS_4R9);

const scoreEnum = z.enum(['++', '+', '0', '-', '--']);
const oneToFiveEnum = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const minusTwoToTwoEnum = z.union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2)]);

// ─── WS01 + WS02
export const ws01Schema = z.object({
  scope: z.object({ customerSegment: z.string().min(1), useCase: z.string().min(1) }),
  stages: z.record(journeyStageEnum, z.object({
    underlyingNeed: z.string(),
    customerActions: z.array(z.string()),
    decisionFactors: z.array(z.string()),
    touchpoints: z.array(z.string()),
    painPoints: z.array(z.string()),
    wtpDrivers: z.array(z.object({
      name: z.string(),
      relativeScore: scoreEnum,
      competitorScores: z.record(z.string(), scoreEnum),
    })),
  })),
});

// ─── WS03
export const ws03Schema = z.object({
  grid: z.record(journeyStageEnum, z.object({
    description: z.string(),
    trigger: z.string(),
    frequency: z.enum(['event', 'continuous', 'periodic', 'on_demand', 'none']),
    richness: z.enum(['low', 'medium', 'high']),
    customerEffort: z.enum(['low', 'medium', 'high']),
    inferenceParty: z.enum(['customer', 'firm', 'algorithm', 'shared']),
    improvementIdea: z.string(),
  })),
});

// ─── WS04
export const ws04Schema = z.object({
  rungs: z.array(z.object({
    level: z.number(),
    statement: z.string(),
    whyAbove: z.string().optional(),
    howBelow: z.string().optional(),
  })),
  topPurpose: z.string(),
});

// ─── WS05
export const ws05Schema = z.object({
  cells: z.record(connectedModeEnum, z.record(journeyStageEnum, z.object({
    response: z.string(),
    requiredInfo: z.array(z.string()),
    currentlyImplemented: z.boolean(),
  }))),
});

// ─── WS06
export const ws06Schema = z.object({
  currentLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  evidenceForLevel: z.array(z.string()),
  learning: z.object({
    customization: z.array(z.object({ experienceN: z.number(), observation: z.string() })),
    deeper_needs: z.array(z.object({ experienceN: z.number(), observation: z.string() })),
    optimization: z.array(z.object({ experienceN: z.number(), observation: z.string() })),
    new_offerings: z.array(z.object({ experienceN: z.number(), observation: z.string() })),
    efficiency: z.array(z.object({ experienceN: z.number(), observation: z.string() })),
  }),
  pathToNextLevel: z.string(),
});

// ─── WS07
export const ws07Schema = z.object({
  cells: z.record(connectedModeEnum, z.record(connectionArchitectureEnum, z.object({
    selfActivities: z.array(z.string()),
    competitorActivities: z.array(z.object({ competitor: z.string(), activity: z.string() })),
    isWhitespace: z.boolean(),
  }))),
});

// ─── WS08
export const ws08Schema = z.object({
  ideas: z.array(z.object({
    cell: z.object({ mode: connectedModeEnum, architecture: connectionArchitectureEnum }),
    description: z.string(),
    businessModel: z.string(),
    requiredConnections: z.array(z.string()),
    informationFlows: z.array(z.string()),
    revenueLevers: z.array(z.enum(['what', 'when', 'who', 'why', 'currency'])),
    feasibility: oneToFiveEnum,
  })),
});

// ─── WS09
export const ws09Schema = z.object({
  cells: z.record(starDimensionEnum, z.record(subfunctionEnum, z.object({ description: z.string() }))),
});

// ─── WS10
export const ws10Schema = z.object({
  cells: z.record(starDimensionEnum, z.record(subfunctionEnum, z.object({
    currentTech: z.string(),
    selectionScores: z.object({
      convenience: minusTwoToTwoEnum,
      safety: minusTwoToTwoEnum,
      cost: minusTwoToTwoEnum,
    }),
    appliedIn: z.string(),
  }))),
});

// ─── WS11
export const ws11Schema = z.object({
  cells: z.record(starDimensionEnum, z.record(subfunctionEnum, z.object({
    emergingTechCandidates: z.array(z.object({
      name: z.string(),
      readinessLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
      unlocks: z.string(),
    })),
  }))),
});

// ─── Competitive ───

const forceAnalysisSchema = z.object({
  attractiveness: oneToFiveEnum,
  drivers: z.array(z.string()),
  evidence: z.array(z.object({ claim: z.string(), sourceUrl: z.string(), date: z.string().optional() })),
});

export const fiveForcesSchema = z.object({
  customers: forceAnalysisSchema,
  suppliers: forceAnalysisSchema,
  rivalry: forceAnalysisSchema,
  entrants: forceAnalysisSchema,
  substitutes: forceAnalysisSchema,
  industryAttractiveness: oneToFiveEnum,
});

export const scenarioAnalysisSchema = z.object({
  uncertainties: z.tuple([
    z.object({ name: z.string(), high: z.string(), low: z.string() }),
    z.object({ name: z.string(), high: z.string(), low: z.string() }),
  ]),
  scenarios: z.array(z.object({
    name: z.string(),
    quadrant: z.enum(['HH', 'HL', 'LH', 'LL']),
    narrative: z.string(),
    strategicImplication: z.string(),
  })),
});

export const competitorProfileSchema = z.object({
  name: z.string(),
  url: z.string(),
  pricing: z.string(),
  positioning: z.string(),
  recentMoves: z.array(z.object({ date: z.string(), description: z.string(), sourceUrl: z.string() })),
  wtpScores: z.record(z.string(), scoreEnum),
  costScores: z.record(z.string(), scoreEnum),
});

export const driverScoreSchema = z.object({
  name: z.string(),
  weight: z.number(),
  selfScore: minusTwoToTwoEnum,
  competitorScores: z.record(z.string(), minusTwoToTwoEnum),
  evidence: z.string().optional(),
});

export const activitySystemMapSchema = z.object({
  positioning: z.array(z.string()),
  coreChoices: z.array(z.object({
    id: z.string(),
    label: z.string(),
    centrality: z.number(),
    valueChainStage: z.enum(['inbound', 'operations', 'outbound', 'marketing', 'service', 'support']),
  })),
  supportingActivities: z.array(z.object({ id: z.string(), label: z.string() })),
  reinforcementMatrix: z.record(z.string(), z.array(z.string())),
  oeVsSp: z.record(z.string(), z.enum(['OE', 'SP'])),
  mermaid: z.string(),
  imitabilityScore: z.number(),
});

export const threeFitsAssessmentSchema = z.object({
  internal: z.object({ score: z.number(), justification: z.string(), gaps: z.array(z.string()) }),
  external: z.object({ score: z.number(), justification: z.string(), gaps: z.array(z.string()) }),
  dynamic: z.object({ score: z.number(), justification: z.string(), gaps: z.array(z.string()) }),
});

export const frontierAnalysisSchema = z.object({
  axes: z.object({ wtpDrivers: z.array(z.string()), costDrivers: z.array(z.string()) }),
  points: z.array(z.object({
    entity: z.string(),
    wtp: z.number(),
    cost: z.number(),
    dominatedBy: z.array(z.string()),
  })),
  paretoFront: z.array(z.string()),
  selfPosition: z.enum(['below', 'on', 'above']),
  candidateMoves: z.array(z.object({
    moveId: z.string(),
    name: z.string(),
    description: z.string(),
    currentPoint: z.object({ wtp: z.number(), cost: z.number() }),
    projectedPoint: z.object({ wtp: z.number(), cost: z.number() }),
    breaksTradeOffs: z.boolean(),
    dominatesAll: z.boolean(),
    imitabilityScore: z.number(),
    requiredActivities: z.array(z.string()),
    wharton_basis: z.array(z.string()),
  })),
});
