import { listProjects } from './db/repositories/projects.js';
import { ProjectStateStore, runV3Pipeline } from '@cs/agents';
import { EventEmitter } from 'events';
import { insertRun, updateRunStatus } from './db/repositories/v3-runs.js';
import { broadcastEvent } from './services/telemetry.js';

const store = new ProjectStateStore('data/projects');
const pipelineEvents = new EventEmitter();

// Default 6-hour interval for autonomous runs
const AUTO_RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;

let intervalId: NodeJS.Timeout | null = null;

// Forward internal events to the global telemetry bus
const telemetryForwarder = (data: any) => {
  if (data.type === 'telemetry') {
    broadcastEvent('agent:activity', data);
  }
};
pipelineEvents.on('auto-mode', telemetryForwarder);

export function startScheduler() {
  if (intervalId) return;
  
  console.log(`[CS-Scheduler] Autonomous mode checking enabled (interval: ${AUTO_RUN_INTERVAL_MS}ms)`);
  
  intervalId = setInterval(async () => {
    try {
      const projects = listProjects();
      for (const p of projects) {
        const state = store.load(p.id);
        if (state?.runsAutonomously) {
          // Check if last run was too recent to avoid spamming on restart
          if (state.lastRunAt) {
            const lastRunDate = new Date(state.lastRunAt);
            if (Date.now() - lastRunDate.getTime() < AUTO_RUN_INTERVAL_MS) {
              continue; // Skip, ran recently
            }
          }

          console.log(`[CS-Scheduler] Triggering autonomous run for project: ${p.id}`);
          const runId = `auto-v3-${Date.now()}`;
          const startedAt = new Date().toISOString();
          
          insertRun({ run_id: runId, project_id: p.id, started_at: startedAt, status: 'running', state_snapshot_path: '', ended_at: null, health_score: null, total_tokens: null, estimated_cost_usd: null, error_message: null });
          broadcastEvent('pipeline:started', { runId, projectId: p.id, startedAt });

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
                  broadcastEvent('agent:started', { runId, phase, message: msg });
                }
              },
              emitter: pipelineEvents,
            });
            updateRunStatus(runId, 'done', { ended_at: new Date().toISOString() });
            broadcastEvent('pipeline:completed', { runId, status: 'done' });
          } catch (err) {
            updateRunStatus(runId, 'failed', { ended_at: new Date().toISOString(), error_message: String(err) });
            broadcastEvent('pipeline:completed', { runId, status: 'failed', error: String(err) });
          }
        }
      }
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
