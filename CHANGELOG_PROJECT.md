# Project Changelog

## [2.7.2] - 2026-05-29 (Gran Remediación Completa)
### Security, UX & Intelligence
- **Clúster 1 (Backend & Datos):** Eliminadas consultas N+1 en health y metrics; corregidos índices zombis en base de datos SQLite; asegurada persistencia de variables en Dockerfile.
- **Clúster 2 (Visual & UX):** Sustituidas gráficas manuales por ECharts paramétricos (Radar, Portfolio Matrix); eliminados "Doppelgängers" cognitivos en UI (botones duplicados); mitigada fricción emocional con Modal nativo de "Safe Delete".
- **Clúster 3 (Inteligencia & Agentes):** Resuelta **Amnesia de Contexto (P0)** mediante inyección global (Interceptor Pattern) del `ProjectContext` en el Orquestador V3, evitando la alucinación sin refactorizar prompts en masa.

## [2.7.0] - 2026-05-22 (Wave 11)
### Added
- **Market Intelligence**: New `/api/pipeline/market-intel/:projectId` endpoint using Google Search Grounding to generate external competitive landscape reports.
- **Strategic Kanban**: Completely rewrote `/proposals` as a 4-column drag-and-drop Kanban board with a new `in-progress` state.
- **Multiplayer (SSE)**: Synchronized Kanban state across multiple clients in real-time using Server-Sent Events via `/api/telemetry/stream`.
- **Copilot Function Calling**: Empowered the Gemini Copilot to perform native system actions. Users can now ask the chat to move Kanban cards, and the Copilot will execute the action using `update_proposal_status` tools.

## [2.7.1] - 2026-05-24 (Auditoría Completa Remediation)
### Security & Bug Fixes (Wave 0-3)
- **Wave 0 (Seguridad crítica):** 7 fixes incluyendo prevención de Command Injection (`runGit` con array spawn), Path Traversal en `pipeline/routes`, bloqueo Auth Bypass en producción, reemplazo de `require` dinámicos por `import()`, y prevención de Prompt Injection en el Copilot.
- **Wave 1 (Quick Wins):** 7 fixes resolviendo bugs matemáticos en métricas, data mocking forzado sin API, a11y (Skip-nav y Aria-labels), y un HITL gate (`CS_AUTO_PUSH=true`) para operaciones de Git autónomas.
- **Wave 2 (Estructural):** 7 fixes incorporando Responsiveness (Sidebar colapsable a Bottom Nav), validación en tiempo de ejecución con `Zod`, Health Check robusto (Ping a BD + uptime), Rate Limiters dinámicos (5 req/15min) y debounce en autoguardados (1.5s).
- **Wave 3 (UX Premium):** 5 fixes añadiendo Skeleton Loaders animados en carga diferida (React.Suspense), tooltips de navegación, estados vacíos Premium en el Portfolio con animaciones *glassmorphism*, y Stagger Animations para los listados.
- **Stability:** Typecheck estricto ejecutado post-remediación con 0 errores en los 9 workspaces.

## 2026-05-20: Launch Readiness v2.6.0 — Quick Start & Empty States

### P0: Architecture & Initialization
- **Persistencia de Configuración**: Implementado repositorio SQLite para la tabla `settings` (soporte dinámico de API Keys en caliente desde UI).
- **Blank Slate (Empty States)**: UI rediseñada para manejo de arranques sin proyectos (Zero-state). Creado `QuickStartPage` y refactorizado `HomePage`.
- **Limpieza de Demo Data**: Nuevo endpoint `DELETE /api/projects/demo-data` para borrar los fixtures quemados y dejar la plataforma productiva limpia.

