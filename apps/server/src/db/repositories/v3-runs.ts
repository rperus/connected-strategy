import { getDb } from '../index.js';

interface V3Run {
  run_id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  status: 'running' | 'done' | 'failed';
  health_score: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  error_message: string | null;
  state_snapshot_path: string;
}

export function insertRun(record: V3Run): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO v3_runs (
      run_id, project_id, started_at, ended_at, status,
      health_score, total_tokens, estimated_cost_usd, error_message, state_snapshot_path
    ) VALUES (
      @run_id, @project_id, @started_at, @ended_at, @status,
      @health_score, @total_tokens, @estimated_cost_usd, @error_message, @state_snapshot_path
    )
  `);
  stmt.run(record as unknown as Record<string, unknown>);
}

export function updateRunStatus(runId: string, status: 'done' | 'failed', extra: Partial<V3Run>): void {
  const db = getDb();
  
  const setClauses: string[] = ['status = @status'];
  const params: Record<string, unknown> = { run_id: runId, status };

  if (extra.ended_at !== undefined) { setClauses.push('ended_at = @ended_at'); params.ended_at = extra.ended_at; }
  if (extra.health_score !== undefined) { setClauses.push('health_score = @health_score'); params.health_score = extra.health_score; }
  if (extra.total_tokens !== undefined) { setClauses.push('total_tokens = @total_tokens'); params.total_tokens = extra.total_tokens; }
  if (extra.estimated_cost_usd !== undefined) { setClauses.push('estimated_cost_usd = @estimated_cost_usd'); params.estimated_cost_usd = extra.estimated_cost_usd; }
  if (extra.error_message !== undefined) { setClauses.push('error_message = @error_message'); params.error_message = extra.error_message; }
  if (extra.state_snapshot_path !== undefined) { setClauses.push('state_snapshot_path = @state_snapshot_path'); params.state_snapshot_path = extra.state_snapshot_path; }

  const sql = `UPDATE v3_runs SET ${setClauses.join(', ')} WHERE run_id = @run_id`;
  db.prepare(sql).run(params);

  if (status === 'done') {
    db.prepare(`UPDATE projects SET last_execution_date = datetime('now') WHERE id = (SELECT project_id FROM v3_runs WHERE run_id = ?)`).run(runId);
  }
}


export function getRunById(runId: string): V3Run | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM v3_runs WHERE run_id = ?');
  const result = stmt.get(runId);
  return (result as V3Run) || null;
}
