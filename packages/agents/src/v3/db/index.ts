import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { HistoricalRun } from '../state-types.js';

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) {
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    dbInstance = new Database(path.join(dbDir, 'telemetry.sqlite'));
    dbInstance.pragma('busy_timeout = 5000');
    
    // Initialize schema
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        runId TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        startedAt TEXT NOT NULL,
        endedAt TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        healthScoreDelta REAL NOT NULL,
        newPriorities INTEGER NOT NULL,
        resolvedPriorities INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_runs_project ON runs(projectId);
    `);
  }
  return dbInstance;
}

export function saveHistoricalRun(run: HistoricalRun) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO runs (
      runId, projectId, startedAt, endedAt, status, error,
      healthScoreDelta, newPriorities, resolvedPriorities
    ) VALUES (
      @runId, @projectId, @startedAt, @endedAt, @status, @error,
      @healthScoreDelta, @newPriorities, @resolvedPriorities
    )
  `);
  stmt.run(run);
}

export function getHistoricalRuns(projectId: string): HistoricalRun[] {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM runs WHERE projectId = ? ORDER BY startedAt DESC LIMIT 50`);
  return stmt.all(projectId) as HistoricalRun[];
}
