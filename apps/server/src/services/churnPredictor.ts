import { getDb } from '../db/index.js';
import { broadcastEvent } from './telemetry.js';

export function checkChurnRisks() {
  const db = getDb();
  const now = new Date();

  // Find projects without recent execution
  const projects = db.prepare(`SELECT id, health_score, last_execution_date FROM projects`).all() as any[];

  const updateScoreStmt = db.prepare(`UPDATE projects SET health_score = ? WHERE id = ?`);

  for (const p of projects) {
    if (!p.last_execution_date) continue;
    
    const lastDate = new Date(p.last_execution_date);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    
    let newHealthScore = p.health_score;

    if (diffDays > 21) {
      newHealthScore = Math.max(0, newHealthScore - 20); // Red Alert
    } else if (diffDays > 10) {
      newHealthScore = Math.max(0, newHealthScore - 10); // Yellow Alert
    } else {
      newHealthScore = Math.min(100, newHealthScore + 5); // Recovery
    }

    if (newHealthScore !== p.health_score) {
      updateScoreStmt.run(newHealthScore, p.id);
      broadcastEvent('project:scanned', { oldScore: p.health_score, newScore: newHealthScore }, p.id);
    }
  }
}
