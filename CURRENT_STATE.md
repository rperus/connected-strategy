---
type: context
---
# Current State

> Date: 2026-06-26
> Version: 2.9.5 "Tier 2 Production Readiness"
> Coordinator: Cerebro
> Active Wave: Launch Readiness

## Platform Status — v2.9.5

| Check | Result |
|---|---|
| Security | ✅ 0 High/Moderate CVEs, Command Injections mitigated |
| Architecture | ✅ 0 Circular Dependencies (V3 Broken Cycles) |
| Web Bundle | ✅ Code-split (240kB initial) + Skeletons |
| Stability | ✅ Rate limits, Zod runtime checks, Graceful Degradation |
| Caching | ✅ LLM SQLite Cache, timeout 30s, Retry 3x |
|---|---|
| pnpm --filter @cs/domain typecheck | ✅ 0 errors |
| pnpm --filter @cs/agents typecheck | ✅ 0 errors |
| pnpm --filter @cs/server typecheck | ✅ 0 errors |
| pnpm --filter @cs/web typecheck | ✅ 0 errors |
| Worksheets | ✅ 15 worksheets (WS01-WS15) |
| Agents | ✅ 3 active agents (Swarm V3 modular) |
| Interactive Pages | ✅ 33 pages |
| Swarm Engine | ✅ Mediator event-ready orquestación |
| **RAG Pipeline** | ✅ **SQLite FTS5 — PDF Ingestion & Cleaning** |
| **Knowledge API** | ✅ **6 endpoints at /api/knowledge/*** |
| **Lambda Scripts** | ✅ **Benchmark + Training Data generators** |
| **Open Source Harness** | ✅ **OpenAI provider + Semantic Reviewer + Thinking tags** |

## What Changed: v2.9.4 → v2.9.5

### v2.9.5 — Tier 2 Production Readiness
- **Persistencia de Caché LLM**: Implementada base de datos SQLite específica para el caché (`llm_cache.db`), previniendo llamadas repetitivas costosas a APIs externas y compartiendo el caché entre procesos.
- **Graceful Degradation en LLM**: Añadido lógica estricta de `withRetry` (3 reintentos) y `timeout` (30s) en `packages/agents/src/llm-provider.ts` para manejar fallos de APIs externas de forma segura.
- **Validación Estricta (Zod)**: Todas las llamadas a `generateStructured` ahora requieren esquemas de validación rigurosos de `z.ZodType`, protegiendo la base de datos de JSON malformados.
- **Backup de Bases de Datos en Caliente**: Creado el script `scripts/backup-db.ts` para realizar copias de seguridad consistentes sin apagar el servidor (`npm run db:backup`).

## What Changed: v2.9.3 → v2.9.4

### v2.9.4 — OKF Documentation Migration
- **Migración de Documentación al estándar OKF**: Migrados recursivamente 120 archivos de documentación y configuración en formato Markdown (`.md`) al estándar Open Knowledge Format, inyectando un bloque de metadatos YAML frontmatter al inicio con la propiedad `type` asignada según la estructura de directorios del proyecto.

## What Changed: v2.9.2 → v2.9.3

### v2.9.3 — God Files Split & Modular Refactoring
- **Separación de Definiciones de Worksheets**: Extraídas las 15 definiciones de worksheets (WS01-WS15) del paquete `@cs/domain` en módulos individuales bajo la carpeta `worksheets/`, manteniendo `worksheets.ts` como entrypoint con retrocompatibilidad.
- **Refactorización de WorksheetsPage**: Extraídos componentes (`ProjectSelector`, `StorageBadge`, `Toast`) y encapsulado el estado y efectos en el custom hook `useWorksheetState.ts`.
- **Refactorización de AgentOrchestratorPage**: Separada la interfaz en subcomponentes modulares (`AgentFilters`, `OrchestrationCanvas` para el SVG, y `AgentDetailsSidebar`), reduciendo drásticamente la complejidad y tamaño de los archivos UI.

## What Changed: v2.9.1 → v2.9.2

### v2.9.2 — PDF Extraction, Cleaning & RAG Ingestion
- **PDF Extraction**: Integrada la dependencia `pdf-parse` en el paquete `@cs/agents` y configurado un flujo de lectura para archivos PDF.
- **Limpieza de Basura (Noise Scrubbing)**: Creado `pdfParser.ts` con heurísticas para limpiar cabeceras/pies de página repetitivos, números de página, caracteres de maquetación y reconstruir párrafos uniendo líneas rotas.
- **Script de Ingesta Automatizada**: Creado `scripts/clean-and-ingest-pdfs.ts` que escanea `data/knowledge/`, limpia los archivos `.pdf` y los guarda como archivos `.txt` limpios, indexándolos directamente en la base de datos SQLite FTS5 de RAG.

## What Changed: v2.8.2 → v2.9.1

### v2.9.1 — Transactional Outbox
- **Transactional Outbox**: Implementación del patrón *In-Process EDA* con *Transactional Outbox* para el `EventHub` usando SQLite (`data/events_outbox.sqlite`).
- **Build & Test Stability**: Corregidos errores de tipos y fallos en la suite de pruebas unitarias causados por el refactor asíncrono del ciclo de vida en la arquitectura EDA.

## What Changed: v2.8.0 → v2.8.1

### v2.8.1 — Harness Engineering
- **OpenAI Compatible Provider**: Añadido soporte para modelos open source sin censura (ej. Llama 3) vía API de OpenAI/vLLM en `llm-provider.ts`.
- **Patrón Semantic Reviewer**: Implementado `harness-reviewer.ts` con verificación a doble pasada (Implementer → Reviewer) para evitar alucinaciones en modelos menos confiables.
- **Guardrails en Prompts**: Inyectados tags `<thinking>` y `<output>` en `llm-validated.ts` para obligar a los modelos a razonar antes de emitir JSON, previniendo el colapso de formato.

## What Changed: v2.7.2 → v2.8.0

### v2.8.0 — Knowledge & Lambda Intelligence
- **RAG Pipeline Real**: Mock `vectorStore.ts` reemplazado con SQLite FTS5 (BM25 search, batch indexing, dedup, source tracking).
- **Document Parser Real**: Lee archivos .txt/.md del catálogo Wharton, chunking, detección de secciones y keywords.
- **Knowledge API**: 6 endpoints REST para ingesta, búsqueda, reindexación y archivos custom.
- **Synthetic Consultant Mejorado**: Ahora usa búsqueda real con citaciones de fuente y scoring de confianza.
- **Lambda Benchmark Scripts**: Extracción de prompts V3, ejecución vLLM en GPU, evaluación vs Gemini.
- **Training Data Generator**: Generación de pares instrucción-respuesta para fine-tuning con QLoRA.

## What Changed: v2.7.1 → v2.7.2

### v2.7.0 — Agentic Intelligence & Multiplayer (Wave 11)
- **Market Intel**: Agents now utilize Google Search to analyze the external environment dynamically.
- **Kanban Board**: Full 4-state Proposal tracking UI with an added `in-progress` lifecycle stage.
- **Multiplayer**: Live state synchronization via `Server-Sent Events` when any project state mutates.
- **Agentic Copilot**: Cerebro now utilizes Gemini Function Calling to execute tasks (e.g. moving cards) on behalf of the user via chat.

## What Changed: v2.5.0 → v2.6.0

### v2.6.0 — Autonomous Execution & V3 Connection (Wave 10)
- **Gemini Live**: Pipeline V3 Orchestrator now uses real Gemini LLM calls instead of static mocks.
- **Autonomous Executor**: The execution agent now runs `pnpm typecheck`, captures the diff, and automatically executes `git push` to a remote branch for PR creation.
- **V3 UI Data Binding**: Pages (`/proposals`, `/reports`) now read real proposals and findings from the V3 `state.json` instead of hardcoded mock data.
- **Test Integrity**: Vitest aliases correctly restored and pathing updated to `vitest run`.

### v2.5.0 — Handoff & Auto-Generation (Wave 9)
- **Executive Briefing PDF**: Native high-fidelity `@media print` CSS for 1-click boardroom reports.
- **Swarm Comparator**: Side-by-side visual analysis of findings across two different projects.
- **Prompt Packet Auto-Gen**: Handoff phase now writes `prompt.md`, `strategy.md`, and `manifest.json` directly to disk, fully connected to the UI.

### v2.4.0 — Telemetry & Concurrency (Wave 8)
- **Real-Time Telemetry**: Global SSE event bus (`/api/telemetry/stream`) powering a live dashboard ticker.
- **Shared Findings Store**: In-memory findings bus allowing the Swarm to inform the Strategist live.
- **Autonomous Scheduler**: Concurrency-aware throttling (limit=2) for parallel multi-project execution.


### v2.3.2 — Super Audit Remediation (Wave 6)
- **Security Patch**: Upgraded `electron` and `electron-builder` to close 26 CVEs.
- **Architecture Fix**: Resolved `packages/agents` circular dependency via standalone `state-types.ts`.
- **Test Integrity**: Migrated all 8 failing test suites to `vitest`, achieving 100% pass rate (88 tests).
- **Performance**: Implemented `React.lazy()` code-splitting in the web app router.
- **Fase Actual:** Launch Readiness (Tests Passed)
- **Bloqueantes:** Ninguno para desarrollo/local (Empaquetado desktop requiere Developer Mode en Windows).

### v2.2.0 — Hierarchical Agent Swarm (previous)
- **8 new agents**: Strategist Supervisor, 3 Crew Leads, Temporal Analyst, Validation Agent, Anomaly Detector, Causal Mapper
- **Type system**: `AgentTier`, `CrewId`, `canDelegate`, `runsAutonomously` added to AgentDefinition
- **Registry**: `getAgentsByTier()`, `getAgentsByCrew()` lookup helpers
- **Orchestrator UI**: Complete rewrite — 3-tier hierarchy view, crew filters, sticky detail panel
- **Scientific foundations**: Z-score trend detection, Jaccard similarity, Pearl DAG (causal SAC), constraint satisfaction

### v2.1.0 — Platform Elevation
- **CoachPanel**: 18 proactive alerts (critical/warning/opportunity) on HomePage
- **Portfolio Matrix** `/matrix`: 2×2 WTP×SCI plot with Wharton quadrants
- **Executive Briefing** `/briefing`: Portfolio ranking + clipboard export for Antigravity
- **mockData v2.0.0**: All scores recalibrated with production evidence (BALAM SAC 66→76)

### v2.0.1 — Agent Orchestrator
- **Agent Orchestrator** `/agents`: n8n-style pipeline visualization (now upgraded to 3-tier)

## Agent Registry — 20 Total (3-Tier Swarm)

### Level 0: Supervisor
| Agent | Purpose |
|---|---|
| strategist-supervisor | HTN planning, contradiction resolution, portfolio synthesis |

### Level 1: Crew Leads
| Agent | Crew | Purpose |
|---|---|---|
| recon-lead | recon | Cache invalidation, data quality gate |
| analysis-lead | analysis | Dependency-aware scheduling, cross-agent communication |
| action-lead | action | Publication gate, cost budget enforcement |

### Level 2: Specialists (16)
| Agent | Crew | Phase | New? |
|---|---|---|---|
| portfolio-scanner | recon | Sense | |
| competitive-intel-agent | recon | Sense | |
| worksheet-synthesizer | analysis | Analyze | |
| connected-strategy-analyst | analysis | Analyze | |
| competitive-advantage-analyst | analysis | Analyze | |
| business-model-analyst | analysis | Analyze | |
| data-science-opportunity-analyst | analysis | Analyze | |
| architecture-improvement-analyst | analysis | Analyze | |
| ai-frontier-analyst | analysis | Analyze | |
| causal-mapper | analysis | Analyze | ✅ |
| frontier-mapper-agent | analysis | Analyze | |
| temporal-analyst | cross-cutting | Analyze | ✅ |
| anomaly-detector | cross-cutting | Analyze | ✅ |
| proposal-composer | action | React | |
| validation-agent | action | React | ✅ |
| cost-estimator-agent | action | React | |

## Pages — 27 Total

| Page | Route | Status |
|---|---|---|
| HomePage (+ CoachPanel) | / | ✅ |
| HealthDashboardPage | /health | ✅ |
| PortfolioPage | /portfolio | ✅ |
| ProjectDetailPage | /project/:id | ✅ |
| WorksheetsPage | /worksheets | ✅ |
| CompetitivePage | /competitive | ✅ |
| BusinessModelPage | /business-model | ✅ |
| DataSciencePage | /data-science | ✅ |
| ArchitecturePage | /architecture | ✅ |
| AIFrontierPage | /ai-frontier | ✅ |
| ProposalsPage | /proposals | ✅ |
| PromptPacketsPage | /prompts | ✅ |
| ReportsPage | /reports | ✅ |
| LauncherPage | /launcher | ✅ |
| EfficiencyFrontierPage | /frontier | ✅ |
| StrategyMatrixPage | /strategy-matrix | ✅ |
| ActivityMapPage | /activity-map | ✅ |
| FiveForcesPage | /five-forces | ✅ |
| CustomerJourneyPage | /customer-journey | ✅ |
| STARMatrixPage | /star-matrix | ✅ |
| FlywheelPage | /flywheel | ✅ |
| ValueChainPage | /value-chain | ✅ |
| **AgentOrchestratorPage** | /agents | ✅ v2.2 rewrite |
| **PortfolioMatrixPage** | /matrix | ✅ NEW v2.1 |
| **BriefingPage** | /briefing | ✅ NEW v2.1 |

## Sidebar Sections

| Section | Items |
|---|---|
| Inicio | Inicio, Salud |
| Proyectos | Portfolio, Launcher |
| Análisis | Worksheets, Ventaja Competitiva, Business Model, Data Science, Arquitectura, AI Frontier |
| Inteligencia | Matriz de Portfolio, Briefing Ejecutivo |
| Acción | Agentes, Proposals, Prompt Packets, Reportes |
| Estrategia Wharton | Frontera de Eficiencia, STAR Matrix, Activity Map, 5 Fuerzas, Customer Journey, Flywheel, Cadena de Valor |

## URLs

- UI: http://127.0.0.1:4310
- API: http://127.0.0.1:4311
- Health: http://127.0.0.1:4310/health
