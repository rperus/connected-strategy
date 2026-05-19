import { EventEmitter } from 'events';
import type Database from 'better-sqlite3';

// Global event bus for real-time telemetry
export const telemetryBus = new EventEmitter();

// Injected DB reference (set on startup, avoids circular imports)
let _db: Database.Database | null = null;

export function initTelemetryDb(db: Database.Database): void {
  _db = db;
  // Ensure telemetry_events table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      event       TEXT NOT NULL,
      project_id  TEXT,
      session_id  TEXT,
      payload     TEXT NOT NULL DEFAULT '{}',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tel_event      ON telemetry_events(event);
    CREATE INDEX IF NOT EXISTS idx_tel_project    ON telemetry_events(project_id);
    CREATE INDEX IF NOT EXISTS idx_tel_created    ON telemetry_events(created_at);
  `);
}

// Define allowed event types for type safety
export type TelemetryEventName =
  | 'pipeline:started'
  | 'pipeline:completed'
  | 'pipeline:throttled'
  | 'agent:started'
  | 'agent:completed'
  | 'agent:failed'
  | 'agent:activity'
  | 'project:score_updated'
  | 'worksheet:opened'
  | 'worksheet:saved'
  | 'copilot:query'
  | 'report:generated'
  | 'project:scanned'
  | 'user:first_value'; // TTV marker

/**
 * Broadcasts an event to all connected SSE clients
 * AND persists it to SQLite for analytics.
 */
export function broadcastEvent(
  event: TelemetryEventName,
  data: Record<string, unknown>,
  projectId?: string
): void {
  const payload = { event, data, timestamp: new Date().toISOString() };
  telemetryBus.emit('broadcast', payload);

  // Persist to SQLite (fire-and-forget, never throws)
  if (_db) {
    try {
      _db.prepare(
        `INSERT INTO telemetry_events (event, project_id, payload) VALUES (?, ?, ?)`
      ).run(event, projectId ?? data['projectId'] ?? null, JSON.stringify(data));
    } catch {
      // Telemetry must never crash the main flow
    }
  }
}

/**
 * Returns aggregate SaaS metrics from persisted telemetry.
 */
export function getTelemetryStats(db: Database.Database) {
  const total = (db.prepare(`SELECT COUNT(*) as c FROM telemetry_events`).get() as { c: number }).c;
  const byEvent = db.prepare(
    `SELECT event, COUNT(*) as count FROM telemetry_events GROUP BY event ORDER BY count DESC`
  ).all() as Array<{ event: string; count: number }>;
  const last7d = (db.prepare(
    `SELECT COUNT(*) as c FROM telemetry_events WHERE created_at >= datetime('now', '-7 days')`
  ).get() as { c: number }).c;
  // TTV = avg time from project:scanned to user:first_value per project
  const ttvRows = db.prepare(`
    SELECT 
      a.project_id,
      MIN(a.created_at) as scanned_at,
      MIN(b.created_at) as first_value_at
    FROM telemetry_events a
    JOIN telemetry_events b ON a.project_id = b.project_id
    WHERE a.event = 'project:scanned'
      AND b.event = 'user:first_value'
    GROUP BY a.project_id
  `).all() as Array<{ project_id: string; scanned_at: string; first_value_at: string }>;
  const avgTtvMs = ttvRows.length > 0
    ? ttvRows.reduce((sum, r) => sum + (new Date(r.first_value_at).getTime() - new Date(r.scanned_at).getTime()), 0) / ttvRows.length
    : null;
  return { total, byEvent, last7d, avgTtvMs };
}
