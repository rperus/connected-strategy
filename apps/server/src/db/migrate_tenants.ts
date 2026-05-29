import Database from 'better-sqlite3';
import { resolve } from 'path';
import { getProjectRoot } from '@cs/runtime';

const dbPath = resolve(getProjectRoot(), 'data', 'connected_strategy.db');
const db = new Database(dbPath);

console.log('[CS-Migrate] Applying multi-tenant migration...');

const tables = [
  'projects',
  'worksheet_answers',
  'analysis_jobs',
  'prompt_packets',
  'pipeline_runs',
  'telemetry_events'
];

db.transaction(() => {
  for (const table of tables) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'local-workspace';`);
      console.log(`[OK] Added tenant_id to ${table}`);
      
      // Create index for performance
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id);`);
    } catch (e: any) {
      if (e.message.includes('duplicate column name')) {
        console.log(`[SKIP] tenant_id already exists in ${table}`);
      } else {
        console.error(`[ERROR] Failed to alter ${table}:`, e.message);
      }
    }
  }
})();

console.log('[CS-Migrate] Multi-tenant migration complete.');
db.close();
