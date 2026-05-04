import fs from 'fs';
import path from 'path';
import { migrateState } from './migrators.js';
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

export interface Priority {
  id: string;
  title: string;
  description: string;
}

export interface ProjectStateV3 {
  schemaVersion: '3.0.0';
  projectId: string;
  projectName: string;
  projectPath: string;
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
  frontier?: FrontierAnalysis;
  synthesis?: z.infer<typeof synthesisSchema>;
  userContext: {
    naturalLanguageUpdates: Array<{ at: string; message: string; appliedChanges: string[] }>;
    dismissedPriorities: string[];
    completedPriorities: string[];
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

export class ProjectStateStore {
  constructor(private rootDir: string = 'data/projects') {
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }
  }

  private getProjectPath(projectId: string): string {
    return path.join(this.rootDir, projectId);
  }

  private ensureProjectDir(projectId: string): string {
    const p = this.getProjectPath(projectId);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
    return p;
  }

  load(projectId: string): ProjectStateV3 | null {
    const p = path.join(this.getProjectPath(projectId), 'state.json');
    if (!fs.existsSync(p)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return migrateState(raw);
    } catch (e) {
      console.error(`Failed to load state for ${projectId}`, e);
      return null;
    }
  }

  save(state: ProjectStateV3): void {
    const dir = this.ensureProjectDir(state.projectId);
    const tmp = path.join(dir, 'state.json.tmp');
    const dest = path.join(dir, 'state.json');
    // Using stringify without pretty-print as suggested
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, dest);
  }

  appendHistory(projectId: string, runRecord: RunRecord): void {
    const dir = this.ensureProjectDir(projectId);
    const p = path.join(dir, 'history.jsonl');
    fs.appendFileSync(p, JSON.stringify(runRecord) + '\n');
  }

  appendCitation(projectId: string, citation: Citation): void {
    const dir = this.ensureProjectDir(projectId);
    const p = path.join(dir, 'citations.jsonl');
    fs.appendFileSync(p, JSON.stringify(citation) + '\n');
  }

  readContext(projectId: string): string {
    const p = path.join(this.getProjectPath(projectId), 'context.md');
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf-8');
  }

  appendContext(projectId: string, message: string, changes: string[]): void {
    const dir = this.ensureProjectDir(projectId);
    const p = path.join(dir, 'context.md');
    const update = `\n## Update ${new Date().toISOString()}\n\n${message}\n\nChanges:\n${changes.map(c => '- ' + c).join('\n')}\n`;
    fs.appendFileSync(p, update);
  }

  cacheLLM(projectId: string, promptHash: string, response: unknown): void {
    const dir = path.join(this.ensureProjectDir(projectId), 'llm-cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, `${promptHash}.json`);
    fs.writeFileSync(p, JSON.stringify(response));
  }

  readLLMCache(projectId: string, promptHash: string): unknown | null {
    const p = path.join(this.getProjectPath(projectId), 'llm-cache', `${promptHash}.json`);
    if (!fs.existsSync(p)) return null;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
      return null;
    }
  }

  snapshotState(projectId: string, runId: string): string {
    const state = this.load(projectId);
    if (!state) throw new Error('Cannot snapshot missing state');
    
    const snapshotsDir = path.join(this.ensureProjectDir(projectId), 'snapshots');
    if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });
    
    const p = path.join(snapshotsDir, `${runId}.json`);
    fs.writeFileSync(p, JSON.stringify(state));
    return p;
  }

  loadSnapshot(projectId: string, runId: string): ProjectStateV3 | null {
    const p = path.join(this.getProjectPath(projectId), 'snapshots', `${runId}.json`);
    if (!fs.existsSync(p)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return migrateState(raw);
    } catch {
      return null;
    }
  }

  diffSnapshots(projectId: string, runIdA: string, runIdB: string): unknown {
    const a = this.loadSnapshot(projectId, runIdA);
    const b = this.loadSnapshot(projectId, runIdB);
    if (!a || !b) return null;
    
    // A simple diff implementation or return both for external diffing
    return { a, b }; // Placeholder for actual diff implementation
  }
}
