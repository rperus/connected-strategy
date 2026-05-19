# Current State

> Date: 2026-05-11
> Status: operational
> Version: 2.3.2 "Super Audit Remediation"
> Coordinator: Cerebro

## Platform Status — v2.3.2

| Check | Result |
|---|---|
| Security | ✅ 0 High/Moderate CVEs (Electron ^39) |
| Architecture | ✅ 0 Circular Dependencies |
| Web Bundle | ✅ Code-split (240kB initial) |
|---|---|
| pnpm --filter @cs/domain typecheck | ✅ 0 errors |
| pnpm --filter @cs/agents typecheck | ✅ 0 errors |
| pnpm --filter @cs/web typecheck | ✅ 0 errors |
| Worksheets | ✅ 15 worksheets (WS01-WS15) |
| Agents | ✅ 20 agents registered (3-tier swarm) |
| Interactive Pages | ✅ 27 pages |
| Agent Tiers | ✅ Supervisor (1) · Crew Leads (3) · Specialists (16) |
| Crews | ✅ Recon · Analysis · Action · Cross-cutting |

## What Changed: v2.0.0 → v2.3.2

### v2.3.2 — Super Audit Remediation (Wave 6)
- **Security Patch**: Upgraded `electron` and `electron-builder` to close 26 CVEs.
- **Architecture Fix**: Resolved `packages/agents` circular dependency via standalone `state-types.ts`.
- **Test Integrity**: Migrated all 8 failing test suites to `vitest`, achieving 100% pass rate (88 tests).
- **Performance**: Implemented `React.lazy()` code-splitting in the web app router.
- **Fixture Rigor**: Replaced static mock data with the real Sun King case study dataset.

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
