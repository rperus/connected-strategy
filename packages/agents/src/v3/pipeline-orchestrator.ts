import { ProjectStateStore } from './state-store.js';
import type { ProjectStateV3 } from './state-store.js';
import { runCustomerJourneyMapper } from './agents/customer-journey-mapper.js';
import { runInfoFlowAnalyzer } from './agents/info-flow-analyzer.js';
import { runDeeperNeedsLaddering } from './agents/deeper-needs-laddering.js';
import { runConnectedExperienceMatrix } from './agents/connected-experience-matrix.js';
import { runTechStackMapper } from './agents/tech-stack-mapper.js';
import { runRevenueModelArchitect } from './agents/revenue-model-architect.js';
import { runIndustryStructureAnalyst } from './agents/industry-structure-analyst.js';
import { runCompetitorIntelligence } from './agents/competitor-intelligence.js';
import { runWtpCostDriverScorer } from './agents/wtp-cost-driver-scorer.js';
import { runActivitySystemMapper } from './agents/activity-system-mapper.js';
import { runCodeCartographer } from './agents/code-cartographer.js';
import { mergeSwarmResults, runDbArchitect, runSecurityAuditor, runApiDesignCritic, runPerformanceEngineer, runMlReadiness, runFrontendPerf, runObservability } from './agents/swarm/index.js';
import { runFrontierPhase } from './frontier/index.js';
import { runChiefStrategist } from './agents/chief-strategist.js';
import { runHandoffPhase } from './handoff/index.js';
import { saveHistoricalRun } from './db/index.js';
import EventEmitter from 'events';
import type { TelemetryEvent } from './state-types.js';

export interface RunV3Opts {
  runId: string;
  project: { id: string; name: string; path: string; stack?: string[] };
  store: ProjectStateStore;
  options: {
    useGemini: boolean;
    naturalLanguageContext?: string;
    skipPhases: Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'>;
    competitorHints?: string[];
    customerSegment?: string;
    onProgress?: (phase: string, msg: string) => void;
  };
  emitter?: EventEmitter;
}

