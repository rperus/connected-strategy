/**
 * Connected Strategy — API Server
 *
 * Main entry point. Port resolved from canonical config (never hardcoded).
 * Wave 4: SQLite persistence, Gemini LLM, all route modules.
 * Wave 6: dotenv loading, metrics endpoint.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { resolvePort, getProjectRoot } from '@cs/runtime';
import { getDb, closeDb } from './db/index.js';
import { startScheduler, stopScheduler } from './scheduler.js';
import { initTelemetryDb, broadcastEvent } from './services/telemetry.js';

// ─── Load .env before anything else ────────────────────────────────────────
import dotenv from 'dotenv';
try {
  dotenv.config({ path: resolve(getProjectRoot(), '.env') });
  if (process.env.GEMINI_API_KEY) {
    console.log('[CS-API] Gemini LLM: ✅ API key loaded — AI enrichment enabled');
  } else {
    console.log('[CS-API] Gemini LLM: deterministic mode (set GEMINI_API_KEY in .env to enable)');
  }
} catch (e) {
  console.info('[CS-API] No .env file found (optional):', String(e).split('\n')[0]);
}


const app: Express = express();

// Security and compression middleware
app.use(compression());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// W2-8: Tighter rate limiting for expensive pipeline endpoints (LLM calls)
const pipelineLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 pipeline runs per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many pipeline requests. Please wait before running another analysis.' },
});
app.use('/api/pipeline/run-full', pipelineLimiter);
app.use('/api/pipeline/auto-execute', pipelineLimiter);
app.use('/api/pipeline/market-intel', pipelineLimiter);

// Configurable CORS
const corsOrigins = process.env.CS_CORS_ORIGINS 
  ? process.env.CS_CORS_ORIGINS.split(',') 
  : ['http://127.0.0.1:4310', 'http://localhost:4310'];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '5mb' }));

// ─── Initialize SQLite on startup ───────────────────────────────
const database = getDb();

try {
  const row = database.prepare('SELECT value FROM settings WHERE key = ?').get('GEMINI_API_KEY') as any;
  if (row && row.value && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = row.value;
    console.log('[CS-API] Gemini LLM: ✅ API key loaded from SQLite settings');
  }
} catch (e) { /* ignore */ }

// Wire telemetry persistence
initTelemetryDb(database);

// Run maintenance to clean orphan records and enforce data retention
import { cleanOrphanWorksheetAnswers, cleanDuplicateProjects, cleanOldTelemetryEvents } from './db/maintenance.js';
cleanOrphanWorksheetAnswers();
cleanDuplicateProjects();
cleanOldTelemetryEvents(90); // 90 days retention for telemetry


// ─── Auto-mode Scheduler ────────────────────────────────────────
startScheduler();

// ─── Health check ───────────────────────────────────────────────
const serverStartedAt = Date.now();
app.get('/api/health', (_req, res) => {
  // W2-7: Real health check — verify SQLite DB is alive
  try {
    const db = getDb();
    db.prepare('SELECT 1').get(); // lightweight DB ping
    res.json({
      ok: true,
      status: 'ok',
      service: 'connected_strategy_api',
      persistence: 'sqlite',
      uptimeSeconds: Math.floor((Date.now() - serverStartedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      status: 'degraded',
      service: 'connected_strategy_api',
      error: 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── Module route mounts ────────────────────────────────────────
import { requireAuth } from './middleware/auth.js';
app.use('/api', requireAuth);

import runtimeRoutes from './modules/runtime/routes.js';
app.use('/api/runtime', runtimeRoutes);

// Legacy V2 analysis routes removed

import projectsRoutes from './modules/projects/routes.js';
app.use('/api/projects', projectsRoutes);

import reportRoutes from './modules/reports/routes.js';
app.use('/api/reports', reportRoutes);
app.use('/api/prompt-packets', reportRoutes);

import worksheetRoutes from './modules/worksheets/routes.js';
app.use('/api/worksheets', worksheetRoutes);

import settingsRoutes from './modules/settings/routes.js';
app.use('/api/settings', settingsRoutes);

import metricsRoutes from './modules/metrics/routes.js';
app.use('/api/metrics', metricsRoutes);

import pipelineRoutes from './modules/pipeline/routes.js';
app.use('/api/pipeline', pipelineRoutes);

import healthDashboardRoutes from './modules/health/routes.js';
app.use('/api/health-dashboard', healthDashboardRoutes);

import telemetryRoutes from './modules/telemetry/routes.js';
app.use('/api/telemetry', telemetryRoutes);

import copilotRoutes from './modules/copilot/routes.js';
app.use('/api/copilot', copilotRoutes);

import knowledgeRoutes from './modules/knowledge/routes.js';
app.use('/api/knowledge', knowledgeRoutes);

// ─── Global Error Handler ───────────────────────────────────────
import { errorHandler } from './middleware/error-handler.js';
app.use(errorHandler as express.ErrorRequestHandler);

// ─── Start ──────────────────────────────────────────────────────
const PORT = resolvePort('connected_strategy_api', 4311);
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[CS-API] Connected Strategy API running on http://${HOST}:${PORT}`);
  console.log(`[CS-API] Health: http://${HOST}:${PORT}/api/health`);
  console.log(`[CS-API] Persistence: SQLite (data/connected_strategy.db)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[CS-API] Shutting down...');
  stopScheduler();
  closeDb();
  server.close();
});

process.on('SIGINT', () => {
  console.log('[CS-API] Interrupted, closing DB...');
  stopScheduler();
  closeDb();
  server.close();
  process.exit(0);
});

export default app;