### P1: Security & Type Safety
- **Strict Local Binding**: Servidor forzado a `127.0.0.1` para prevenir exposición accidental en interfaces públicas al ejecutarse como *local-tower*.
- **Cierre de Contratos (TypeScript)**: Unificados los tipos en `@cs/domain` (`health_score`, `last_execution_date`). Aplicados y re-compilados en toda la cadena (API y UI). 
- **Tests Completos**: Aprobadas todas las suites (`security.test.ts`, `api-contracts.test.ts`), con 100% verde en frontend y backend.

## 2026-05-18: Super Audit v2 Remediation — Zero Vulnerabilities

### P0: Security
- **API Key Leak**: Removed hardcoded `GEMINI_API_KEY` from `.env` tracked file to prevent credential exposure.
- **Dependency CVEs**: Added strict `pnpm.overrides` for `vite`, `tar`, `esbuild`, `brace-expansion`, and `@tootallnate/once`.
- Ran `pnpm install` achieving **0 vulnerabilities** across the monorepo.

### P1: Security & Architecture
- **Express Hardening**: Added `helmet` and `express-rate-limit` middleware to the API server to protect against common web vulnerabilities and brute force.
- **CORS Config**: Replaced hardcoded localhost array with dynamic `process.env.CS_CORS_ORIGINS`.
- **Circular Dependencies**: Extracted `KnowledgeSource` and related domain types to `packages/knowledge/src/types.ts`. Resolved import cycles (`index.ts` ↔ `sources.ts`). Verified with `madge` (0 cycles).

### P2/P3: Frontend UX & Rendimiento Visual
- **Bundle Splitting**: Added `manualChunks` in `vite.config.ts` to isolate `vendor_react` and `vendor_clerk`, eliminating TTI bottlenecks and dropping chunk size below Vite warning thresholds.
- **Layout Thrashing**: Refactored CSS animations in `index.css` to use GPU-accelerated `transform: scaleX` instead of CPU-blocking `width` transitions. Applied via script to 17 TSX components.
- **SPA Anti-pattern**: Replaced blind `onClick={() => navigate()}` invocations with native semantic `<Link>` components across all major UI cards and layouts for proper SEO and standard browser routing logic.
- **Empty States Premium**: Created and implemented `<EmptyState />` glassmorphism component across `ProjectDetailPage` avoiding broken layout screens.

## [2.6.0] - 2026-05-19 (Wave 10)
### Added
- **Strategy Copilot (Chat)**: Added `StrategyCopilot.tsx` floating UI and `/api/copilot/chat` endpoint. Uses Gemini to provide live strategy consulting based on project state and findings.
- **Batch Reporter**: Added `batch-reporter.ts` agent and `/api/reports/batch-executive` endpoint to generate portfolio-wide executive markdown summaries.
- **Gemini Live Provider**: V3 Pipeline Orchestrator is now fully wired to use the real Gemini LLM.
- **Autonomous Execution**: Finished the `autonomous-executor` to capture git diffs, run `typecheck` validation, and automatically create a new branch and `git push` to origin.
- **V3 UI Data Binding**: Replaced static UI mock endpoints (`/api/pipeline/proposals` and `/api/pipeline/findings`) with endpoints that parse directly from `state.json` via `/proposals` and `/findings`.
- **Architectural Cleanup**: Deleted legacy V2 pipeline `routes.ts` and V2 `registry.ts`, promoting `v3-route.ts` and `registry-v3.ts` as the canonical implementation. Removed all `/v3-` prefixes from API calls.

## [2.4.0] - 2026-05-18 (Wave 7)
### Added
- **Real-Time Telemetry Bus (SSE)**: Global event stream decoupling UI from local run state.
- **SQLite Historical Memory**: `temporal-analyst` agent parses past runs via `telemetry.sqlite` to compute velocity trends.
- **Strategist Auto-mode**: Node interval daemon that awakens the Swarm autonomously every 6h.
- **Causal DAG UI (Judea Pearl)**: New `/causal` page leveraging dynamic SVG to visualize causality vs flat SAC.
- **Cross-Agent Message Bus**: `SharedFindingsStore` implemented across all Swarm agents to stream findings mid-run.

