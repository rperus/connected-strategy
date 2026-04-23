/**
 * Analysis Routes — Express Router
 *
 * HTTP API for creating and running analysis jobs.
 * Mount at: /api/analysis
 *
 * Worker: SET-03 / SLOT: Chat 1
 * Wave 5: adds SQLite persistence, run-all-projects, jobs/:id/result
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import {
  createJob,
  getJob,
  listJobs,
  markRunning,
  markDone,
  markFailed,
  getQueueStats,
  getRegisteredAgent,
  listAgentDefinitions,
} from '@cs/agents';
import type { AgentId, AgentContext } from '@cs/agents';
import {
  insertJob,
  updateJob,
} from '../../db/repositories/jobs.js';
import { listProjects } from '../../db/repositories/projects.js';

const router: Router = express.Router();

// ─── Queue stats ──────────────────────────────────────────────────────────────

/**
 * GET /api/analysis/stats
 * Returns queue statistics (total, queued, running, done, failed).
 */
router.get('/stats', (_req: Request, res: Response) => {
  res.json({ ok: true, data: getQueueStats() });
});

// ─── Agent definitions ────────────────────────────────────────────────────────

/**
 * GET /api/analysis/agents
 * Returns all registered agent definitions.
 */
router.get('/agents', (_req: Request, res: Response) => {
  const definitions = listAgentDefinitions();
  res.json({ ok: true, count: definitions.length, data: definitions });
});

// ─── Jobs CRUD ────────────────────────────────────────────────────────────────

/**
 * GET /api/analysis/jobs
 * Query params: projectId? (filter by project)
 * Returns all analysis jobs sorted by createdAt desc.
 */
router.get('/jobs', (req: Request, res: Response) => {
  const { projectId } = req.query as { projectId?: string };
  const jobs = listJobs(projectId);
  res.json({ ok: true, count: jobs.length, data: jobs });
});

/**
 * GET /api/analysis/jobs/:id
 * Returns a single job by ID.
 */
router.get('/jobs/:id', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ ok: false, error: `Job ${req.params.id} not found` });
    return;
  }
  res.json({ ok: true, data: job });
});

/**
 * GET /api/analysis/jobs/:id/result
 * Returns just the result data of a completed job (for UI consumption).
 */
router.get('/jobs/:id/result', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ ok: false, error: `Job ${req.params.id} not found` });
    return;
  }
  if (job.status !== 'done') {
    res.status(409).json({ ok: false, error: `Job is ${job.status}, not done`, status: job.status });
    return;
  }
  res.json({ ok: true, jobId: job.id, projectId: job.projectId, agentId: job.agentId, data: job.result });
});

/**
 * POST /api/analysis/jobs
 * Body: { projectId: string, agentId: AgentId, input?: Record<string, unknown> }
 * Creates a new analysis job in 'queued' state and persists to SQLite.
 */
router.post('/jobs', (req: Request, res: Response) => {
  const { projectId, agentId, input } = req.body as {
    projectId?: string;
    agentId?: AgentId;
    input?: Record<string, unknown>;
  };

  if (!projectId || !agentId) {
    res.status(400).json({ ok: false, error: 'projectId and agentId are required' });
    return;
  }

  const agent = getRegisteredAgent(agentId);
  if (!agent) {
    res.status(400).json({
      ok: false,
      error: `Unknown agentId: ${agentId}`,
      validIds: listAgentDefinitions().map((a) => a.id),
    });
    return;
  }

  const job = createJob(projectId, agentId, input ?? {});
  // Persist to SQLite
  try { insertJob(job); } catch { /* DB may not be ready in test env */ }
  res.status(201).json({ ok: true, data: job });
});

/**
 * POST /api/analysis/jobs/:id/run
 * Runs the queued job synchronously (deterministic agents are fast).
 * Persists status changes to SQLite.
 */
