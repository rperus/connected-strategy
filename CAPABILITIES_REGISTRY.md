---
type: context
---
# Capabilities Registry

Este documento registra todas las capacidades, módulos y frentes estratégicos construidos en el ecosistema **Connected Strategy**. Debe consultarse antes de crear nuevos componentes para evitar duplicidad de funcionalidades, de acuerdo con la regla *Anti-Regression* y *Anti-Duplication*.

## 1. Worksheets y Modelos Estratégicos (Domain)
Ubicación: `packages/domain/src/worksheets/`

| ID | Capacidad | Módulo que lo gestiona |
|---|---|---|
| WS01 | Problema a Resolver & Actores | `customer-journey-mapper` |
| WS02 | Ciclo de Estrategia Conectada | `customer-journey-mapper` |
| WS03 | Costos de Cambio de Fase | `info-flow-analyzer` |
| WS04 | Profundización de Necesidades | `deeper-needs-laddering` |
| WS05 | Opciones de Experiencia | `connected-experience-matrix` |
| WS06 | Escalera de Necesidades | `deeper-needs-laddering` |
| WS07 | Mapeo de Experiencia Conectada | `connected-experience-matrix` |
| WS08 | Diagrama de Dispersión / Frontera | `connected-experience-matrix` |
| WS09 | Capas Arquitectónicas | `tech-stack-mapper` |
| WS10 | Requisitos de Arquitectura | `tech-stack-mapper` |
| WS11 | Tecnologías y Adquisición | `tech-stack-mapper` |
| WS12-WS14 | Modelos de Entrega y Generación de Ingresos | `revenue-model-architect` |
| WS15 | Currículum Interactivo | `activity-system-mapper` / UI |

## 2. Swarm Multi-Agente (Agents)
Ubicación: `packages/agents/src/v3/`

### 2.1 Supervisores y Orquestadores (Nivel 0 y 1)
- **Cerebro (Orquestador Principal):** Gestor del ciclo SAGA y coordinador de waves.
- **Strategist Supervisor (Nivel 0):** Planificación de HTN y síntesis de portafolio.
- **Recon Lead (Nivel 1):** Gestión de calidad de datos de mercado.
- **Analysis Lead (Nivel 1):** Calendario de dependencias analíticas.
- **Action Lead (Nivel 1):** Presupuesto y publicación de findings.

### 2.2 Especialistas Activos (Nivel 2)
1. **portfolio-scanner** (Recon)
2. **competitive-intel-agent** (Recon)
3. **worksheet-synthesizer** (Analysis)
4. **connected-strategy-analyst** (Analysis)
5. **competitive-advantage-analyst** (Analysis)
6. **business-model-analyst** (Analysis)
7. **data-science-opportunity-analyst** (Analysis)
8. **architecture-improvement-analyst** (Analysis)
9. **ai-frontier-analyst** (Analysis)
10. **causal-mapper** (Analysis)
11. **frontier-mapper-agent** (Analysis)
12. **temporal-analyst** (Cross-cutting)
13. **anomaly-detector** (Cross-cutting)
14. **proposal-composer** (Action)
15. **validation-agent** (Action)
16. **cost-estimator-agent** (Action)

## 3. Interfaces de Usuario (Web Apps)
Ubicación: `apps/web/src/pages/`

- **Dashboard y Salud:** `HomePage`, `HealthDashboardPage`.
- **Estrategia y Análisis:** `PortfolioPage`, `ProjectDetailPage`, `WorksheetsPage`, `CompetitivePage`, `BusinessModelPage`, `DataSciencePage`, `ArchitecturePage`, `AIFrontierPage`.
- **Inteligencia y Ejecución:** `PortfolioMatrixPage`, `BriefingPage`, `ProposalsPage`, `PromptPacketsPage`, `ReportsPage`, `LauncherPage`.
- **Frameworks de Negocio:** `EfficiencyFrontierPage`, `StrategyMatrixPage`, `ActivityMapPage`, `FiveForcesPage`, `CustomerJourneyPage`, `STARMatrixPage`, `FlywheelPage`, `ValueChainPage`.
- **Orquestación:** `AgentOrchestratorPage` (Visualizador n8n-style del pipeline).

## 4. Backend y APIs Core
Ubicación: `apps/server/src/`

- **EventHub & Pub/Sub:** Implementación in-process EDA con fallback en SQLite (`data/events_outbox.sqlite`).
- **Knowledge Base (RAG):** Motor FTS5 sobre SQLite que indexa archivos de `data/knowledge/` y da servicio a 6 endpoints bajo `/api/knowledge/*`.
- **Telemetry:** Global SSE event bus para UI (`/api/telemetry/stream`).
- **Server Lifecycle Manager:** Manejo seguro del `closeDb()` en shutdown hooks.

## 5. Herramientas y Mantenimiento Operativo
Ubicación: Raíz y `scripts/`

- **Ingesta Documental:** `clean-and-ingest-pdfs.ts` (pipeline heurístico de limpieza e indexado RAG).
- **Entrenamiento (Lambda):** `scripts/lambda-benchmark/`, `scripts/training-data/` (Generación de pares para QLoRA).
- **Arranque Global:** `start.bat`, `launch-desktop.bat`.

> **NOTA DE USO:** Si vas a crear una nueva vista, tabla, agente o worksheet, verifica primero esta lista. Si encuentras un clon funcional, extiende el existente; **nunca lo dupliques**.
