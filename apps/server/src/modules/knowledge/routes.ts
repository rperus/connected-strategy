/**
 * Connected Strategy — Knowledge API Routes
 *
 * REST endpoints for managing the knowledge base:
 * - Ingest sources (Wharton curriculum, custom files, text)
 * - Search the knowledge index
 * - Check ingestion status
 */

import { Router, type Request, type Response } from 'express';
import {
  ingestAllSources,
  ingestSources,
  ingestCustomFile,
  ingestCustomText,
  getIngestionStatus,
  reindexAll,
  reindexSource,
  vectorSearch,
} from '@cs/agents';

const router: Router = Router();

// ─── GET /api/knowledge/status ────────────────────────────────────────────────
/**
 * Returns the current state of the knowledge index.
 */
router.get('/status', (_req, res) => {
  try {
    const status = getIngestionStatus();
    res.json({ ok: true, ...status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/knowledge/ingest ───────────────────────────────────────────────
/**
 * Trigger ingestion of knowledge sources.
 * Body (optional): { sourceIds?: string[] } — specific sources to ingest.
 * If no sourceIds, ingests all sources from the catalog.
 */
router.post('/ingest', async (req, res) => {
  try {
    const { sourceIds } = req.body || {};

    let report;
    if (sourceIds && Array.isArray(sourceIds) && sourceIds.length > 0) {
      report = await ingestSources(sourceIds);
    } else {
      report = await ingestAllSources();
    }

    res.json({ ok: true, report });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/knowledge/reindex ──────────────────────────────────────────────
/**
 * Clear and re-index all sources or a specific source.
 * Body (optional): { sourceId?: string }
 */
router.post('/reindex', async (req, res) => {
  try {
    const { sourceId } = req.body || {};

    if (sourceId) {
      const result = await reindexSource(sourceId);
      res.json({ ok: true, result });
    } else {
      const report = await reindexAll();
      res.json({ ok: true, report });
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/knowledge/search ───────────────────────────────────────────────
/**
 * Search the knowledge index.
 * Body: { query: string, topK?: number, worksheetFilter?: string }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, topK = 5, worksheetFilter } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ ok: false, error: 'Query is required' });
    }

    const results = await vectorSearch(query, topK, worksheetFilter);
    res.json({ ok: true, ...results });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/knowledge/ingest-file ──────────────────────────────────────────
/**
 * Ingest a custom file by path.
 * Body: { filePath: string, title: string, worksheetIds?: string[] }
 */
router.post('/ingest-file', async (req, res) => {
  try {
    const { filePath, title, worksheetIds } = req.body || {};

    if (!filePath || !title) {
      return res.status(400).json({ ok: false, error: 'filePath and title are required' });
    }

    const result = await ingestCustomFile(filePath, title, worksheetIds);
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/knowledge/ingest-text ──────────────────────────────────────────
/**
 * Ingest custom text content directly.
 * Body: { text: string, title: string, worksheetIds?: string[] }
 */
router.post('/ingest-text', async (req, res) => {
  try {
    const { text, title, worksheetIds } = req.body || {};

    if (!text || !title) {
      return res.status(400).json({ ok: false, error: 'text and title are required' });
    }

    const result = await ingestCustomText(text, title, worksheetIds);
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
