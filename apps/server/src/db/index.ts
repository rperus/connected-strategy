/**
 * Connected Strategy — SQLite Database Layer
 *
 * Single-file database at data/connected_strategy.db.
 * Uses better-sqlite3 for synchronous, zero-config persistence.
 * All tables auto-create on first access.
 */

import Database from 'better-sqlite3';
import { resolve } from 'path';
import { getProjectRoot } from '@cs/runtime';

// ─── Singleton ────────────────────────────────────────────────────────────────

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = resolve(getProjectRoot(), 'data', 'connected_strategy.db');
  db = new Database(dbPath);

  // WAL mode for concurrent reads
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations on first connect
  migrate(db);

  console.log(`[CS-DB] SQLite database ready at ${dbPath}`);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ─── Schema Migration ─────────────────────────────────────────────────────────

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      path          TEXT NOT NULL,
      stack         TEXT NOT NULL DEFAULT '[]',
      maturity      TEXT NOT NULL DEFAULT 'developing',
      tags          TEXT NOT NULL DEFAULT '[]',
      last_scanned  TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worksheet_answers (
      id            TEXT PRIMARY KEY,
      worksheet_id  TEXT NOT NULL,
      project_id    TEXT NOT NULL,
      version       INTEGER NOT NULL DEFAULT 1,
      answers       TEXT NOT NULL DEFAULT '{}',
      confidence    TEXT NOT NULL DEFAULT '{}',
      completed_at  TEXT,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(worksheet_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS analysis_jobs (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      agent_id      TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'queued',
      input         TEXT NOT NULL DEFAULT '{}',
      result        TEXT,
      error_message TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      started_at    TEXT,
      completed_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS prompt_packets (
      id                  TEXT PRIMARY KEY,
      proposal_id         TEXT NOT NULL,
      type                TEXT NOT NULL,
      context             TEXT NOT NULL DEFAULT '',
      evidence            TEXT NOT NULL DEFAULT '',
      objective           TEXT NOT NULL DEFAULT '',
      constraints         TEXT NOT NULL DEFAULT '[]',
      affected_files      TEXT NOT NULL DEFAULT '[]',
      acceptance_criteria TEXT NOT NULL DEFAULT '',
      risks               TEXT NOT NULL DEFAULT '[]',
      expected_tests      TEXT NOT NULL DEFAULT '[]',
      markdown            TEXT NOT NULL DEFAULT '',
      generated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp     TEXT NOT NULL DEFAULT (datetime('now')),
      elapsed       TEXT NOT NULL,
      projects_scanned INTEGER NOT NULL DEFAULT 0,
      total_findings INTEGER NOT NULL DEFAULT 0,
      total_proposals INTEGER NOT NULL DEFAULT 0,
      total_prompts  INTEGER NOT NULL DEFAULT 0,
      summary       TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS v3_runs (
      run_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL CHECK(status IN ('running','done','failed')),
      health_score INTEGER,
      total_tokens INTEGER,
      estimated_cost_usd REAL,
      error_message TEXT,
      state_snapshot_path TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_project ON analysis_jobs(project_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status  ON analysis_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_ws_project   ON worksheet_answers(project_id);
    CREATE INDEX IF NOT EXISTS idx_packets_proposal ON prompt_packets(proposal_id);
    CREATE INDEX IF NOT EXISTS idx_v3_runs_project ON v3_runs(project_id);
    CREATE INDEX IF NOT EXISTS idx_v3_runs_status ON v3_runs(status);
  `);
}
