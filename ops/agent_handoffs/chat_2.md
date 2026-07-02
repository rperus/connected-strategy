---
type: context
---
SLOT: Chat 2
ESTADO: complete
TASK_ID: Wave-5-Chat-2
TASK_TITLE: Wire analysis pipeline SQLite persistence + UI integration
UPDATED_AT: 2026-04-22T22:53:00-06:00

WRITE_SET:
- apps/server/src/modules/analysis/routes.ts  MODIFIED — SQLite persistence + 2 new endpoints
- apps/web/src/pages/HomePage.tsx             MODIFIED — "▶ Analizar Todo" button + status panel
- apps/web/src/pages/PortfolioPage.tsx        MODIFIED — per-project Analizar + queue stats + analysis status

ARCHIVOS_TOCADOS:

apps/server/src/modules/analysis/routes.ts:
  - POST /jobs: now calls insertJob(job) after createJob()
  - POST /jobs/:id/run: calls updateJob() after markDone() and markFailed()
  - POST /run-all: calls insertJob() for each job, updateJob() after each markDone/markFailed
  - NEW GET /jobs/:id/result: returns job.result for a completed job (404 if not found, 409 if not done)
  - NEW POST /run-all-projects: reads all projects from DB via listProjects(), runs full pipeline for each,
    returns summary with findings count, proposals count, errors per project

apps/web/src/pages/HomePage.tsx:
  - Added analyzing/analysisResult/analysisError state
  - "▶ Analizar Todo" button → POST api.analysisRunAll with firstProject.id and path
  - Running: shows animated "⟳ Analizando…" status bar
  - Done: shows "✓ Análisis completado · N hallazgos · N propuestas" with link to Proposals
  - Error: shows error message
  - Calls refetchStats() after analysis to update job queue badge

apps/web/src/pages/PortfolioPage.tsx:
  - Added per-project analysisState: {status, findings, proposals, error}
  - Added usePolling(api.analysisStats, 5000) for live queue monitoring
  - Per-project "▶ Analizar" button below each ProjectCard → POST api.analysisRunAll
  - Status indicator below card: Sin análisis / ⟳ Analizando… / ✓ findings·proposals / ⚠ Error
  - Queue stats summary card at bottom (total, queued, running, done, failed)

VALIDACION:
- pnpm --filter @cs/server typecheck → PASS (0 errors)
- pnpm --filter @cs/web typecheck    → PASS (0 errors)

BLOQUEOS: none

SIGUIENTE_SEGURO:
- Wave 5 Chat 1 (if applicable) can verify insertJob/updateJob are called in the same DB transaction scope
- Wave 5 Chat 3 (Electron dynamic URL) is independent — no conflict
- After all Wave 5 chats return LISTO, Cerebro can update CURRENT_STATE to v1.2.0
