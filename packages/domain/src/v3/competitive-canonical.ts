export interface FiveForcesAnalysis {
  customers: ForceAnalysis;
  suppliers: ForceAnalysis;
  rivalry: ForceAnalysis;
  entrants: ForceAnalysis;
  substitutes: ForceAnalysis;
  industryAttractiveness: 1 | 2 | 3 | 4 | 5;
}

export interface ForceAnalysis {
  attractiveness: 1 | 2 | 3 | 4 | 5;
  drivers: string[];
  evidence: Array<{ claim: string; sourceUrl: string; date?: string }>;
}

export interface ScenarioAnalysis {
  uncertainties: [
    { name: string; high: string; low: string },
    { name: string; high: string; low: string }
  ];
  scenarios: Array<{
    name: string;
    quadrant: 'HH' | 'HL' | 'LH' | 'LL';
    narrative: string;
    strategicImplication: string;
  }>;
}

export interface CompetitorProfile {
  name: string;
  url: string;                     // requerido — sin URL no se acepta
  pricing: string;
  positioning: string;
  recentMoves: Array<{ date: string; description: string; sourceUrl: string }>;
  wtpScores: Record<string, '++'|'+'|'0'|'-'|'--'>;   // por driver
  costScores: Record<string, '++'|'+'|'0'|'-'|'--'>;
}

export interface DriverScore {
  name: string;
  weight: number;                  // 0-1 por segmento
  selfScore: -2 | -1 | 0 | 1 | 2;
  competitorScores: Record<string, -2|-1|0|1|2>;
  evidence?: string;
}

export interface ActivitySystemMap {
  positioning: string[];           // 3-6 main strategic choices
  coreChoices: Array<{
    id: string;
    label: string;
    centrality: number;            // # connections (computed)
    valueChainStage: 'inbound'|'operations'|'outbound'|'marketing'|'service'|'support';
  }>;
  supportingActivities: Array<{ id: string; label: string; }>;
  reinforcementMatrix: Record<string, string[]>;  // activityA → [activities it reinforces]
  oeVsSp: Record<string, 'OE' | 'SP'>;   // per activityId — Operational Effectiveness vs Strategic Positioning
  mermaid: string;                 // mermaid graph source
  imitabilityScore: number;        // 0-1 (1 = harder to copy)
}

export interface ThreeFitsAssessment {
  internal: { score: number; justification: string; gaps: string[] };
  external: { score: number; justification: string; gaps: string[] };
  dynamic: { score: number; justification: string; gaps: string[] };
}

export interface FrontierAnalysis {
  axes: { wtpDrivers: string[]; costDrivers: string[] };
  points: Array<{
    entity: string;                // 'self' | competitor name
    wtp: number;
    cost: number;
    dominatedBy: string[];
  }>;
  paretoFront: string[];           // entity names on the frontier
  selfPosition: 'below' | 'on' | 'above';
  candidateMoves: Array<{
    moveId: string;
    name: string;
    description: string;
    currentPoint: { wtp: number; cost: number };
    projectedPoint: { wtp: number; cost: number };
    breaksTradeOffs: boolean;
    dominatesAll: boolean;
    imitabilityScore: number;
    requiredActivities: string[];
    wharton_basis: string[];      // ej: ["WS04_repeat_level", "WS06_customization"]
  }>;
}
