import express from 'express';
import { Request, Response, Router } from 'express';
import { ProjectStateStore, runV3Pipeline, getHistoricalRuns } from '@cs/agents';
import { runCausalMapper } from '@cs/agents/dist/agents/causal-mapper.js';
import { listProjects } from '../../db/repositories/projects.js';
import { insertRun, updateRunStatus, getRunById } from '../../db/repositories/v3-runs.js';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { broadcastEvent } from '../../services/telemetry.js';

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
  broadcastEvent('pipeline:started', { runId, projectId: projects[0].id, startedAt });

  // Forward internal events to the global telemetry bus
  const telemetryForwarder = (data: any) => {
    if (data.type === 'telemetry') {
      broadcastEvent('agent:activity', data);
    }
  };
  pipelineEvents.on(`v3-${runId}`, telemetryForwarder);

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
              broadcastEvent('agent:started', { runId, phase, message: msg });
            }
          },
          emitter: pipelineEvents,
        });
      }
      updateRunStatus(runId, 'done', { ended_at: new Date().toISOString() });
      pipelineEvents.emit(`v3-${runId}`, { phase: 'DONE', msg: 'Pipeline Finished successfully' });
      broadcastEvent('pipeline:completed', { runId, status: 'done' });
    } catch (err) {
      updateRunStatus(runId, 'failed', { ended_at: new Date().toISOString(), error_message: String(err) });
      pipelineEvents.emit(`v3-${runId}`, { phase: 'FAILED', msg: String(err) });
      broadcastEvent('pipeline:completed', { runId, status: 'failed', error: String(err) });
    } finally {
      pipelineEvents.off(`v3-${runId}`, telemetryForwarder);
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

router.put('/v3-state/:projectId/auto-mode', (req, res) => {
  const { enabled } = req.body as { enabled: boolean };
  const state = store.load(req.params.projectId);
  if (!state) return res.status(404).json({ ok: false, error: 'State not found' });
  
  state.runsAutonomously = !!enabled;
  store.save(state);
  res.json({ ok: true, runsAutonomously: state.runsAutonomously });
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

router.get('/v3-causal/:projectId', async (req, res) => {
  const state = store.load(req.params.projectId);
  if (!state) return res.status(404).json({ ok: false, error: 'State not found' });
  
  // Extract scores or default to 50
  const scores: Record<string, number> = {
    connectedExperienceScore: state.competitive?.wtpDrivers?.find(d => d.name === 'Connected Experience')?.selfScore ? 50 + state.competitive.wtpDrivers.find(d => d.name === 'Connected Experience')!.selfScore * 25 : 50,
    closedLoopMaturity: state.wharton?.ws05 ? 70 : 40,
    switchingCostIndex: 60,
    wtpUpliftIndex: state.competitive?.wtpDrivers?.reduce((a,b) => a + b.selfScore, 0) ? 50 + state.competitive.wtpDrivers.reduce((a,b) => a + b.selfScore, 0) * 10 : 50,
    costReductionPotential: state.competitive?.costDrivers?.reduce((a,b) => a + b.selfScore, 0) ? 50 + state.competitive.costDrivers.reduce((a,b) => a + b.selfScore, 0) * 10 : 50,
    competitivePositioningIndex: 55,
    businessModelStrength: state.wharton?.revenueModel ? 80 : 45,
    dataScienceReadiness: state.wharton?.ws03 ? 65 : 30,
    architectureResilience: 75,
  };

  const result = await runCausalMapper({ projectId: req.params.projectId, scores }, { jobId: 'v3-causal', projectId: req.params.projectId, startedAt: new Date().toISOString() } as any);
  
  res.json({ ok: true, causal: result.data });
});

router.get('/v3-swarm-comparator', (req, res) => {
  const p1Id = req.query.p1 as string;
  const p2Id = req.query.p2 as string;

  if (!p1Id || !p2Id) return res.status(400).json({ ok: false, error: 'Requires p1 and p2 query params' });

  const state1 = store.load(p1Id);
  const state2 = store.load(p2Id);

  if (!state1 || !state2) return res.status(404).json({ ok: false, error: 'One or both projects not found' });

  // Extract and group findings
  const findings1 = state1.swarm?.findings || [];
  const findings2 = state2.swarm?.findings || [];

  const agents = Array.from(new Set([
    ...findings1.map(f => (f as any).agent ?? f.category),
    ...findings2.map(f => (f as any).agent ?? f.category)
  ]));

  const comparison = agents.map(agent => ({
    agent,
    project1: findings1.filter(f => ((f as any).agent ?? f.category) === agent),
    project2: findings2.filter(f => ((f as any).agent ?? f.category) === agent)
  }));

  res.json({
    ok: true,
    projects: {
      p1: { id: p1Id, name: state1.projectName },
      p2: { id: p2Id, name: state2.projectName }
    },
    comparison
  });
});

router.get('/v3-prompts', async (req, res) => {
  const projects = listProjects();
  const allPrompts = [];

  for (const p of projects) {
    const baseDir = path.join('data', 'projects', p.id, 'antigravity');
    try {
      const stats = await fsp.stat(baseDir);
      if (!stats.isDirectory()) continue;
      
      const entries = await fsp.readdir(baseDir, { withFileTypes: true });
      const moves = entries.filter(e => e.isDirectory() && e.name.startsWith('move-')).map(e => e.name);
      
      for (const move of moves) {
        try {
          const promptContent = await fsp.readFile(path.join(baseDir, move, 'prompt.md'), 'utf-8');
          allPrompts.push({
            projectId: p.id,
            projectName: p.name,
            moveId: move,
            promptForAntigravity: promptContent
          });
        } catch (err) {
          // Ignore missing prompt.md
        }
      }
    } catch (err) {
      // Directory doesn't exist
    }
  }

  res.json({ ok: true, data: allPrompts });
});

export default router;