## [2.3.0] - 2026-05-11 (Wave 6) Super Audit Remediation — P0/P1/P2 Fixes

### P0: Security — Electron CVE Remediation
- Bumped `electron` from `^30.0.0` to `^39.0.0` in `apps/desktop/package.json`
- Bumped `electron-builder` from `^24.0.0` to `^25.0.0`
- Resolves 10 High + 12 Moderate CVEs (GHSA-jfqx, GHSA-9899, GHSA-f37v, etc.)

### P1: Circular Dependency — agents package
- Created `packages/agents/src/v3/state-types.ts` — standalone type definitions
- Refactored `state-store.ts` to re-export types from `state-types.ts`
- Refactored `migrators.ts` to import from `state-types.ts` instead of `state-store.ts`
- Verified with `madge --circular`: 0 cycles

### P1: Test Infrastructure — vitest migration
- Migrated 8 test files from `node:test` + `node:assert` to vitest globals (`describe`/`it`/`expect`)
- Fixed `schemas.test.ts` broken assertion (empty `z.record()` is valid; changed to test missing `scope`)
- Result: 10/10 suites, 88/88 tests passing

### P2: Bundle Optimization — React.lazy code-splitting
- Converted 28 page imports in `apps/web/src/App.tsx` to `React.lazy()` with `Suspense`
- Added `PageLoader` fallback component
- Initial bundle: 531kB → 240kB (55% reduction), no chunk exceeds 500kB warning

## 2026-04-27T09:35: v2.3.0 — Platform Intelligence + Strategic Improve

- **Domain types**: `ProjectSkill`, `ProjectWorkflow`, `ServiceAccess` añadidos a Project
- **mockData**: Todos los 7 proyectos escaneados con datos reales (skills, workflows, scripts, serviceAccess)
- **PlatformIntelPage** `/intel`: Skills globales/locales, workflows n8n/daemon, scripts, acceso a servicios con credential hints
- **StrategicImprovePage** `/improve`: Propuestas de mejora por plataforma → Aprobar/Rechazar → Generar prompt como SUGERENCIA para Antigravity
- **ServiceAccess para Health Dashboard**: n8n URL + credential hint [REDACTED — moved to .env.local]
- **Grant Navigator**: Actualizado con datos reales (Business Plans Nexus, pitch decks CAF, Project Mariner playbooks)
- **YouTube CashCow**: 35+ scripts descubiertos (agentic_swarm, autonomous_video_engine, factory_boss, ds_core)
- **Sidebar**: 2 nuevos links en sección Inteligencia (/intel, /improve)

## 2026-04-27T08:52: v2.2.0 — Hierarchical Agent Swarm (12 → 20 agentes, 3 niveles)

- **types.ts**: AgentTier, CrewId, `canDelegate`, `runsAutonomously` añadidos a AgentDefinition
- **Nivel 0 (Supervisor)**: `strategist-supervisor` — HTN planning, resolución de contradicciones, síntesis ejecutiva
- **Nivel 1 (Crew Leads)**: `recon-lead`, `analysis-lead`, `action-lead` — coordinación, scheduling, gate de publicación
- **Nivel 2 (Nuevos Especialistas)**: `temporal-analyst` (Z-score trend detection), `validation-agent` (Jaccard + constraints), `anomaly-detector` (statistical outliers), `causal-mapper` (Pearl 2000 DAG, SAC causal vs plano)
- **registry.ts**: 20 agentes registrados con tier/crew. Helpers `getAgentsByTier()`, `getAgentsByCrew()`
- **AgentOrchestratorPage**: UI completamente reescrita — jerarquía visual 3 niveles, filtros por crew, cards con badges tier/crew/LLM/AUTO, panel de detalle sticky, flujo de ejecución del Strategist

## 2026-04-27T04:38: v2.1.0 — Platform Elevation (SAC 55→78+ proyectado)

