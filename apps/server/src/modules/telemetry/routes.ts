import express from 'express';
import type { Request, Response, Router } from 'express';
import { telemetryBus, getTelemetryStats } from '../../services/telemetry.js';
import { getDb } from '../../db/index.js';

const router: Router = express.Router();

/**
 * GET /api/telemetry/stream
 * Server-Sent Events (SSE) endpoint for real-time frontend updates.
 */
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE connection immediately

  // Send an initial connected event
  res.write(`data: ${JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Listener for broadcasting events
  const onBroadcast = (payload: { event: string; data: any; timestamp: string }) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  telemetryBus.on('broadcast', onBroadcast);

  // Cleanup on client disconnect
  req.on('close', () => {
    telemetryBus.off('broadcast', onBroadcast);
  });
});

/**
 * GET /api/telemetry/stats
 * Returns aggregated SaaS metrics (event counts, TTV, 7-day activity).
 */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const stats = getTelemetryStats(db);
    res.json({ ok: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
