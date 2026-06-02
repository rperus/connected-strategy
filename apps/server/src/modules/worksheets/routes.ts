/**
 * Worksheet Routes — Express Router
 * Persists worksheet answers to SQLite.
 * Mount at: /api/worksheets
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import type { WorksheetAnswer } from '@cs/domain';
import { upsertAnswer, getAnswer, listAnswers, deleteAnswer } from '../../db/repositories/worksheets.js';
import { EventHub, ProjectStateStore, getGeminiProvider, registerWorksheetSynthesizer } from '@cs/agents';

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

/**
 * POST /api/worksheets/:projectId/:worksheetId/autofill
 * Zero-UI RAG Autocomplete for worksheets.
 * Executes the WorksheetSynthesizer via EventHub.
 */
router.post('/:projectId/:worksheetId/autofill', async (req: Request, res: Response) => {
  try {
    const store = new ProjectStateStore(process.cwd());
    const hub = new EventHub(store);
    
    // Run in-memory for fast synchronous execution
    // (no await hub.init() means it won't connect to GCP Pub/Sub for this local request)

    const ctx = {
      log: (msg: string) => console.log(`[RAG-Autofill] ${msg}`),
      llm: getGeminiProvider(),
    };

    // 1. Register the agent
    registerWorksheetSynthesizer(hub, ctx);

    const questions = req.body.questions || [];

    // 2. Set up a listener for the result
    let result: any = null;
    hub.subscribe('WORKSHEET_SYNTHESIZER_COMPLETED', (event: any) => {
      result = event.payload.data;
    });

    // 3. Publish the command to trigger the agent
    await hub.publish({
      domain: 'command',
      type: 'RUN_WORKSHEET_SYNTHESIZER',
      projectId: req.params.projectId,
      payload: { worksheetId: req.params.worksheetId, questions },
      timestamp: Date.now()
    });

    if (result) {
      res.json({ ok: true, data: result });
    } else {
      res.status(500).json({ ok: false, error: 'Synthesizer failed to yield result' });
    }
  } catch (err: any) {
    console.error('Autofill error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
