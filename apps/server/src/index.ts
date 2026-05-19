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
try {
  const envPath = resolve(getProjectRoot(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
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
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

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
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    service: 'connected_strategy_api',
    persistence: 'sqlite',
    timestamp: new Date().toISOString(),
  });
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

// ─── Start ──────────────────────────────────────────────────────
const PORT = resolvePort('connected_strategy_api', 4311);

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[CS-API] Connected Strategy API running on http://127.0.0.1:${PORT}`);
  console.log(`[CS-API] Health: http://127.0.0.1:${PORT}/api/health`);
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
