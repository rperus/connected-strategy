/**
 * Worksheet Routes — Express Router
 * Persists worksheet answers to SQLite.
 * Mount at: /api/worksheets
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import type { WorksheetAnswer } from '@cs/domain';
import { upsertAnswer, getAnswer, listAnswers, deleteAnswer } from '../../db/repositories/worksheets.js';

const router: Router = express.Router();

/**
 * GET /api/worksheets/:projectId
 * List all worksheet answers for a project.
 */
router.get('/:projectId', (req: Request, res: Response) => {
  const answers = listAnswers(req.params.projectId);
  res.json({ ok: true, count: answers.length, data: answers });
});

/**
 * GET /api/worksheets/:projectId/:worksheetId
 * Get a single answer.
 */
router.get('/:projectId/:worksheetId', (req: Request, res: Response) => {
  const answer = getAnswer(req.params.worksheetId, req.params.projectId);
  if (!answer) {
    res.status(404).json({ ok: false, error: 'Answer not found' });
    return;
  }
  res.json({ ok: true, data: answer });
});

/**
 * PUT /api/worksheets/:projectId/:worksheetId
 * Save/update a worksheet answer.
 */
router.put('/:projectId/:worksheetId', (req: Request, res: Response) => {
  const body = req.body as Partial<WorksheetAnswer>;
  const answer: WorksheetAnswer = {
    id: body.id ?? `${req.params.worksheetId}::${req.params.projectId}`,
    worksheetId: req.params.worksheetId,
    projectId: req.params.projectId,
    version: body.version ?? 1,
    answers: body.answers ?? {},
    confidence: body.confidence ?? {},
    completedAt: body.completedAt,
    updatedAt: new Date().toISOString(),
  };
  const saved = upsertAnswer(answer);
  res.json({ ok: true, data: saved });
});

/**
 * DELETE /api/worksheets/:projectId/:worksheetId
 */
router.delete('/:projectId/:worksheetId', (req: Request, res: Response) => {
  const deleted = deleteAnswer(req.params.worksheetId, req.params.projectId);
  if (!deleted) {
    res.status(404).json({ ok: false, error: 'Answer not found' });
    return;
  }
  res.json({ ok: true, message: 'Deleted' });
});

export default router;