router.post('/jobs/:id/run', async (req: Request, res: Response) => {
  const job = getJob(req.params.id);

  if (!job) {
    res.status(404).json({ ok: false, error: `Job ${req.params.id} not found` });
    return;
  }

  if (job.status === 'running') {
    res.status(409).json({ ok: false, error: 'Job is already running' });
    return;
  }

  if (job.status === 'done') {
    res.json({ ok: true, message: 'Job already completed', data: job });
    return;
  }

  const agent = getRegisteredAgent(job.agentId);
  if (!agent) {
    const failed = markFailed(job.id, `Agent ${job.agentId} not found in registry`);
    if (failed) try { updateJob(failed); } catch { /* ignore */ }
    res.status(500).json({ ok: false, error: 'Agent not found', data: failed });
    return;
  }

  // Mark running
  markRunning(job.id);

  const context: AgentContext = {
    jobId: job.id,
    projectId: job.projectId,
    startedAt: new Date().toISOString(),
  };

  try {
    const result = await agent.run(job.input, context);
    const updated = markDone(job.id, result);
    if (updated) try { updateJob(updated); } catch { /* ignore */ }
    res.json({ ok: true, data: updated });
  } catch (err) {
    const updated = markFailed(job.id, String(err));
    if (updated) try { updateJob(updated); } catch { /* ignore */ }
    res.status(500).json({ ok: false, error: String(err), data: updated });
  }
});

/**
 * POST /api/analysis/run-all
 * Body: { projectId: string, answers?: Record<string, unknown>, projectPath?: string }
 * Convenience: creates and runs the full analyst pipeline for a project.
 * Persists all job state changes to SQLite.
 */
router.post('/run-all', async (req: Request, res: Response) => {
  const { projectId, answers = {}, projectPath } = req.body as {
    projectId?: string;
    answers?: Record<string, unknown>;
    projectPath?: string;
  };

  if (!projectId) {
    res.status(400).json({ ok: false, error: 'projectId is required' });
    return;
  }

  const analystIds: AgentId[] = [
    'connected-strategy-analyst',
    'competitive-advantage-analyst',
    'business-model-analyst',
    'data-science-opportunity-analyst',
    'architecture-improvement-analyst',
    'ai-frontier-analyst',
  ];

  const reports: import('@cs/agents').AnalystReport[] = [];
  const jobIds: string[] = [];

  for (const agentId of analystIds) {
    const input: Record<string, unknown> = { projectId, answers };
    if (agentId === 'architecture-improvement-analyst' && projectPath) {
      input.projectPath = projectPath;
    }

    const job = createJob(projectId, agentId, input);
    jobIds.push(job.id);
    // Persist queued state
    try { insertJob(job); } catch { /* ignore */ }

    markRunning(job.id);

    const agent = getRegisteredAgent(agentId)!;
    const context: AgentContext = {
      jobId: job.id,
      projectId,
      startedAt: new Date().toISOString(),
    };

    try {
      const result = await agent.run(input, context);
      const updated = markDone(job.id, result);
      if (updated) try { updateJob(updated); } catch { /* ignore */ }
      if (result.success && result.data) {
        reports.push(result.data as import('@cs/agents').AnalystReport);
      }
    } catch (err) {
      const updated = markFailed(job.id, String(err));
      if (updated) try { updateJob(updated); } catch { /* ignore */ }
    }
  }

  // Compose proposals from all reports
  const composerInput = { projectId, reports };
  const composerJob = createJob(projectId, 'proposal-composer', composerInput as unknown as Record<string, unknown>);
  jobIds.push(composerJob.id);
  // Persist composer job
  try { insertJob(composerJob); } catch { /* ignore */ }

  markRunning(composerJob.id);

  const composer = getRegisteredAgent('proposal-composer')!;
  const composerContext: AgentContext = {
    jobId: composerJob.id,
    projectId,
    startedAt: new Date().toISOString(),
  };

  try {
    const composerResult = await composer.run(composerInput as unknown as Record<string, unknown>, composerContext);
    const updatedComposer = markDone(composerJob.id, composerResult);
    if (updatedComposer) try { updateJob(updatedComposer); } catch { /* ignore */ }

    res.json({
      ok: true,
      data: {
        jobIds,
        analystReports: reports,
        proposals: composerResult.data,
        stats: getQueueStats(),
      },
    });
  } catch (err) {
    const updatedComposer = markFailed(composerJob.id, String(err));
    if (updatedComposer) try { updateJob(updatedComposer); } catch { /* ignore */ }
    res.status(500).json({ ok: false, error: String(err), jobIds });
  }
});

