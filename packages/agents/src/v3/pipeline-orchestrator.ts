import { ProjectStateStore } from './state-store.js';
import type { ProjectStateV3 } from './state-store.js';
import { getGeminiProvider } from '../llm-provider.js';
import { FileReader } from './file-reader.js';
import { registerCustomerJourneyMapper } from './agents/customer-journey-mapper.js';
import { registerInfoFlowAnalyzer } from './agents/info-flow-analyzer.js';
import { registerDeeperNeedsLaddering } from './agents/deeper-needs-laddering.js';
import { registerConnectedExperienceMatrix } from './agents/connected-experience-matrix.js';
import { registerTechStackMapper } from './agents/tech-stack-mapper.js';
import { registerRevenueModelArchitect } from './agents/revenue-model-architect.js';
import { registerIndustryStructureAnalyst } from './agents/industry-structure-analyst.js';
import { registerCompetitorIntelligence } from './agents/competitor-intelligence.js';
import { EventHub } from './hub/event-hub.js';
import { registerWtpCostDriverScorer } from './agents/wtp-cost-driver-scorer.js';
import { registerActivitySystemMapper } from './agents/activity-system-mapper.js';
import { registerCodeCartographer } from './agents/code-cartographer.js';
import { registerTemporalAnalyst } from './agents/temporal-analyst.js';
import { registerDbArchitect, registerSecurityAuditor, registerApiDesignCritic, registerPerformanceEngineer, registerMlReadiness, registerFrontendPerf, registerObservability, mergeSwarmResults } from './agents/swarm/index.js';
import { runFrontierPhase } from './frontier/index.js';
import { registerChiefStrategist } from './agents/chief-strategist.js';
import { SharedFindingsStore } from './shared-findings.js';
import { runHandoffPhase } from './handoff/index.js';
import { saveHistoricalRun } from './db/index.js';
import EventEmitter from 'events';
import type { TelemetryEvent } from './state-types.js';
import { runSyntheticConsultant } from '../agents/synthetic-consultant.js';

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

function waitForEvent(hub: EventHub, eventType: string): Promise<any> {
  return new Promise((resolve) => {
    let handled = false;
    hub.subscribe(eventType, (event) => {
      if (!handled) {
        handled = true;
        resolve(event);
      }
    });
  });
}

async function executeAgent(hub: EventHub, commandType: string, projectId: string, payload: any): Promise<any> {
  const completedEventType = commandType.replace('RUN_', '') + '_COMPLETED';
  const failedEventType = commandType.replace('RUN_', '') + '_FAILED';
  
  const promise = Promise.race([
    waitForEvent(hub, completedEventType),
    waitForEvent(hub, failedEventType).then(e => { throw new Error(e.payload.error); })
  ]);
  
  await hub.publish({
    domain: 'command',
    type: commandType,
    projectId,
    payload,
    timestamp: Date.now()
  });
  
  return promise;
}