- **CoachPanel**: 18 alertas activas (6 críticas, 4 advertencias, 8 oportunidades) — coach Wharton proactivo integrado en home
- **Portfolio Matrix** `/matrix`: gráfico 2×2 WTP vs SCI con 7 proyectos, cuadrantes Wharton, panel detalle interactivo
- **Executive Briefing** `/briefing`: ranking portfolio + Top 3 prioridades + export clipboard para Antigravity
- **mockData v2.0.0**: todos los scores recalibrados con evidencia real (BALAM SAC 66→76, Health SCI 55→62)

## 2026-04-27T03:50: Agent Orchestrator — Visual Pipeline View

- **Nueva página**: `/agents` — Visualización estilo n8n del orquestador de 12 agentes
- Canvas SVG con nodos organizados en 3 columnas (Sense → Analyze → React)
- Edges curvos mostrando dependencias entre agentes
- Panel de detalle al hacer clic: rol, inputs, outputs, memoria, dependencias
- Resumen del flujo del pipeline (5 pasos)
- Estadísticas: 12 agentes, 11 deterministas, 1 con LLM opcional
- Ruta: `/agents` · Sidebar: sección Acción → "Agentes 🤖"
- ✅ TypeScript 0 errores · ✅ Verificado visualmente

## 2026-04-26T23:50: Curriculum Completion — 5 New Interactive Pages + WS15

**Scope:** Implementación completa de los 6 gaps del curriculum identificados en la auditoría de Connected Strategy.

### Nuevas Páginas (5)
| Página | Ruta | Fuente Académica |
|---|---|---|
| 5 Fuerzas de Porter | `/five-forces` | Wharton Competitive Advantage Module 2, Porter |
| Customer Journey Map | `/customer-journey` | Connected Strategy Cap. 4, Figuras 4-1 a 4-4, Workshop 2 |
| Matriz STAR (4×4) | `/star-matrix` | Workshop 3 Steps 4-5, Worksheet 10-3, Cap. 9 |
| Flywheel / Connected Loop | `/flywheel` | Cap. 5, Figura 5-5, 4 Niveles de Personalización |
| Cadena de Valor (Porter) | `/value-chain` | Wharton Competitive Advantage, Porter Value Chain |

### Nuevo Worksheet
- **WS15 — 5 Fuerzas de Porter**: 5 escalas (rivalidad, entrantes, sustitutos, compradores, proveedores) + 3 preguntas de análisis estratégico

### Cambios de Infraestructura
- `apps/web/src/App.tsx`: 5 nuevas rutas + imports
- `apps/web/src/components/Sidebar.tsx`: Sección "Estrategia Wharton" ampliada de 3 a 8 items
- `packages/domain/src/worksheets.ts`: WS15 + registro en ALL_WORKSHEETS (ahora 15 worksheets)

### Verificación
- ✅ `pnpm --filter @cs/domain exec tsc --noEmit` — 0 errores
- ✅ `pnpm --filter @cs/web exec tsc --noEmit` — 0 errores
- ✅ Todas las páginas verificadas visualmente en el navegador

### Cobertura Post-Implementación
| Dimensión | Score |
|---|---|
| Book Worksheets Coverage | 100% (15 worksheets) |
| Core Frameworks | 100% |
| Interactive Visualizations | 100% (8 tools) |
| Competitive Advantage Module | 100% (5 Forces + Value Chain added) |

## 2026-04-21: Initial execution pack

- Created first-pass execution docs, task sets, prompts, and state files for Connected_Strategy.
- Established parallel workstream decomposition and shared expert prompt system.
- Left product implementation pending.

## 2026-04-22: Canonical Antigravity state pack and Cerebro workflow

