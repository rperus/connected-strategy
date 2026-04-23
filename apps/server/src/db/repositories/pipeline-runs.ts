/**
 * Pipeline Runs Repository — SQLite-backed history
 */

import { getDb } from '../index.js';

export interface PipelineRunRow {
  id: number;
  timestamp: string;
  elapsed: string;
  projects_scanned: number;
  total_findings: number;
  total_proposals: number;
  total_prompts: number;
  summary: string;
}

export function insertPipelineRun(run: Omit<PipelineRunRow, 'id'>): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO pipeline_runs (timestamp, elapsed, projects_scanned, total_findings, total_proposals, total_prompts, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    run.timestamp,
    run.elapsed,
    run.projects_scanned,
    run.total_findings,
    run.total_proposals,
    run.total_prompts,
    run.summary,
  );
  return result.lastInsertRowid as number;
}

export function listPipelineRuns(limit = 20): PipelineRunRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT ?').all(limit) as PipelineRunRow[];
}

export function countPipelineRuns(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as cnt FROM pipeline_runs').get() as { cnt: number };
  return row.cnt;
}
