/**
 * Projects Routes — Express Router (SQLite-backed)
 *
 * HTTP API for project registry and portfolio scanning.
 * Mount at: /api/projects
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import {
  createJob,
  markRunning,
  markDone,
  markFailed,
  getRegisteredAgent,
} from '@cs/agents';
import type { AgentContext, ScanEntry } from '@cs/agents';
import type { Project } from '@cs/domain';
import { upsertProject, getProject, listProjects, deleteProject, countProjects } from '../../db/repositories/projects.js';
import { insertJob, updateJob } from '../../db/repositories/jobs.js';

const router: Router = express.Router();

function scanEntryToProject(entry: ScanEntry): Project {
  return {
    id: entry.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: entry.name,
    path: entry.path,
    stack: entry.stack,
    maturity: entry.maturity,
    tags: entry.tags,
    lastScanned: entry.detectedAt,
    createdAt: entry.detectedAt,
    updatedAt: entry.detectedAt,
  };
}

/**
 * GET /api/projects
 */
router.get('/', (req: Request, res: Response) => {
  const { maturity, stack } = req.query as { maturity?: string; stack?: string };
  const projects = listProjects({ maturity, stack });
  res.json({ ok: true, count: projects.length, data: projects });
});

/**
 * GET /api/projects/:id
 */
router.get('/:id', (req: Request, res: Response) => {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ ok: false, error: `Project ${req.params.id} not found` });
    return;
  }
  res.json({ ok: true, data: project });
});

/**
 * POST /api/projects/scan
 */
router.post('/scan', async (req: Request, res: Response) => {
  const { scanPath } = req.body as { scanPath?: string };

  const scannerAgent = getRegisteredAgent('portfolio-scanner');
  if (!scannerAgent) {
    res.status(500).json({ ok: false, error: 'portfolio-scanner agent not found in registry' });
    return;
  }

  const job = createJob('system', 'portfolio-scanner', { scanPath });
  insertJob(job);
  markRunning(job.id);

  const context: AgentContext = {
    jobId: job.id,
    projectId: 'system',
    startedAt: new Date().toISOString(),
  };

  try {
    const result = await scannerAgent.run({ scanPath }, context);
    const doneJob = markDone(job.id, result);
    if (doneJob) updateJob(doneJob);

    if (!result.success || !result.data) {
      res.status(500).json({
        ok: false,
        error: result.errorMessage ?? 'Scanner returned no data',
        jobId: job.id,
      });
      return;
    }

    const scanResult = result.data as import('@cs/agents').PortfolioScanResult;

    // Persist all discovered projects to SQLite
    let newCount = 0;
    for (const entry of scanResult.projects) {
      const project = scanEntryToProject(entry);
      const existing = getProject(project.id);
      if (!existing) newCount++;
      upsertProject(project);
    }

    res.json({
      ok: true,
      data: {
        jobId: job.id,
        scanPath: scanResult.scanPath,
        scannedAt: scanResult.scannedAt,
        totalFound: scanResult.totalFound,
        newRegistered: newCount,
        projects: scanResult.projects,
      },
    });
  } catch (err) {
    const failedJob = markFailed(job.id, String(err));
    if (failedJob) updateJob(failedJob);
    res.status(500).json({ ok: false, error: String(err), jobId: job.id });
  }
});

/**
 * POST /api/projects (manual registration)
 */
router.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<Project>;

  if (!body.id || !body.name || !body.path) {
    res.status(400).json({ ok: false, error: 'id, name, and path are required' });
    return;
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: body.id,
    name: body.name,
    path: body.path,
    stack: body.stack ?? [],
    maturity: body.maturity ?? 'developing',
    tags: body.tags ?? [],
    createdAt: body.createdAt ?? now,
    updatedAt: now,
  };

  upsertProject(project);
  res.status(201).json({ ok: true, data: project });
});

/**
 * DELETE /api/projects/:id
 */
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) {
    res.status(404).json({ ok: false, error: `Project ${req.params.id} not found` });
    return;
  }
  res.json({ ok: true, message: `Project ${req.params.id} removed` });
});

export default router;
