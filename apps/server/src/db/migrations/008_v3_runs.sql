CREATE TABLE IF NOT EXISTS v3_runs (
  run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','done','failed')),
  health_score INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd REAL,
  error_message TEXT,
  state_snapshot_path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_v3_runs_project ON v3_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_v3_runs_status ON v3_runs(status);
