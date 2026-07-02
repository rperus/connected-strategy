---
type: scratch
---
# Reporte de Deuda Técnica Quirúrgica (Fase 2)

## 1. Archivos Huérfanos Refinados (67 encontrados)
Estos son archivos en `apps/` o `packages/` que no tienen relaciones externas entrantes (nadie los importa, llama o referencia).

| Archivo | Cantidad de Nodos Internos |
| --- | --- |
| `apps/server/src/db/migrate_tenants.ts` | 4 |
| `apps/server/src/db/repositories/packets.ts` | 6 |
| `apps/server/src/db/repositories/pipeline-runs.ts` | 4 |
| `apps/server/src/index.ts` | 8 |
| `apps/server/src/modules/pipeline/comparator-worker.ts` | 1 |
| `apps/web/src/pages/AIFrontierPage.tsx` | 5 |
| `apps/web/src/pages/ActivityMapPage.tsx` | 8 |
| `apps/web/src/pages/AgentOrchestratorPage.tsx` | 2 |
| `apps/web/src/pages/ArchitecturePage.tsx` | 3 |
| `apps/web/src/pages/BriefingPage.tsx` | 4 |
| `apps/web/src/pages/BusinessModelPage.tsx` | 3 |
| `apps/web/src/pages/CausalDagPage.tsx` | 3 |
| `apps/web/src/pages/CompetitivePage.tsx` | 3 |
| `apps/web/src/pages/CustomerJourneyPage.tsx` | 7 |
| `apps/web/src/pages/DataSciencePage.tsx` | 3 |
| `apps/web/src/pages/EfficiencyFrontierPage.tsx` | 7 |
| `apps/web/src/pages/FiveForcesPage.tsx` | 7 |
| `apps/web/src/pages/FlywheelPage.tsx` | 6 |
| `apps/web/src/pages/HealthDashboardPage.tsx` | 9 |
| `apps/web/src/pages/HomePage.tsx` | 7 |
| `apps/web/src/pages/LauncherPage.tsx` | 7 |
| `apps/web/src/pages/PlatformIntelPage.tsx` | 6 |
| `apps/web/src/pages/PortfolioMatrixPage.tsx` | 5 |
| `apps/web/src/pages/PortfolioPage.tsx` | 5 |
| `apps/web/src/pages/ProjectDetailPage.tsx` | 5 |
| `apps/web/src/pages/PromptPacketsPage.tsx` | 5 |
| `apps/web/src/pages/ProposalsPage.tsx` | 2 |
| `apps/web/src/pages/QuickStartPage.tsx` | 2 |
| `apps/web/src/pages/ReportsPage.tsx` | 3 |
| `apps/web/src/pages/STARMatrixPage.tsx` | 7 |
| `apps/web/src/pages/SettingsPage.tsx` | 2 |
| `apps/web/src/pages/StrategicImprovePage.tsx` | 6 |
| `apps/web/src/pages/StrategyMatrixPage.tsx` | 7 |
| `apps/web/src/pages/SwarmComparatorPage.tsx` | 2 |
| `apps/web/src/pages/ValueChainPage.tsx` | 6 |
| `apps/web/src/pages/WorksheetsPage.tsx` | 14 |
| `apps/web/src/pages/v3/V3Dashboard.tsx` | 2 |
| `apps/web/src/pages/v3/V3Moves.tsx` | 2 |
| `apps/web/src/vite-env.d.ts` | 1 |
| `packages/agents/src/agents/action-lead.ts` | 5 |
| `packages/agents/src/agents/ai-frontier-analyst.ts` | 6 |
| `packages/agents/src/agents/analysis-lead.ts` | 5 |
| `packages/agents/src/agents/anomaly-detector.ts` | 8 |
| `packages/agents/src/agents/architecture-improvement-analyst.ts` | 7 |
| `packages/agents/src/agents/autonomous-executor.ts` | 4 |
| `packages/agents/src/agents/business-model-analyst.ts` | 5 |
| `packages/agents/src/agents/competitive-advantage-analyst.ts` | 5 |
| `packages/agents/src/agents/competitive-intel-agent.ts` | 6 |
| `packages/agents/src/agents/connected-strategy-analyst.ts` | 6 |
| `packages/agents/src/agents/cost-estimator-agent.ts` | 7 |
| `packages/agents/src/agents/data-science-opportunity-analyst.ts` | 5 |
| `packages/agents/src/agents/frontier-mapper-agent.ts` | 6 |
| `packages/agents/src/agents/portfolio-scanner.ts` | 7 |
| `packages/agents/src/agents/proposal-composer.ts` | 6 |
| `packages/agents/src/agents/recon-lead.ts` | 4 |
| `packages/agents/src/agents/strategist-supervisor.ts` | 6 |
| `packages/agents/src/agents/temporal-analyst.ts` | 5 |
| `packages/agents/src/agents/validation-agent.ts` | 6 |
| `packages/agents/src/agents/worksheet-synthesizer.ts` | 11 |
| `packages/agents/src/index.ts` | 1 |
| `packages/agents/src/rag/index.ts` | 1 |
| `packages/agents/src/v3/cleanup.ts` | 3 |
| `packages/agents/src/v3/harness-reviewer.ts` | 3 |
| `packages/domain/src/index.ts` | 1 |
| `packages/prompt-packets/src/index.ts` | 13 |
| `packages/reporting/src/index.ts` | 2 |
| `packages/runtime/src/index.ts` | 1 |