/**
 * POST /api/analysis/run-all-projects
 * No body required.
 * Loops through all projects in the DB and runs the full analysis pipeline for each.
 * Returns a summary of jobs created and findings per project.
 */
router.post('/run-all-projects', async (req: Request, res: Response) => {
  let projects: import('@cs/domain').Project[];
  try {
    projects = listProjects();
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to list projects from DB' });
    return;
  }

  if (projects.length === 0) {
    res.status(400).json({ ok: false, error: 'No projects in database. Run POST /api/projects/scan first.' });
    return;
  }

  const analystIds: AgentId[] = [
    'connected-strategy-analyst',
    'competitive-advantage-analyst',
    'business-model-analyst',
    'data-science-opportunity-analyst',
    'architecture-improvement-analyst',
    'ai-frontier-analyst',
  ];

  const summary: Array<{
    projectId: string;
    projectName: string;
    jobIds: string[];
    findings: number;
    proposals: number;
    errors: string[];
  }> = [];

  for (const project of projects) {
    const jobIds: string[] = [];
    const errors: string[] = [];
    const reports: import('@cs/agents').AnalystReport[] = [];

    for (const agentId of analystIds) {
      const input: Record<string, unknown> = { projectId: project.id, answers: {}, projectPath: project.path };
      const job = createJob(project.id, agentId, input);
      jobIds.push(job.id);
      try { insertJob(job); } catch { /* ignore */ }

      markRunning(job.id);
      const agent = getRegisteredAgent(agentId)!;
      const context: AgentContext = { jobId: job.id, projectId: project.id, startedAt: new Date().toISOString() };

      try {
        const result = await agent.run(input, context);
        const updated = markDone(job.id, result);
        if (updated) try { updateJob(updated); } catch { /* ignore */ }
        if (result.success && result.data) {
          reports.push(result.data as import('@cs/agents').AnalystReport);
        }
      } catch (err) {
        const updated = markFailed(job.id, String(err));
        if (updated) try { updateJob(updated); } catch { /* ignore */ }
        errors.push(String(err));
      }
    }

    // Compose proposals
    let proposalCount = 0;
    const composerInput = { projectId: project.id, reports };
    const composerJob = createJob(project.id, 'proposal-composer', composerInput as unknown as Record<string, unknown>);
    jobIds.push(composerJob.id);
    try { insertJob(composerJob); } catch { /* ignore */ }
    markRunning(composerJob.id);

    const composer = getRegisteredAgent('proposal-composer')!;
    const composerCtx: AgentContext = { jobId: composerJob.id, projectId: project.id, startedAt: new Date().toISOString() };

    try {
      const composerResult = await composer.run(composerInput as unknown as Record<string, unknown>, composerCtx);
      const updatedComposer = markDone(composerJob.id, composerResult);
      if (updatedComposer) try { updateJob(updatedComposer); } catch { /* ignore */ }
      const proposals = composerResult.data;
      proposalCount = Array.isArray(proposals) ? proposals.length : 0;
    } catch (err) {
      const updatedComposer = markFailed(composerJob.id, String(err));
      if (updatedComposer) try { updateJob(updatedComposer); } catch { /* ignore */ }
      errors.push(String(err));
    }

    const totalFindings = reports.reduce((sum, r) => sum + (r.findings?.length ?? 0), 0);
    summary.push({
      projectId: project.id,
      projectName: project.name,
      jobIds,
      findings: totalFindings,
      proposals: proposalCount,
      errors,
    });
  }

  res.json({
    ok: true,
    data: {
      projectsAnalyzed: projects.length,
      summary,
      stats: getQueueStats(),
    },
  });
});

export default router;