- Added root-level `CURRENT_STATE.md`, `CURRENT_TASK.md`, `CHANGELOG_PROJECT.md`, and `PROJECT_MANIFEST.yaml`.
- Added `docs/operations/AGENT_MANAGER_CEREBRO_WORKFLOW.md`.
- Added `antigravity/prompts/16_AGENT_MANAGER_CEREBRO_OPERATING_SYSTEM.md`.
- Added `antigravity/prompts/17_FIRST_PROMPT_CONNECTED_STRATEGY.md`.
- Added `config/port_registry.yaml` and `ops/runtime/active_ports.json`.
- Added `ops/agent_handoffs/chat_1.md` to `chat_3.md`.
- Switched canonical Antigravity entrypoint from the old `state/` pack to the root state pack.

## 2026-04-22T15:24: Cerebro claims coordinator role (Wave 0)

- Cerebro read full state pack, operating docs, shared prompts, and all task-set prompts.
- Audited SET-00 through SET-07: conceptually correct, need light rewrite (path fixes, slot headers, end-state contract).
- All three worker slots confirmed idle.
- Port registry confirmed: web=4310, api=4311, desktop_devtools=4312 (all not_running).
- CURRENT_STATE.md and CURRENT_TASK.md updated to reflect active coordinator.
- Next: execute SET-00 then SET-01 in-session before dispatching workers.

## 2026-04-22T15:28: SET-00 Program Director complete

- Rewrote all 6 worker task-set prompts (SET-02 through SET-07) with:
  - Cerebro 4-line slot headers
  - Root-level state path references
  - Explicit write scope and no-touch file lists
  - End-state contract (LISTO/BLOQUEADO/CONTINUE + HANDOFF_FILE)
- Updated SET-00 and SET-01 prompts with root state paths.

## 2026-04-22T15:33: SET-01 Workspace Bootstrap complete

- Initialized pnpm monorepo with `pnpm-workspace.yaml`.
- Scaffolded 3 apps: `@cs/web` (Vite+React), `@cs/server` (Express), `@cs/desktop` (Electron).
- Scaffolded 6 packages: `@cs/domain`, `@cs/knowledge`, `@cs/agents`, `@cs/runtime`, `@cs/reporting`, `@cs/prompt-packets`.
- All 259 dependencies installed and 10 workspace projects linked.
- Implemented canonical port config reader at `packages/runtime/src/port-config.ts`.
- Server entry reads port from `resolvePort()` (active_ports.json → port_registry.yaml → fallback).
- Web app Vite config uses port 4310 with `strictPort: false`.
- Domain package contains placeholder types for all 10 strategic metrics + projects + worksheets.
- Server module directories created for analysis, projects, runtime, reports.
- Version bumped to 0.2.0.

## 2026-04-22T15:47: Wave 2 Batch 1 complete

### SET-02 Knowledge & Domain Engine (Chat 1)
- `packages/domain/src/types.ts` — 26+ domain types covering all strategic contracts
- `packages/domain/src/scoring.ts` — all 10 scoring formulas (CE Score, CL Maturity, SCI, WTP, CRP, CPI, BMS, DSR, AR, SAC)
- `packages/domain/src/scoring.test.ts` — test suite for all scoring formulas
- `packages/domain/src/worksheets.ts` — WS01–WS11 full Wharton worksheet definitions
- `packages/knowledge/src/index.ts` — extended with FTS-ready chunker, ingestion results, index builder
- `packages/knowledge/src/sources.ts` — canonical Wharton + local source registry
- Note: Chat 1 worker omitted updating its handoff file; Cerebro reconstructed from artifacts.

