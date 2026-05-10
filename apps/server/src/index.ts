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
import { resolvePort, getProjectRoot } from '@cs/runtime';
import { getDb, closeDb } from './db/index.js';

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

app.use(cors({
  origin: ['http://127.0.0.1:4310', 'http://localhost:4310'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '5mb' }));

// ─── Initialize SQLite on startup ───────────────────────────────
getDb();

// Run maintenance to clean orphan records
import { cleanOrphanWorksheetAnswers, cleanDuplicateProjects } from './db/maintenance.js';
cleanOrphanWorksheetAnswers();
cleanDuplicateProjects();

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
import runtimeRoutes from './modules/runtime/routes.js';
app.use('/api/runtime', runtimeRoutes);

import analysisRoutes from './modules/analysis/routes.js';
app.use('/api/analysis', analysisRoutes);

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
import v3PipelineRoutes from './modules/pipeline/v3-route.js';
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/pipeline', v3PipelineRoutes);

import healthDashboardRoutes from './modules/health/routes.js';
app.use('/api/health-dashboard', healthDashboardRoutes);

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
  closeDb();
  server.close();
});

process.on('SIGINT', () => {
  console.log('[CS-API] Interrupted, closing DB...');
  closeDb();
  server.close();
  process.exit(0);
});

export default app;
