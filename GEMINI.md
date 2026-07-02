---
type: context
---
# Connected Strategy

Local-first strategic control tower for Connected Strategy / Wharton curriculum.

**Stack:** Vite + React + TypeScript, Node backend, SQLite.

## Workspace

This project lives at `C:\dev\Connected_Strategy`.

Read `CURRENT_STATE.md` and `PROJECT_MANIFEST.yaml` for current status.

## Key directories

- `packages/domain/` — shared types, schemas, worksheet definitions
- `packages/agents/` — analysis agents and LLM orchestration
- `apps/server/` — Express API backend
- `apps/web/` — React frontend
- `prompts/task-sets/` — structured task prompts
- `state/` — project state, plans, checkpoints
- `data/` — generated analysis outputs

## OKF Documentation (Infrastructure Knowledge)

This repo maintains OKF-formatted documentation in `docs/`. Before modifying database schemas, API routes, or SQL queries:

1. **Read `docs/index.md` first** — navigate by progressive disclosure, don't grep
2. **`docs/tables/*.md`** — extracted table schemas with column types
3. **`docs/tables/queries/*.md`** — extracted SQL queries from codebase
4. **`docs/references/api_endpoints.md`** — API endpoint catalog

These files auto-update `index.md` and `log.md` on every git commit via pre-commit hook.
