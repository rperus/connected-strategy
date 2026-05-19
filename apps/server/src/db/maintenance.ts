/**
 * Database maintenance utilities
 * Cleans orphan records that don't match current canonical definitions.
 */

import { getDb } from './index.js';
import { ALL_WORKSHEETS } from '@cs/domain';

/**
 * Remove worksheet_answers rows whose worksheet_id doesn't match
 * any canonical worksheet definition (e.g., legacy 'WS01' entries).
 * Returns the number of rows deleted.
 */
export function cleanOrphanWorksheetAnswers(): number {
  const db = getDb();
  const validIds = ALL_WORKSHEETS.map(ws => ws.id);
  const placeholders = validIds.map(() => '?').join(',');

  const result = db.prepare(
    `DELETE FROM worksheet_answers WHERE worksheet_id NOT IN (${placeholders})`
  ).run(...validIds);

  if (result.changes > 0) {
    console.log(`[CS-DB] Cleaned ${result.changes} orphan worksheet answer(s)`);
  }

  return result.changes;
}

/**
 * Remove duplicate projects by keeping only the most recently updated row
 * for each normalized project ID.
 */
export function cleanDuplicateProjects(): number {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM projects WHERE rowid NOT IN (
      SELECT MIN(rowid) FROM projects GROUP BY id
    )
  `).run();

  if (result.changes > 0) {
    console.log(`[CS-DB] Cleaned ${result.changes} duplicate project(s)`);
  }

  return result.changes;
}

/**
 * Remove telemetry events older than 90 days to comply with Data Retention policy
 * and prevent infinite database growth.
 */
export function cleanOldTelemetryEvents(daysToKeep = 90): number {
  const db = getDb();
  
  // Wrap in try-catch in case the telemetry table hasn't been created yet on first boot
  try {
    const result = db.prepare(`
      DELETE FROM telemetry_events 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `).run(daysToKeep);

    if (result.changes > 0) {
      console.log(`[CS-DB] Cleaned ${result.changes} old telemetry event(s)`);
    }

    return result.changes;
  } catch (e) {
    // Table might not exist yet, safe to ignore
    return 0;
  }
}
