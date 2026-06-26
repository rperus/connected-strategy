import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Backup Script for SQLite Databases
 * 
 * Safely creates a hot backup of the connected_strategy.db and llm_cache.db 
 * without blocking concurrent readers/writers using SQLite's native backup API.
 */

function backupDatabase(dbName: string) {
  const rootDir = resolve(process.cwd()); // Assumes run from project root
  const dataDir = resolve(rootDir, 'data');
  const backupDir = resolve(dataDir, 'backups');

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const sourcePath = resolve(dataDir, `${dbName}.db`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetPath = resolve(backupDir, `${dbName}_backup_${timestamp}.db`);

  if (!existsSync(sourcePath)) {
    console.log(`[Backup] Skiping ${dbName}: Source database not found at ${sourcePath}`);
    return;
  }

  console.log(`[Backup] Starting backup for ${dbName}...`);
  const db = new Database(sourcePath, { readonly: true });
  
  try {
    db.backup(targetPath)
      .then(() => {
        console.log(`[Backup] ✅ Successfully backed up ${dbName} to:`);
        console.log(`         ${targetPath}`);
      })
      .catch((err) => {
        console.error(`[Backup] ❌ Failed to backup ${dbName}:`, err);
      })
      .finally(() => {
        db.close();
      });
  } catch (err) {
    console.error(`[Backup] ❌ Sync error on ${dbName}:`, err);
    db.close();
  }
}

console.log('--- Connected Strategy - SQLite Hot Backup ---');
backupDatabase('connected_strategy');
backupDatabase('llm_cache');