export async function runV3Pipeline(opts: RunV3Opts): Promise<void> {
  const { runId, project, store, options, emitter } = opts;
  const skip = new Set(options.skipPhases);

  const sharedFindings = new SharedFindingsStore();
  const hub = new EventHub(store);
  await hub.init();

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
    llm: (() => {
      const baseLlm = options.useGemini ? getGeminiProvider() : { generate: async () => ({ text: '' }), generateStructured: async () => null, model: 'mock', available: true };
      const fullContext = store.readContext(project.id);
      return {
        ...baseLlm,
        generate: async (prompt: string, opts?: any) => {
          const injectedPrompt = fullContext ? `=== PROJECT CONTEXT ===\n${fullContext}\n=======================\n\n${prompt}` : prompt;
          return baseLlm.generate(injectedPrompt, opts);
        },
        generateStructured: async (prompt: string, schema: string, opts?: any) => {
          const injectedPrompt = fullContext ? `=== PROJECT CONTEXT ===\n${fullContext}\n=======================\n\n${prompt}` : prompt;
          return baseLlm.generateStructured(injectedPrompt, schema, opts);
        }
      };
    })(),
    store,
    fileReader: new FileReader(project.path),
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

  // Wire up cross-agent message bus telemetry
  sharedFindings.subscribe(finding => {
    ctx.emitTelemetry({
      type: 'finding_yielded',
      message: `Hallazgo detectado: ${finding.title}`,
      data: finding
    });
  });

  // REGISTER ALL AGENTS AS LISTENERS
  registerCompetitorIntelligence(hub, ctx);
  registerCodeCartographer(hub, ctx);
  registerCustomerJourneyMapper(hub, ctx);
  registerInfoFlowAnalyzer(hub, ctx);
  registerDeeperNeedsLaddering(hub, ctx);
  registerConnectedExperienceMatrix(hub, ctx);
  registerTechStackMapper(hub, ctx);
  registerRevenueModelArchitect(hub, ctx);
  registerIndustryStructureAnalyst(hub, ctx);
  registerWtpCostDriverScorer(hub, ctx);
  registerActivitySystemMapper(hub, ctx);
  registerDbArchitect(hub, ctx);
  registerSecurityAuditor(hub, ctx);
  registerApiDesignCritic(hub, ctx);
  registerPerformanceEngineer(hub, ctx);
  registerMlReadiness(hub, ctx);
  registerFrontendPerf(hub, ctx);
  registerObservability(hub, ctx);
  registerTemporalAnalyst(hub, ctx);
  registerChiefStrategist(hub, ctx);
  
  await hub.publish({
    domain: 'lifecycle',
    type: 'PIPELINE_STARTED',
    projectId: project.id,
    payload: { projectId: project.id },
    timestamp: Date.now()
  });

  const phasesCompleted: string[] = [];
  const errors: Array<{ phase: string; message: string }> = [];

  options.onProgress?.('0', 'Starting Pre-Flight Draft (SyntheticConsultant)...');
  try {
    const wsQuestions = ['What is the core business?', 'Who is the main customer?']; // Mock questions for WS01
    const draft = await runSyntheticConsultant({ worksheetId: 'ws01', questions: wsQuestions }, ctx);
    state.wharton = state.wharton || {};
    state.wharton.ws01 = { ...state.wharton.ws01, ...((draft.data as any) || {}) };
    phasesCompleted.push('0');
    store.save(state);
    options.onProgress?.('0', 'Pre-Flight Draft Complete.');
  } catch (e) { errors.push({ phase: '0', message: String(e) }); }

  if (!skip.has('A')) {
    options.onProgress?.('A', 'Starting Discovery (Code Cartographer)...');
    try {
      const disco = await executeAgent(hub, 'RUN_CODE_CARTOGRAPHER', project.id, { projectPath: project.path });
      state.discovery = disco.payload.data as any;
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
      const ws01 = await executeAgent(hub, 'RUN_CUSTOMER_JOURNEY_MAPPER', project.id, { projectName: project.name, customerSegment: segment, useCase: 'main use', competitorNames: competitors });
      const ws01Output = ws01.payload.data.ws01;

      const ws03 = await executeAgent(hub, 'RUN_INFO_FLOW_ANALYZER', project.id, { ws01Output });
      const ws04ws06 = await executeAgent(hub, 'RUN_DEEPER_NEEDS_LADDERING', project.id, { ws01Output, projectName: project.name });
      const ws05ws07ws08 = await executeAgent(hub, 'RUN_CONNECTED_EXPERIENCE_MATRIX', project.id, { ws01Output, ws04Output: ws04ws06.payload.data.ws04, competitorNames: competitors });
      const ws09ws10ws11 = await executeAgent(hub, 'RUN_TECH_STACK_MAPPER', project.id, { packageJson: {}, fileDiscovery: { byCategory: {} } });

      const revenue = await executeAgent(hub, 'RUN_REVENUE_MODEL_ARCHITECT', project.id, {
        ws07Output: ws05ws07ws08.payload.data.ws07,
        ws08Output: ws05ws07ws08.payload.data.ws08,
        competitorPricing: competitors
      });

      state.wharton = {
        ws01: ws01Output,
        ws03: ws03.payload.data.ws03,
        ws04: ws04ws06.payload.data.ws04,
        ws05: ws05ws07ws08.payload.data.ws05,
        ws06: ws04ws06.payload.data.ws06,
        ws07: ws05ws07ws08.payload.data.ws07,
        ws08: ws05ws07ws08.payload.data.ws08,
        ws09: ws09ws10ws11.payload.data.ws09,
        ws10: ws09ws10ws11.payload.data.ws10,
        ws11: ws09ws10ws11.payload.data.ws11,
        revenueModel: revenue.payload.data,
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
      const [forces, drivers, activitySys] = await Promise.all([
        executeAgent(hub, 'RUN_INDUSTRY_STRUCTURE_ANALYST', project.id, { projectName: project.name, sector: 'auto-detect', segment }),
        executeAgent(hub, 'RUN_WTP_COST_DRIVER_SCORER', project.id, { ws01Output: state.wharton!.ws01!, competitors: [] }),
        executeAgent(hub, 'RUN_ACTIVITY_SYSTEM_MAPPER', project.id, { ws01Output: state.wharton!.ws01!, ws07Output: state.wharton!.ws07!, ws08Output: state.wharton!.ws08! }),
        executeAgent(hub, 'RUN_COMPETITIVE_ANALYSIS', project.id, {
          projectName: project.name,
          sector: 'auto-detect',
          projectDescription: '',
          knownCompetitors: options.competitorHints
        })
      ]);

      const hubState = store.load(project.id) || state;

      state.competitive = {
        ...hubState.competitive,
        fiveForces: forces.payload.data?.fiveForces,
        scenarios: forces.payload.data?.scenarios,
        wtpDrivers: drivers.payload.data?.wtpDrivers,
        costDrivers: drivers.payload.data?.costDrivers,
        activitySystem: activitySys.payload.data,
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
      const swarmResultsRaw = await Promise.all([
        executeAgent(hub, 'RUN_DB_ARCHITECT', project.id, { files }),
        executeAgent(hub, 'RUN_SECURITY_AUDITOR', project.id, { files }),
        executeAgent(hub, 'RUN_API_DESIGN_CRITIC', project.id, { files }),
        executeAgent(hub, 'RUN_PERFORMANCE_ENGINEER', project.id, { files }),
        executeAgent(hub, 'RUN_ML_READINESS', project.id, { files }),
        executeAgent(hub, 'RUN_FRONTEND_PERF', project.id, { files }),
        executeAgent(hub, 'RUN_OBSERVABILITY', project.id, { files })
      ]);
      const swarmResults = swarmResultsRaw.map(r => ({ data: r.payload.data }));
      state.swarm = mergeSwarmResults(swarmResults as any);
      
      const temporalResult = await executeAgent(hub, 'RUN_TEMPORAL_ANALYST', project.id, {});
      state.temporal = temporalResult.payload.data;

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
      const liveFindings = sharedFindings.getAll();
      const synth = await executeAgent(hub, 'RUN_CHIEF_STRATEGIST', project.id, { state, liveFindings });
      state.synthesis = synth.payload.data;
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