## 2. Nodos de Código Huérfanos (221 encontrados)
Estos son elementos exportados (funciones, clases, variables) dentro de archivos activos, pero que nunca son llamados ni referenciados desde el exterior del archivo.

| Elemento | Archivo | ID en el Grafo |
| --- | --- | --- |
| `getDb()` | `apps/server/src/db/index.ts` | `apps_server_src_db_index_ts_db_index_getdb` |
| `migrate()` | `apps/server/src/db/index.ts` | `db_index_migrate` |
| `JobRow` | `apps/server/src/db/repositories/jobs.ts` | `repositories_jobs_jobrow` |
| `getJobDb()` | `apps/server/src/db/repositories/jobs.ts` | `repositories_jobs_getjobdb` |
| `getJobStatsDb()` | `apps/server/src/db/repositories/jobs.ts` | `repositories_jobs_getjobstatsdb` |
| `listJobsDb()` | `apps/server/src/db/repositories/jobs.ts` | `repositories_jobs_listjobsdb` |
| `rowToJob()` | `apps/server/src/db/repositories/jobs.ts` | `repositories_jobs_rowtojob` |
| `ProjectRow` | `apps/server/src/db/repositories/projects.ts` | `repositories_projects_projectrow` |
| `rowToProject()` | `apps/server/src/db/repositories/projects.ts` | `repositories_projects_rowtoproject` |
| `V3Run` | `apps/server/src/db/repositories/v3-runs.ts` | `repositories_v3_runs_v3run` |
| `AnswerRow` | `apps/server/src/db/repositories/worksheets.ts` | `repositories_worksheets_answerrow` |
| `rowToAnswer()` | `apps/server/src/db/repositories/worksheets.ts` | `repositories_worksheets_rowtoanswer` |
| `.constructor()` | `apps/server/src/middleware/error-handler.ts` | `middleware_error_handler_apperror_constructor` |
| `router` | `apps/server/src/modules/copilot/routes.ts` | `copilot_routes_router` |
| `store` | `apps/server/src/modules/copilot/routes.ts` | `copilot_routes_store` |
| `ProjectHealth` | `apps/server/src/modules/health/routes.ts` | `health_routes_projecthealth` |
| `getMetricScores()` | `apps/server/src/modules/health/routes.ts` | `health_routes_getmetricscores` |
| `router` | `apps/server/src/modules/health/routes.ts` | `health_routes_router` |
| `sacToGrade()` | `apps/server/src/modules/health/routes.ts` | `health_routes_sactograde` |
| `router` | `apps/server/src/modules/knowledge/routes.ts` | `knowledge_routes_router` |
| `mergeAnswers()` | `apps/server/src/modules/metrics/routes.ts` | `metrics_routes_mergeanswers` |
| `router` | `apps/server/src/modules/metrics/routes.ts` | `metrics_routes_router` |
| `ContextSchema` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_contextschema` |
| `ProposalStatusSchema` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_proposalstatusschema` |
| `RunFullSchema` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_runfullschema` |
| `pipelineEvents` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_pipelineevents` |
| `readJsonl()` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_readjsonl` |
| `router` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_router` |
| `safeProjectDataPath()` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_safeprojectdatapath` |
| `store` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes_store` |
| `router` | `apps/server/src/modules/projects/routes.ts` | `projects_routes_router` |
| `scanEntryToProject()` | `apps/server/src/modules/projects/routes.ts` | `projects_routes_scanentrytoproject` |
| `router` | `apps/server/src/modules/reports/routes.ts` | `reports_routes_router` |
| `router` | `apps/server/src/modules/runtime/routes.ts` | `runtime_routes_router` |
| `router` | `apps/server/src/modules/settings/routes.ts` | `settings_routes_router` |
| `router` | `apps/server/src/modules/telemetry/routes.ts` | `telemetry_routes_router` |
| `router` | `apps/server/src/modules/worksheets/routes.ts` | `worksheets_routes_router` |
| `pipelineEvents` | `apps/server/src/scheduler.ts` | `src_scheduler_pipelineevents` |
| `runProjectAutonomously()` | `apps/server/src/scheduler.ts` | `src_scheduler_runprojectautonomously` |
| `store` | `apps/server/src/scheduler.ts` | `src_scheduler_store` |
| ... y 181 más | | |

