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
  };
}

export async function runV3Pipeline(opts: RunV3Opts): Promise<void> {
  const { runId, project, store, options } = opts;
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
    fileReader: { read: () => '', grep: () => '' } as any,
    log: (msg: string) => console.log(`[${runId}] ${msg}`)
  };

  const phasesCompleted: string[] = [];
  const errors: Array<{ phase: string; message: string }> = [];

  if (!skip.has('A')) {
    try {
      const disco = await runCodeCartographer({ projectPath: project.path }, ctx);
      state.discovery = disco.data! as any;
      phasesCompleted.push('A');
      store.save(state);
    } catch (e) { errors.push({ phase: 'A', message: String(e) }); }
  }

  if (!skip.has('B')) {
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
    } catch (e) { errors.push({ phase: 'B', message: String(e) }); }
  }

  if (!skip.has('C')) {
    try {
      const segment = options.customerSegment ?? 'primary user';
      const forces = await runIndustryStructureAnalyst({ projectName: project.name, sector: 'auto-detect', segment }, ctx);
      const intel = await runCompetitorIntelligence({ projectName: project.name, sector: 'auto-detect', projectDescription: '', knownCompetitors: options.competitorHints }, ctx);
      const drivers = await runWtpCostDriverScorer({ ws01Output: state.wharton!.ws01!, competitors: [] }, ctx);
      const activitySys = await runActivitySystemMapper({ ws01Output: state.wharton!.ws01!, ws07Output: state.wharton!.ws07!, ws08Output: state.wharton!.ws08! }, ctx);

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
    } catch (e) { errors.push({ phase: 'C', message: String(e) }); }
  }

  if (!skip.has('D')) {
    try {
      state.swarm = mergeSwarmResults([]);
      phasesCompleted.push('D');
      store.save(state);
    } catch (e) { errors.push({ phase: 'D', message: String(e) }); }
  }

  if (!skip.has('E')) {
    try {
      state.frontier = await runFrontierPhase(state);
      phasesCompleted.push('E');
      store.save(state);
    } catch (e) { errors.push({ phase: 'E', message: String(e) }); }
  }

  if (!skip.has('F')) {
    try {
      const synth = await runChiefStrategist({ state }, ctx);
      state.synthesis = synth.data;
      phasesCompleted.push('F');
      store.save(state);
    } catch (e) { errors.push({ phase: 'F', message: String(e) }); }
  }

  if (!skip.has('G')) {
    try {
      await runHandoffPhase(state, ctx);
      phasesCompleted.push('G');
    } catch (e) { errors.push({ phase: 'G', message: String(e) }); }
  }

  const snapshotPath = store.snapshotState(project.id, runId);
  store.appendHistory(project.id, {
    runId,
    startedAt: state.lastRunAt!,
    endedAt: new Date().toISOString(),
    phasesCompleted: phasesCompleted as any,
    delta: { newPriorities: 0, resolvedPriorities: 0, healthScoreDelta: 0 },
    errors,
  });
}