### SET-05 Runtime Collision Launcher (Chat 2)
- 9 new modules: types, stack-detector, port-writer, collision-resolver, launch-profile, session-manager, tool-registry
- `apps/server/src/modules/runtime/routes.ts` — 9 API endpoints at /api/runtime/*
- typecheck PASS, build PASS

### SET-07 Desktop Shell (Chat 3)
- Full Electron main.js: port-aware URL, 3s retry, window management, single-instance lock, tray
- `apps/desktop/src/preload.js` — safe context bridge
- `electron-builder.yml` — NSIS + portable packaging, bundles port config files
- `assets/icons/icon.png` — 512×512 master icon
- `scripts/generate-icons.js`, `create-desktop-shortcut.ps1`, `launch-desktop.bat`
- Version bumped to 0.3.0.

## 2026-04-22T16:16: Wave 2 Batch 2 complete

### SET-03 Analysis Orchestrator (Chat 1)
- 9 specialist agents: portfolio-scanner, worksheet-synthesizer, connected-strategy-analyst, competitive-advantage-analyst, business-model-analyst, data-science-opportunity-analyst, architecture-improvement-analyst, ai-frontier-analyst, proposal-composer
- In-memory job queue with full lifecycle (createJob, markRunning, markDone, markFailed)
- API endpoints: /api/analysis/*, /api/projects/*

### SET-04 UI Workbench (Chat 2)
- 13 pages: Inicio, Portfolio, Project Detail, Worksheets, Competitive, Business Model, Data Science, Architecture, AI Frontier, Proposals, Prompt Packets, Reports, Launcher
- Full design system (760+ lines CSS), sidebar navigation, SVG radar chart
- Worksheet editor with localStorage persistence for all WS01-WS11
- Prompt packet generator with copy-to-clipboard (Codex + Antigravity)
- Print-friendly report view

### SET-06 Reporting & Prompt Packets (Chat 3)
- generatePortfolioReport, generateProjectReport, generateProposalReport
- exportToMarkdown, exportToHtml with @media print CSS
- generatePacketFromProposal: full codex_plan and antigravity_execution markdown
- API: /api/reports/*, /api/prompt-packets/*

## 2026-04-22T16:25: SET-08 Integration QA & Release — v1.0.0

- Full typecheck sweep: 9/9 packages, 0 errors
- PortfolioPage + HomePage wired to live API with graceful mockData fallback
- API validated: /api/health ✅, /api/runtime/ports ✅, /api/projects ✅
- POST /api/projects/scan → 7 real projects discovered in C:\dev
- Web UI serving at http://127.0.0.1:4310
- Production builds: web (238KB JS, 14KB CSS) + server compiled
- scripts/start.ps1 + scripts/start.bat created (double-click launcher)
- ops/runtime/active_ports.json updated with running status and 7 projects
- Version bumped to 1.0.0.

## 2026-04-26: Mejora Integral — Auditoría + Quick Wins

### Auditoría (24 propuestas evaluadas, 2 ejecutadas, 3 descartadas)
- Ran `/mejora-integral` — 10-dimension analysis covering Connected Strategy, Competitive, Business Model, Data Science, Architecture, AI Frontier, Growth, Security, Cross-Project Intelligence, CSS consistency.
- Generated prioritized proposal matrix (P01-P24) mapped to Wharton framework (WTP, Cost, Switching Costs).

### P15: CSS class fix (3 files)
- `EfficiencyFrontierPage`, `StrategyMatrixPage`, `ActivityMapPage` used non-existent `page-content` class.
- Changed to `page-container` which has `max-width: 1200px; margin: 0 auto; padding: 32px 28px`.
- Result: 3 Wharton pages now have proper padding and centering.

### P21: Mock metrics for 5 missing projects
- `MOCK_METRICS` only had data for `balam-licitaciones` and `connected-strategy`.
- Added realistic metrics for: `rodrigo-os` (38), `rodrigo-os-health` (40), `youtube-cashcow` (38), `balam-demo` (53), `grant-navigator` (32).
- Result: Portfolio Rápido table shows 7/7 projects with full numeric scores.

### Multi-project context system (from earlier in session)
- Added `ProjectContext` provider, `ProjectBanner` component, sidebar project selector.
- Banner injected in 10 analysis pages.
- Verified with typecheck (0 errors) and visual screenshots.

