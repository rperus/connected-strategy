/**
 * Metrics Routes — Express Router
 *
 * Computes real StrategicMetrics from persisted worksheet answers.
 * Mount at: /api/metrics
 *
 * Endpoints:
 *   GET  /api/metrics/:projectId         — compute metrics from saved answers
 *   POST /api/metrics/:projectId/enrich  — compute + Gemini narrative enrichment
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';
import { listAnswers } from '../../db/repositories/worksheets.js';
import { getProject } from '../../db/repositories/projects.js';
import { synthesizePortfolioInsight } from '@cs/agents';

const router: Router = express.Router();

/**
 * Merges all worksheet answers for a project into a single synthetic WorksheetAnswer
 * that the scoring engine can process.
 */
function mergeAnswers(projectId: string, answers: WorksheetAnswer[]): WorksheetAnswer {
  const merged: Record<string, unknown> = {};
  const confidence: Record<string, 'observed' | 'inferred' | 'confirmed'> = {};

  for (const wa of answers) {
    Object.assign(merged, wa.answers);
    Object.assign(confidence, wa.confidence ?? {});
  }

  return {
    id: `synthetic::${projectId}`,
    worksheetId: 'all',
    projectId,
    version: 1,
    answers: merged,
    confidence,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * GET /api/metrics/:projectId
 *
 * Computes StrategicMetrics from all SQLite-persisted worksheet answers.
 * Returns real scores (0-100) for all 10 metrics.
 * Returns zeroed scores if no answers saved yet.
 */
router.get('/:projectId', (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const project = getProject(projectId);
    const answers = listAnswers(projectId);

    const syntheticAnswer = mergeAnswers(projectId, answers);
    const weights = defaultScoringWeights(projectId);
    const metrics = computeStrategicMetrics(projectId, syntheticAnswer, weights);

    res.json({
      ok: true,
      data: metrics,
      meta: {
        projectName: project?.name ?? projectId,
        answersUsed: answers.length,
        worksheetIds: answers.map((a) => a.worksheetId),
        source: answers.length > 0 ? 'real_answers' : 'zeroed_defaults',
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * POST /api/metrics/:projectId/enrich
 *
 * Same as GET but also triggers a Gemini portfolio insight.
 * Returns metrics + AI narrative.
 */
router.post('/:projectId/enrich', async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const project = getProject(projectId);
    const answers = listAnswers(projectId);

    const syntheticAnswer = mergeAnswers(projectId, answers);
    const weights = defaultScoringWeights(projectId);
    const metrics = computeStrategicMetrics(projectId, syntheticAnswer, weights);

    // Gemini insight (may be empty if no API key)
    const insight = await synthesizePortfolioInsight(
      [project?.name ?? projectId],
      0,
      0,
    );

    res.json({
      ok: true,
      data: {
        metrics,
        insight,
        meta: {
          projectName: project?.name ?? projectId,
          answersUsed: answers.length,
          source: answers.length > 0 ? 'real_answers' : 'zeroed_defaults',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * GET /api/metrics
 *
 * Returns metrics for ALL projects in the DB.
 * Used by portfolio dashboard for the radar grid.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { listProjects } = await import('../../db/repositories/projects.js');
    const projects = listProjects();

    const metricsMap: Record<string, unknown> = {};

    for (const project of projects) {
      const answers = listAnswers(project.id);
      const syntheticAnswer = mergeAnswers(project.id, answers);
      const weights = defaultScoringWeights(project.id);
      const metrics = computeStrategicMetrics(project.id, syntheticAnswer, weights);
      metricsMap[project.id] = metrics;
    }

    res.json({
      ok: true,
      count: projects.length,
      data: metricsMap,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
