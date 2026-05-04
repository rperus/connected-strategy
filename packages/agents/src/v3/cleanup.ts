import fs from 'fs';
import path from 'path';

// Borra snapshots viejos, mantiene últimos N
export function pruneSnapshots(projectId: string, keep: number = 20, rootDir: string = 'data/projects'): number {
  const snapshotsDir = path.join(rootDir, projectId, 'snapshots');
  if (!fs.existsSync(snapshotsDir)) return 0;

  const files = fs.readdirSync(snapshotsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ name: f, time: fs.statSync(path.join(snapshotsDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time); // newest first

  let deleted = 0;
  for (let i = keep; i < files.length; i++) {
    fs.unlinkSync(path.join(snapshotsDir, files[i].name));
    deleted++;
  }
  return deleted;
}

// Borra cache LLM > N días
export function pruneLLMCache(projectId: string, maxAgeDays: number = 30, rootDir: string = 'data/projects'): number {
  const cacheDir = path.join(rootDir, projectId, 'llm-cache');
  if (!fs.existsSync(cacheDir)) return 0;

  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(cacheDir)
    .filter(f => f.endsWith('.json'));

  let deleted = 0;
  for (const f of files) {
    const fullPath = path.join(cacheDir, f);
    const stat = fs.statSync(fullPath);
    if (now - stat.mtime.getTime() > maxAgeMs) {
      fs.unlinkSync(fullPath);
      deleted++;
    }
  }
  return deleted;
}
