/**
 * Projects Repository — SQLite-backed CRUD
 */

import { getDb } from '../index.js';
import type { Project } from '@cs/domain';

// ─── Row shape (snake_case → camelCase) ───────────────────────────────────────

interface ProjectRow {
  id: string;
  name: string;
  path: string;
  stack: string;       // JSON array
  maturity: string;
  tags: string;        // JSON array
  last_scanned: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    stack: JSON.parse(row.stack),
    maturity: row.maturity as Project['maturity'],
    tags: JSON.parse(row.tags),
    lastScanned: row.last_scanned ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function upsertProject(project: Project): Project {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, name, path, stack, maturity, tags, last_scanned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      path = excluded.path,
      stack = excluded.stack,
      maturity = excluded.maturity,
      tags = excluded.tags,
      last_scanned = excluded.last_scanned,
      updated_at = excluded.updated_at
  `).run(
    project.id,
    project.name,
    project.path,
    JSON.stringify(project.stack),
    project.maturity,
    JSON.stringify(project.tags),
    project.lastScanned ?? null,
    project.createdAt ?? now,
    now,
  );

  return { ...project, updatedAt: now };
}

export function getProject(id: string): Project | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : undefined;
}

export function listProjects(filters?: { maturity?: string; stack?: string }): Project[] {
  const db = getDb();
  let sql = 'SELECT * FROM projects WHERE 1=1';
  const params: string[] = [];

  if (filters?.maturity) {
    sql += ' AND maturity = ?';
    params.push(filters.maturity);
  }
  if (filters?.stack) {
    sql += ' AND stack LIKE ?';
    params.push(`%${filters.stack}%`);
  }

  sql += ' ORDER BY updated_at DESC';
  const rows = db.prepare(sql).all(...params) as ProjectRow[];
  return rows.map(rowToProject);
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function countProjects(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as cnt FROM projects').get() as { cnt: number };
  return row.cnt;
}