export async function runV3Pipeline(opts: RunV3Opts): Promise<void> {
  const { runId, project, store, options, emitter } = opts;
  const skip = new Set(options.skipPhases);

  let state = store.load(project.id) || {
    schemaVersion: '3.0.0',
    projectId: project.id,
    projectName: project.name,
    projectPath: project.path,
    lastRunId: runId,
    lastRunAt: new Date().toISOString(),
    userContext: { naturalLanguageUpdates: [], dismissedPriorities: [], completedPriorities: [] }
  } as unknown as ProjectStateV3;

  state.lastRunId = runId;
  state.lastRunAt = new Date().toISOString();

  if (options.naturalLanguageContext) {
    store.appendContext(project.id, options.naturalLanguageContext, []);
  }

  const ctx: any = {
    runId,
    projectId: project.id,
    projectPath: project.path,
    startedAt: new Date().toISOString(),
    llm: { generate: async () => ({ text: '' }), generateStructured: async () => null, model: 'mock', available: true },
    store,
    fileReader: { read: () => '', grep: () => '', getReadFilesList: () => [] } as any,
    log: (msg: string) => {
      console.log(`[${runId}] ${msg}`);
      options.onProgress?.('general', msg);
    },
    emitTelemetry: (partialEvent: Partial<TelemetryEvent>) => {
      if (emitter) {
        emitter.emit(`v3-${runId}`, {
          type: 'telemetry',
          id: Math.random().toString(36).substring(7),
          runId,
          projectId: project.id,
          timestamp: new Date().toISOString(),
          ...partialEvent
        });
      }
    }
  };

  const phasesCompleted: string[] = [];
  const errors: Array<{ phase: string; message: string }> = [];

  if (!skip.has('A')) {
    options.onProgress?.('A', 'Starting Discovery (Code Cartographer)...');
    try {
      const disco = await runCodeCartographer({ projectPath: project.path }, ctx);
      state.discovery = disco.data! as any;
      phasesCompleted.push('A');
      store.save(state);
      options.onProgress?.('A', 'Discovery Complete.');
    } catch (e) { errors.push({ phase: 'A', message: String(e) }); }
  }

  if (!skip.has('B')) {
    options.onProgress?.('B', 'Starting Wharton Phase (Journey, Experience, Tech Stack)...');
    try {
      const segment = options.customerSegment ?? 'primary user';
      const competitors = options.competitorHints ?? [];
      const ws01 = await runCustomerJourneyMapper({ projectName: project.name, customerSegment: segment, useCase: 'main use', competitorNames: competitors }, ctx);
      
      const ws03 = await runInfoFlowAnalyzer({ ws01Output: ws01.data!.ws01 }, ctx);
      const ws04ws06 = await runDeeperNeedsLaddering({ ws01Output: ws01.data!.ws01, projectName: project.name }, ctx);
      const ws05ws07ws08 = await runConnectedExperienceMatrix({ ws01Output: ws01.data!.ws01, ws04Output: ws04ws06.data!.ws04, competitorNames: competitors }, ctx);
      const ws09ws10ws11 = await runTechStackMapper({ packageJson: {}, fileDiscovery: { byCategory: {} } }, ctx);

      state.wharton = {
        ws01: ws01.data?.ws01,
        ws03: ws03.data?.ws03,
        ws04: ws04ws06.data?.ws04,
        ws05: ws05ws07ws08.data?.ws05,
        ws06: ws04ws06.data?.ws06,
        ws07: ws05ws07ws08.data?.ws07,
        ws08: ws05ws07ws08.data?.ws08,
        ws09: ws09ws10ws11.data?.ws09,
        ws10: ws09ws10ws11.data?.ws10,
        ws11: ws09ws10ws11.data?.ws11,
      };
      phasesCompleted.push('B');
      store.save(state);
      options.onProgress?.('B', 'Wharton Phase Complete.');
    } catch (e) { errors.push({ phase: 'B', message: String(e) }); }
  }

  if (!skip.has('C')) {
    options.onProgress?.('C', 'Starting Competitive Analysis (Five Forces, WTP, Activity System)...');
    try {
      const segment = options.customerSegment ?? 'primary user';
      const [forces, intel, drivers, activitySys] = await Promise.all([
        runIndustryStructureAnalyst({ projectName: project.name, sector: 'auto-detect', segment }, ctx),
        runCompetitorIntelligence({ projectName: project.name, sector: 'auto-detect', projectDescription: '', knownCompetitors: options.competitorHints }, ctx),
        runWtpCostDriverScorer({ ws01Output: state.wharton!.ws01!, competitors: [] }, ctx),
        runActivitySystemMapper({ ws01Output: state.wharton!.ws01!, ws07Output: state.wharton!.ws07!, ws08Output: state.wharton!.ws08! }, ctx)
      ]);

      state.competitive = {
        fiveForces: forces.data?.fiveForces,
        scenarios: forces.data?.scenarios,
        competitors: intel.data?.competitors,
        wtpDrivers: drivers.data?.wtpDrivers,
        costDrivers: drivers.data?.costDrivers,
        activitySystem: activitySys.data,
      };
      phasesCompleted.push('C');
      store.save(state);
      options.onProgress?.('C', 'Competitive Analysis Complete.');
    } catch (e) { errors.push({ phase: 'C', message: String(e) }); }
  }

  if (!skip.has('D')) {
    options.onProgress?.('D', 'Starting Swarm Phase (Parallel QA & Ops Agents)...');
    try {
      const files = (state.discovery as any)?.files || [];
      const swarmResults = await Promise.all([
        runDbArchitect({ files }, ctx),
        runSecurityAuditor({ files }, ctx),
        runApiDesignCritic({ files }, ctx),
        runPerformanceEngineer({ files }, ctx),
        runMlReadiness({ files }, ctx),
        runFrontendPerf({ files }, ctx),
        runObservability({ files }, ctx)
      ]);
      state.swarm = mergeSwarmResults(swarmResults);
      phasesCompleted.push('D');
      store.save(state);
      options.onProgress?.('D', 'Swarm Phase Complete.');
    } catch (e) { errors.push({ phase: 'D', message: String(e) }); }
  }

  if (!skip.has('E')) {
    options.onProgress?.('E', 'Starting Quantitative Frontier Engine...');
    try {
      state.frontier = await runFrontierPhase(state);
      phasesCompleted.push('E');
      store.save(state);
      options.onProgress?.('E', 'Frontier Phase Complete.');
    } catch (e) { errors.push({ phase: 'E', message: String(e) }); }
  }

  if (!skip.has('F')) {
    options.onProgress?.('F', 'Starting Chief Strategist (Synthesis)...');
    try {
      const synth = await runChiefStrategist({ state }, ctx);
      state.synthesis = synth.data;
      phasesCompleted.push('F');
      store.save(state);
      options.onProgress?.('F', 'Synthesis Complete.');
    } catch (e) { errors.push({ phase: 'F', message: String(e) }); }
  }

  if (!skip.has('G')) {
    options.onProgress?.('G', 'Starting Antigravity Handoff Packaging...');
    try {
      await runHandoffPhase(state, ctx);
      phasesCompleted.push('G');
      options.onProgress?.('G', 'Handoff Complete.');
    } catch (e) { errors.push({ phase: 'G', message: String(e) }); }
  }

  const snapshotPath = store.snapshotState(project.id, runId);
  const endedAt = new Date().toISOString();
  
  // Legacy JSONL history
  store.appendHistory(project.id, {
    runId,
    startedAt: state.lastRunAt!,
    endedAt,
    phasesCompleted: phasesCompleted as any,
    delta: { newPriorities: 0, resolvedPriorities: 0, healthScoreDelta: 0 },
    errors,
  });

  // New SQLite historical run
  saveHistoricalRun({
    runId,
    projectId: project.id,
    startedAt: state.lastRunAt!,
    endedAt,
    status: errors.length === 0 ? 'success' : 'failed',
    error: errors.length > 0 ? errors[0].message : undefined,
    healthScoreDelta: 0,
    newPriorities: 0,
    resolvedPriorities: 0
  });

  ctx.emitTelemetry({ type: 'pipeline_finished', message: 'Pipeline completed.' });
}
