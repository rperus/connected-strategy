import { listProjects } from './db/repositories/projects.js';
import { ProjectStateStore, runV3Pipeline } from '@cs/agents';
import { EventEmitter } from 'events';
import { insertRun, updateRunStatus } from './db/repositories/v3-runs.js';
import { broadcastEvent } from './services/telemetry.js';

const store = new ProjectStateStore('data/projects');
const pipelineEvents = new EventEmitter();

// Default 6-hour interval for autonomous runs
const AUTO_RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;
// Max parallel pipelines running at the same time
const MAX_CONCURRENT_PIPELINES = 2;

let intervalId: NodeJS.Timeout | null = null;
let runningCount = 0;

// Forward internal events to the global telemetry bus
const telemetryForwarder = (data: any) => {
  if (data.type === 'telemetry') {
    broadcastEvent('agent:activity', data);
  }
};
pipelineEvents.on('auto-mode', telemetryForwarder);

async function runProjectAutonomously(p: { id: string; name: string; path: string; stack?: string[] }) {
  if (runningCount >= MAX_CONCURRENT_PIPELINES) {
    console.log(`[CS-Scheduler] Throttled: ${MAX_CONCURRENT_PIPELINES} pipelines already running. Skipping ${p.id}.`);
    broadcastEvent('agent:activity', {
      type: 'throttled',
      message: `⚠️ Auto-mode throttled — ${p.name} en cola (max concurrencia: ${MAX_CONCURRENT_PIPELINES})`,
      projectId: p.id,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  runningCount++;
  const runId = `auto-v3-${Date.now()}`;
  const startedAt = new Date().toISOString();

  console.log(`[CS-Scheduler] Triggering autonomous run for project: ${p.id} (${runningCount}/${MAX_CONCURRENT_PIPELINES} slots used)`);
  insertRun({ run_id: runId, project_id: p.id, started_at: startedAt, status: 'running', state_snapshot_path: '', ended_at: null, health_score: null, total_tokens: null, estimated_cost_usd: null, error_message: null });
  broadcastEvent('pipeline:started', { runId, projectId: p.id, projectName: p.name, startedAt });

  try {
    await runV3Pipeline({
      runId,
      project: p,
      store,
      options: {
        useGemini: true,
        skipPhases: [],
        onProgress: (phase: string, msg: string) => {
          pipelineEvents.emit('auto-mode', { type: 'telemetry', runId, agentId: 'strategist', phase, message: msg });
          broadcastEvent('agent:started', { runId, phase, message: `[${p.name}] ${msg}` });
        },
      },
      emitter: pipelineEvents,
    });
    updateRunStatus(runId, 'done', { ended_at: new Date().toISOString() });
    broadcastEvent('pipeline:completed', { runId, status: 'done', projectName: p.name });
  } catch (err) {
    updateRunStatus(runId, 'failed', { ended_at: new Date().toISOString(), error_message: String(err) });
    broadcastEvent('pipeline:completed', { runId, status: 'failed', error: String(err), projectName: p.name });
  } finally {
    runningCount--;
  }
}

import { checkChurnRisks } from './services/churnPredictor.js';

export function startScheduler() {
  if (intervalId) return;

  console.log(`[CS-Scheduler] Autonomous mode enabled (interval: ${AUTO_RUN_INTERVAL_MS}ms, max-concurrency: ${MAX_CONCURRENT_PIPELINES})`);

  intervalId = setInterval(async () => {
    try {
      checkChurnRisks();
      
      const projects = listProjects();
      const candidates = projects.filter(p => {
        const state = store.load(p.id);
        if (!state?.runsAutonomously) return false;
        if (state.lastRunAt) {
          const lastRunDate = new Date(state.lastRunAt);
          if (Date.now() - lastRunDate.getTime() < AUTO_RUN_INTERVAL_MS) return false;
        }
        return true;
      });

      if (candidates.length === 0) return;

      console.log(`[CS-Scheduler] ${candidates.length} project(s) due for autonomous run.`);
      broadcastEvent('agent:activity', {
        type: 'scheduler:tick',
        message: `🤖 Scheduler: ${candidates.length} proyecto(s) en ejecución autónoma`,
        timestamp: new Date().toISOString(),
      });

      // Fire all eligible projects concurrently, throttled by MAX_CONCURRENT_PIPELINES
      await Promise.all(candidates.map(p => runProjectAutonomously(p)));
    } catch (e) {
      console.error('[CS-Scheduler] Error in autonomous loop:', e);
    }
  }, AUTO_RUN_INTERVAL_MS);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[CS-Scheduler] Autonomous mode stopped.');
  }
}
