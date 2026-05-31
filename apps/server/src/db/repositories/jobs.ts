/**
 * Analysis Jobs Repository — SQLite-backed CRUD
 */

import { getDb } from '../index.js';
import type { AnalysisJob } from '@cs/agents';

interface JobRow {
  id: string;
  project_id: string;
  agent_id: string;
  status: string;
  input: string;
  result: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

function rowToJob(row: JobRow): AnalysisJob {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: row.agent_id as AnalysisJob['agentId'],
    status: row.status as AnalysisJob['status'],
    input: JSON.parse(row.input),
    result: row.result ? JSON.parse(row.result) : undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export function insertJob(job: AnalysisJob): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO analysis_jobs (id, project_id, agent_id, status, input, result, error_message, created_at, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.projectId,
    job.agentId,
    job.status,
    JSON.stringify(job.input),
    job.result ? JSON.stringify(job.result) : null,
    job.errorMessage ?? null,
    job.createdAt,
    job.startedAt ?? null,
    job.completedAt ?? null,
  );
}

export function updateJob(job: AnalysisJob): void {
  const db = getDb();
  db.prepare(`
    UPDATE analysis_jobs SET
      status = ?, result = ?, error_message = ?, started_at = ?, completed_at = ?
    WHERE id = ?
  `).run(
    job.status,
    job.result ? JSON.stringify(job.result) : null,
    job.errorMessage ?? null,
    job.startedAt ?? null,
    job.completedAt ?? null,
    job.id,
  );
}

export function getJobDb(id: string): AnalysisJob | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM analysis_jobs WHERE id = ?').get(id) as JobRow | undefined;
  return row ? rowToJob(row) : undefined;
}

export function listJobsDb(projectId?: string, limit = 100, offset = 0): AnalysisJob[] {
  const db = getDb();
  if (projectId) {
    return (db.prepare('SELECT * FROM analysis_jobs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(projectId, limit, offset) as JobRow[]).map(rowToJob);
  }
  return (db.prepare('SELECT * FROM analysis_jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as JobRow[]).map(rowToJob);
}

export function getJobStatsDb(): { total: number; queued: number; running: number; done: number; failed: number } {
  const db = getDb();
  const rows = db.prepare('SELECT status, COUNT(*) as cnt FROM analysis_jobs GROUP BY status').all() as Array<{ status: string; cnt: number }>;
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.cnt;
  return {
    total: Object.values(map).reduce((a, b) => a + b, 0),
    queued: map['queued'] ?? 0,
    running: map['running'] ?? 0,
    done: map['done'] ?? 0,
    failed: map['failed'] ?? 0,
  };
}
