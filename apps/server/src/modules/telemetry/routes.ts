import express from 'express';
import type { Request, Response, Router } from 'express';
import { telemetryBus } from '../../services/telemetry.js';

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

export default router;