## 3. Duplicados Lógicos / Clones en la Misma Comunidad (1645 encontrados)
Nodos dentro de la misma comunidad con firmas de conexión casi idénticas (Jaccard > 0.85). Indica lógica duplicada o fuertemente redundante.

| Nodo 1 | Archivo 1 | Nodo 2 | Archivo 2 | Similitud Jaccard | Comunidad |
| --- | --- | --- | --- | --- | --- |
| `PortEntry` | `packages/runtime/src/port-config.ts` | `ActivePortsFile` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `PortEntry` | `packages/runtime/src/port-config.ts` | `ports` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `PortEntry` | `packages/runtime/src/port-config.ts` | `getPortRegistryPath()` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `ActivePortsFile` | `packages/runtime/src/port-config.ts` | `ports` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `ActivePortsFile` | `packages/runtime/src/port-config.ts` | `getPortRegistryPath()` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `readActivePorts()` | `packages/runtime/src/port-config.ts` | `readPortRegistry()` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `ports` | `packages/runtime/src/port-config.ts` | `getPortRegistryPath()` | `packages/runtime/src/port-config.ts` | 1.00 | 1 |
| `writeServicePort()` | `packages/runtime/src/port-writer.ts` | `writeProjectPort()` | `packages/runtime/src/port-writer.ts` | 1.00 | 1 |
| `checkHealth()` | `packages/runtime/src/session-manager.ts` | `createSession()` | `packages/runtime/src/session-manager.ts` | 1.00 | 1 |
| `checkHealth()` | `packages/runtime/src/session-manager.ts` | `recordHealthCheck()` | `packages/runtime/src/session-manager.ts` | 1.00 | 1 |
| `checkHealth()` | `packages/runtime/src/session-manager.ts` | `getSession()` | `packages/runtime/src/session-manager.ts` | 1.00 | 1 |
| `createSession()` | `packages/runtime/src/session-manager.ts` | `recordHealthCheck()` | `packages/runtime/src/session-manager.ts` | 1.00 | 1 |
| `createSession()` | `packages/runtime/src/session-manager.ts` | `getSession()` | `packages/runtime/src/session-manager.ts` | 1.00 | 1 |
| `recordHealthCheck()` | `packages/runtime/src/session-manager.ts` | `getSession()` | `packages/runtime/src/session-manager.ts` | 1.00 | 1 |
| `getTool()` | `packages/runtime/src/tool-registry.ts` | `deregisterTool()` | `packages/runtime/src/tool-registry.ts` | 1.00 | 1 |
| `getTool()` | `packages/runtime/src/tool-registry.ts` | `resetToolRegistry()` | `packages/runtime/src/tool-registry.ts` | 1.00 | 1 |
| `listToolsByKind()` | `packages/runtime/src/tool-registry.ts` | `getLaunchTools()` | `packages/runtime/src/tool-registry.ts` | 1.00 | 1 |
| `deregisterTool()` | `packages/runtime/src/tool-registry.ts` | `resetToolRegistry()` | `packages/runtime/src/tool-registry.ts` | 1.00 | 1 |
| `SessionStatus` | `packages/runtime/src/types.ts` | `RuntimeSession` | `packages/runtime/src/types.ts` | 1.00 | 1 |
| `SessionStatus` | `packages/runtime/src/types.ts` | `ServiceStatus` | `packages/runtime/src/types.ts` | 1.00 | 1 |
| `SessionStatus` | `packages/runtime/src/types.ts` | `HealthCheckResult` | `packages/runtime/src/types.ts` | 1.00 | 1 |
| `RuntimeSession` | `packages/runtime/src/types.ts` | `ServiceStatus` | `packages/runtime/src/types.ts` | 1.00 | 1 |
| `RuntimeSession` | `packages/runtime/src/types.ts` | `HealthCheckResult` | `packages/runtime/src/types.ts` | 1.00 | 1 |
| `ServiceStatus` | `packages/runtime/src/types.ts` | `HealthCheckResult` | `packages/runtime/src/types.ts` | 1.00 | 1 |
| `cleanOrphanWorksheetAnswers()` | `apps/server/src/db/maintenance.ts` | `cleanDuplicateProjects()` | `apps/server/src/db/maintenance.ts` | 1.00 | 19 |
| `cleanOrphanWorksheetAnswers()` | `apps/server/src/db/maintenance.ts` | `cleanOldTelemetryEvents()` | `apps/server/src/db/maintenance.ts` | 1.00 | 19 |
| `cleanDuplicateProjects()` | `apps/server/src/db/maintenance.ts` | `cleanOldTelemetryEvents()` | `apps/server/src/db/maintenance.ts` | 1.00 | 19 |
| `insertJob()` | `apps/server/src/db/repositories/jobs.ts` | `updateJob()` | `apps/server/src/db/repositories/jobs.ts` | 1.00 | 66 |
| `upsertProject()` | `apps/server/src/db/repositories/projects.ts` | `deleteProject()` | `apps/server/src/db/repositories/projects.ts` | 1.00 | 43 |
| `upsertProject()` | `apps/server/src/db/repositories/projects.ts` | `countProjects()` | `apps/server/src/db/repositories/projects.ts` | 1.00 | 43 |
| `deleteProject()` | `apps/server/src/db/repositories/projects.ts` | `countProjects()` | `apps/server/src/db/repositories/projects.ts` | 1.00 | 43 |
| `insertRun()` | `apps/server/src/db/repositories/v3-runs.ts` | `updateRunStatus()` | `apps/server/src/db/repositories/v3-runs.ts` | 1.00 | 24 |
| `upsertAnswer()` | `apps/server/src/db/repositories/worksheets.ts` | `deleteAnswer()` | `apps/server/src/db/repositories/worksheets.ts` | 1.00 | 29 |
| `telemetryBus` | `apps/server/src/services/telemetry.ts` | `getTelemetryStats()` | `apps/server/src/services/telemetry.ts` | 1.00 | 76 |
| `startScheduler()` | `apps/server/src/scheduler.ts` | `stopScheduler()` | `apps/server/src/scheduler.ts` | 1.00 | 56 |
| `Tier` | `apps/web/src/config/agents.ts` | `Crew` | `apps/web/src/config/agents.ts` | 1.00 | 51 |
| `Tier` | `apps/web/src/config/agents.ts` | `Phase` | `apps/web/src/config/agents.ts` | 1.00 | 51 |
| `Tier` | `apps/web/src/config/agents.ts` | `AgentNode` | `apps/web/src/config/agents.ts` | 1.00 | 51 |
| `Tier` | `apps/web/src/config/agents.ts` | `TIER_COLORS` | `apps/web/src/config/agents.ts` | 1.00 | 51 |
| `Tier` | `apps/web/src/config/agents.ts` | `TIER_LABELS` | `apps/web/src/config/agents.ts` | 1.00 | 51 |
| ... y 1605 más | | | | | |