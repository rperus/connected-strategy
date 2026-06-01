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
  FiveForcesAnalysis,
  ScenarioAnalysis,
  CompetitorProfile,
  DriverScore,
  ActivitySystemMap,
  ThreeFitsAssessment,
  FrontierAnalysis,
  synthesisSchema
} from '@cs/domain';
import type { z } from 'zod';

export interface DiscoveryResult {
  // placeholder
  files?: string[];
  dependencies?: Record<string, string>;
}

import type { SwarmFinding } from './agents/swarm/schema.js';

export interface SpecialistFinding {
  agentId: string;
  finding: string;
}

export type Priority = z.infer<typeof synthesisSchema>['topPriorities'][0];

export interface ProjectStateV3 {
  schemaVersion: '3.0.0';
  projectId: string;
  projectName: string;
  projectPath: string;
  runsAutonomously?: boolean;
  lastRunId: string | null;
  lastRunAt: string | null;        // ISO8601
  discovery?: DiscoveryResult;
  wharton?: {
    ws01?: WS01_JourneyMap;
    ws02?: never;                  // merged into ws01
    ws03?: WS03_InfoFlow;
    ws04?: WS04_WhyHowLadder;
    ws05?: WS05_ResponseMatrix;
    ws06?: WS06_RepeatLearning;
    ws07?: WS07_ExistingMatrix;
    ws08?: WS08_NewIdeasMatrix;
    ws09?: WS09_SubfunctionGrid;
    ws10?: WS10_TechSolutions;
    ws11?: WS11_EmergingTech;
    revenueModel?: RevenueModelArchitectOutput;
  };
  competitive?: {
    fiveForces?: FiveForcesAnalysis;
    scenarios?: ScenarioAnalysis;
    competitors?: CompetitorProfile[];
    wtpDrivers?: DriverScore[];
    costDrivers?: DriverScore[];
    activitySystem?: ActivitySystemMap;
  };
  swarm?: {
    findings: SwarmFinding[];
    perSpecialist: Record<string, { count: number; durationMs: number }>;
  };
  temporal?: TemporalAnalystOutput;
  frontier?: FrontierAnalysis;
  synthesis?: z.infer<typeof synthesisSchema>;
  userContext: {
    naturalLanguageUpdates: Array<{ at: string; message: string; appliedChanges: string[] }>;
    dismissedPriorities: string[];
    completedPriorities: string[];
    approvedPriorities?: string[];
    inProgressPriorities?: string[];
  };
}

export interface RunRecord {
  runId: string;
  startedAt: string;
  endedAt: string;
  phasesCompleted: Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'>;
  delta: { newPriorities: number; resolvedPriorities: number; healthScoreDelta: number };
  errors: Array<{ phase: string; message: string }>;
}

export interface Citation {
  claim: string;
  sourceUrl: string;
  retrievedAt: string;
  agent: string;
}

export type TelemetryEventType = 'pipeline_started' | 'pipeline_finished' | 'agent_started' | 'agent_finished' | 'tool_call' | 'tool_result' | 'finding_yielded' | 'proposal:updated';

export interface TelemetryEvent {
  id: string;
  runId: string;
  projectId: string;
  timestamp: string; // ISO8601
  type: TelemetryEventType;
  agentId?: string;
  crewId?: string;
  message: string;
  data?: any;
}

export interface HistoricalRun {
  runId: string;
  projectId: string;
  startedAt: string;
  endedAt: string;
  status: 'success' | 'failed';
  error?: string;
  healthScoreDelta: number;
  newPriorities: number;
  resolvedPriorities: number;
}

export interface RevenueModelArchitectOutput {
  connectionArchitecture: string;
  revenueModel: {
    what: string;
    when: string;
    who: string;
    why: string;
    currency: string;
  };
  alternatives: string[];
}

export interface TemporalTrend {
  metric: 'healthScore' | 'velocity' | 'errorRate';
  direction: 'up' | 'down' | 'flat';
  significance: 'high' | 'low';
  description: string;
}

export interface TemporalAnalystOutput {
  totalRunsAnalyzed: number;
  trends: TemporalTrend[];
  regressions: string[];
}
