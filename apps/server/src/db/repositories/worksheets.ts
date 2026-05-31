/**
 * Worksheet Answers Repository — SQLite-backed CRUD
 */

import { getDb } from '../index.js';
import type { WorksheetAnswer } from '@cs/domain';

interface AnswerRow {
  id: string;
  worksheet_id: string;
  project_id: string;
  version: number;
  answers: string;
  confidence: string;
  completed_at: string | null;
  updated_at: string;
}

function rowToAnswer(row: AnswerRow): WorksheetAnswer {
  return {
    id: row.id,
    worksheetId: row.worksheet_id,
    projectId: row.project_id,
    version: row.version,
    answers: JSON.parse(row.answers),
    confidence: JSON.parse(row.confidence),
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function upsertAnswer(answer: WorksheetAnswer): WorksheetAnswer {
  const db = getDb();
  const now = new Date().toISOString();
  const id = answer.id ?? `${answer.worksheetId}::${answer.projectId}`;

  db.prepare(`
    INSERT INTO worksheet_answers (id, worksheet_id, project_id, version, answers, confidence, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(worksheet_id, project_id) DO UPDATE SET
      version = excluded.version,
      answers = excluded.answers,
      confidence = excluded.confidence,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at
  `).run(
    id,
    answer.worksheetId,
    answer.projectId,
    answer.version,
    JSON.stringify(answer.answers),
    JSON.stringify(answer.confidence),
    answer.completedAt ?? null,
    now,
  );

  return { ...answer, updatedAt: now };
}

export function getAnswer(worksheetId: string, projectId: string): WorksheetAnswer | undefined {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM worksheet_answers WHERE worksheet_id = ? AND project_id = ?'
  ).get(worksheetId, projectId) as AnswerRow | undefined;
  return row ? rowToAnswer(row) : undefined;
}

export function listAnswers(projectId: string): WorksheetAnswer[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM worksheet_answers WHERE project_id = ? ORDER BY worksheet_id'
  ).all(projectId) as AnswerRow[];
  return rows.map(rowToAnswer);
}

export function listAllAnswers(limit = 500, offset = 0): WorksheetAnswer[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM worksheet_answers ORDER BY project_id, worksheet_id LIMIT ? OFFSET ?'
  ).all(limit, offset) as AnswerRow[];
  return rows.map(rowToAnswer);
}

export function deleteAnswer(worksheetId: string, projectId: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM worksheet_answers WHERE worksheet_id = ? AND project_id = ?'
  ).run(worksheetId, projectId);
  return result.changes > 0;
}
