/**
 * Runtime Routes — Express Router
 *
 * HTTP API surface for runtime state inspection and port management.
 * Mount at: /api/runtime
 *
 * Worker: SET-05 / SLOT: Chat 2
 * Mount instruction: apps/server/src/index.ts
 *   import runtimeRoutes from './modules/runtime/routes.js';
 *   app.use('/api/runtime', runtimeRoutes);
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import {
  readActivePorts,
  getAllPorts,
  listSessions,
  getSession,
  getActiveSessions,
  listTools,
  getCollisionLog,
  checkHealth,
} from '@cs/runtime';

const router: Router = express.Router();

// ─── Port status ──────────────────────────────────────────────────────────────

/**
 * GET /api/runtime/ports
 * Returns the full active_ports.json contents (live runtime truth).
 */
router.get('/ports', (_req: Request, res: Response) => {
  const data = readActivePorts();
  res.json({ ok: true, data });
});

/**
 * GET /api/runtime/ports/resolved
 * Returns merged port map (active_ports → port_registry).
 */
router.get('/ports/resolved', (_req: Request, res: Response) => {
  const resolved = getAllPorts();
  res.json({ ok: true, data: resolved });
});

// ─── Collision log ────────────────────────────────────────────────────────────

/**
 * GET /api/runtime/collisions
 * Returns the in-memory collision log for this server process lifetime.
 */
router.get('/collisions', (_req: Request, res: Response) => {
  const log = getCollisionLog();
  res.json({ ok: true, count: log.length, data: log });
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

/**
 * GET /api/runtime/sessions
 * List all runtime sessions.
 */
router.get('/sessions', (_req: Request, res: Response) => {
  const sessions = listSessions();
  res.json({ ok: true, count: sessions.length, data: sessions });
});

/**
 * GET /api/runtime/sessions/active
 * List non-stopped sessions only.
 */
router.get('/sessions/active', (_req: Request, res: Response) => {
  const sessions = getActiveSessions();
  res.json({ ok: true, count: sessions.length, data: sessions });
});

/**
 * GET /api/runtime/sessions/:id
 * Get a single session by ID.
 */
router.get('/sessions/:id', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ ok: false, error: `Session ${req.params.id} not found` });
    return;
  }
  res.json({ ok: true, data: session });
});

// ─── Tools ────────────────────────────────────────────────────────────────────

/**
 * GET /api/runtime/tools
 * List all registered external tools.
 */
router.get('/tools', (_req: Request, res: Response) => {
  const tools = listTools();
  res.json({ ok: true, count: tools.length, data: tools });
});

// ─── Health ───────────────────────────────────────────────────────────────────

/**
 * POST /api/runtime/health-check
 * Body: { service: string, url: string }
 * Performs a live health check and returns the result.
 */
router.post('/health-check', async (req: Request, res: Response) => {
  const { service, url } = req.body as { service?: string; url?: string };

  if (!service || !url) {
    res.status(400).json({ ok: false, error: 'service and url are required' });
    return;
  }

  try {
    const result = await checkHealth(service, url);
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * GET /api/runtime/status
 * Summary health check for the runtime module itself.
 */
router.get('/status', (_req: Request, res: Response) => {
  const active = getActiveSessions();
  const ports = readActivePorts();
  const tools = listTools();

  res.json({
    ok: true,
    data: {
      module: 'runtime',
      activeSessions: active.length,
      trackedServices: Object.keys(ports.services).length,
      trackedProjects: Object.keys(ports.projects).length,
      registeredTools: tools.length,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
