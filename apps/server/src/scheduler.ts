import { listProjects } from './db/repositories/projects.js';
import { ProjectStateStore, runV3Pipeline } from '@cs/agents';
import { EventEmitter } from 'events';

const store = new ProjectStateStore('data/projects');
const pipelineEvents = new EventEmitter();

// Default 6-hour interval for autonomous runs
const AUTO_RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;

let intervalId: NodeJS.Timeout | null = null;

export function startScheduler() {
  if (intervalId) return;
  
  console.log(`[CS-Scheduler] Autonomous mode checking enabled (interval: ${AUTO_RUN_INTERVAL_MS}ms)`);
  
  intervalId = setInterval(async () => {
    try {
      const projects = listProjects();
      for (const p of projects) {
        const state = store.load(p.id);
        if (state?.runsAutonomously) {
          console.log(`[CS-Scheduler] Triggering autonomous run for project: ${p.id}`);
          const runId = `auto-${Date.now()}`;
          await runV3Pipeline({
            runId,
            project: p,
            store,
            options: {
              useGemini: true,
              skipPhases: [],
            },
            emitter: pipelineEvents,
          });
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
