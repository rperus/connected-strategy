import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { HubEvent } from './event-hub.js';

export interface OutboxRecord {
  id: string;
  domain: string;
  type: string;
  projectId: string;
  payload: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  timestamp: number;
}

export class OutboxStore {
  private db: Database.Database;

  constructor() {
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(path.join(dbDir, 'events_outbox.sqlite'));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        type TEXT NOT NULL,
        projectId TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING', 'PROCESSED', 'FAILED')),
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events(status);
      CREATE INDEX IF NOT EXISTS idx_outbox_type ON outbox_events(type);
    `);
  }

  insertEvent(event: HubEvent): string {
    const stmt = this.db.prepare(`
      INSERT INTO outbox_events (id, domain, type, projectId, payload, status, timestamp)
      VALUES (@id, @domain, @type, @projectId, @payload, 'PENDING', @timestamp)
    `);
    
    const id = crypto.randomUUID();
    
    stmt.run({
      id,
      domain: event.domain,
      type: event.type,
      projectId: event.projectId,
      payload: JSON.stringify(event.payload),
      timestamp: event.timestamp || Date.now()
    });

    return id;
  }

  getPendingEvents(limit = 100): OutboxRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM outbox_events 
      WHERE status = 'PENDING' 
      ORDER BY timestamp ASC 
      LIMIT ?
    `);
    return stmt.all(limit) as OutboxRecord[];
  }

  markAsProcessed(id: string): void {
    const stmt = this.db.prepare(`UPDATE outbox_events SET status = 'PROCESSED' WHERE id = ?`);
    stmt.run(id);
  }

  markAsFailed(id: string): void {
    const stmt = this.db.prepare(`UPDATE outbox_events SET status = 'FAILED' WHERE id = ?`);
    stmt.run(id);
  }
}
