import express from 'express';
import { Request, Response, Router } from 'express';
import { ProjectStateStore, runV3Pipeline, getHistoricalRuns } from '@cs/agents';
import { listProjects } from '../../db/repositories/projects.js';
import { insertRun, updateRunStatus, getRunById } from '../../db/repositories/v3-runs.js';
import fs from 'fs';
import { EventEmitter } from 'events';

const pipelineEvents = new EventEmitter();
const router: Router = express.Router();
const store = new ProjectStateStore('data/projects');

function readJsonl(path: string) {
  if (!fs.existsSync(path)) return [];
  return fs.readFileSync(path, 'utf-8').split('\n').filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

router.post('/run-v3', async (req: Request, res: Response) => {
  const body = req.body as {
    projectIds?: string[];
    naturalLanguageContext?: string;
    skipPhases?: Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'>;
    useGemini?: boolean;
    competitorHints?: string[];
    customerSegment?: string;
  };

  const runId = `v3-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const projects = listProjects().filter((p: { id: string }) => !body.projectIds || body.projectIds.includes(p.id));

  if (projects.length === 0) {
    return res.status(400).json({ ok: false, error: 'No projects matched' });
  }

  // Fire-and-track: long-running, return runId immediately
  const startedAt = new Date().toISOString();
  insertRun({ run_id: runId, project_id: projects[0].id, started_at: startedAt, status: 'running', state_snapshot_path: '', ended_at: null, health_score: null, total_tokens: null, estimated_cost_usd: null, error_message: null });

  // Run async (don't await — let HTTP return)
  (async () => {
    try {
      for (const project of projects) {
        await runV3Pipeline({
          runId,
          project,
          store,
          options: {
            useGemini: body.useGemini !== false,
            naturalLanguageContext: body.naturalLanguageContext,
            skipPhases: body.skipPhases ?? [],
            competitorHints: body.competitorHints,
            customerSegment: body.customerSegment,
            onProgress: (phase: string, msg: string) => {
              pipelineEvents.emit(`v3-${runId}`, { phase, msg });
            }
          },
          emitter: pipelineEvents,
        });
      }
      updateRunStatus(runId, 'done', { ended_at: new Date().toISOString() });
      pipelineEvents.emit(`v3-${runId}`, { phase: 'DONE', msg: 'Pipeline Finished successfully' });
    } catch (err) {
      updateRunStatus(runId, 'failed', { ended_at: new Date().toISOString(), error_message: String(err) });
      pipelineEvents.emit(`v3-${runId}`, { phase: 'FAILED', msg: String(err) });
    }
  })();

  res.json({ ok: true, runId, projectsQueued: projects.length, statusEndpoint: `/api/pipeline/v3-status/${runId}` });
});

router.get('/v3-status/:runId', (req, res) => {
  const run = getRunById(req.params.runId);   // from db/repositories/v3-runs
  if (!run) return res.status(404).json({ ok: false });
  res.json({ ok: true, run });
});

router.get('/v3-stream/:runId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const listener = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  pipelineEvents.on(`v3-${req.params.runId}`, listener);

  req.on('close', () => {
    pipelineEvents.off(`v3-${req.params.runId}`, listener);
  });
});

router.get('/v3-state/:projectId', (req, res) => {
  const state = store.load(req.params.projectId);
  if (!state) return res.status(404).json({ ok: false, error: 'No v3 state for this project' });
  res.json({ ok: true, state });
});

router.get('/v3-moves/:projectId', (req, res) => {
  const state = store.load(req.params.projectId);
  if (!state?.synthesis) return res.json({ ok: true, moves: [] });
  // Read INDEX.md from disk
  const indexPath = `data/projects/${req.params.projectId}/antigravity/INDEX.md`;
  res.json({
    ok: true,
    moves: state.synthesis.topPriorities.map((p: { title: string; summary: string; estimatedImpact: string; estimatedEffort: string }, i: number) => ({
      moveId: `move-${i + 1}`,
      title: p.title,
      summary: p.summary,
      impact: p.estimatedImpact,
      effort: p.estimatedEffort,
      paths: {
        manifest: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/manifest.json`,
        prompt: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/prompt.md`,
        strategy: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/strategy.md`,
        acceptance: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/acceptance-tests.md`,
      },
    })),
    indexPath,
  });
});

router.post('/v3-context/:projectId', (req, res) => {
  const message = req.body.message as string;
  if (!message) return res.status(400).json({ ok: false, error: 'message required' });
  store.appendContext(req.params.projectId, message, []);
  res.json({ ok: true });
});

router.get('/v3-history/:projectId', (req, res) => {
  try {
    const runs = getHistoricalRuns(req.params.projectId);
    res.json({ ok: true, runs });
  } catch (err) {
    // Fallback to legacy JSONL if DB not initialized or errored
    const lines = readJsonl(`data/projects/${req.params.projectId}/history.jsonl`);
    res.json({ ok: true, runs: lines });
  }
});

export default router;
