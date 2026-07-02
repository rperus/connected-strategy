---
type: documentation
title: Auditoria Connected Strategy - Prompts Para Antigravity
description: Auditoria Connected Strategy  Prompts Para Antigravity
timestamp: '2026-06-27T17:40:07Z'
---

# Auditoria Connected Strategy - Prompts Para Antigravity

Fecha: 2026-04-29
Modo: auditoria read-only de codigo, arquitectura y producto
Objetivo: encontrar errores y mejoras para que la plataforma entregue auditorias reales con agentes especialistas y prompts precisos para Antigravity.

## Resumen Ejecutivo

La plataforma compila y los tests pasan, pero todavia hay una brecha importante entre la promesa del producto y la ejecucion real:

- El registro declara 20 agentes, pero el pipeline principal solo ejecuta 6 analistas + proposal-composer.
- Varios agentes leen IDs de worksheet que ya no existen en el dominio actual, por lo que sus hallazgos pueden salir falsos o genericos.
- La pagina de mejoras y la inteligencia de plataformas todavia dependen demasiado de `MOCK_PROJECTS`, `MOCK_METRICS` y propuestas estaticas.
- El generador de prompts del pipeline produce prompts demasiado generales: no incluye hallazgos, propuestas, archivos afectados, criterios ni comandos.
- El endpoint de prompt packets esta montado con una ruta duplicada y la URL del frontend no coincide.
- El launcher usa IDs y campos inconsistentes (`script` vs `launcherScript`, hyphen vs underscore), lo que puede romper el "un click" para proyectos escaneados.
- La memoria temporal no guarda snapshots de metricas por proyecto, asi que `temporal-analyst` no puede hacer analisis historico real.
- El estado/versionado del proyecto esta desalineado entre `CURRENT_STATE.md`, `CURRENT_TASK.md`, `PROJECT_MANIFEST.yaml` y `package.json`.

## Verificacion Corrida

- `pnpm --filter @cs/domain typecheck` - PASS
- `pnpm --filter @cs/agents typecheck` - PASS
- `pnpm --filter @cs/server typecheck` - PASS
- `pnpm --filter @cs/web typecheck` - PASS
- `pnpm test` - PASS fuera del sandbox: 12 tests passed

Nota: `pnpm test` fallo dentro del sandbox con `spawn EPERM` al lanzar esbuild/vitest; al ejecutarlo con permisos aprobados paso correctamente.

## Hallazgos Prioritarios

### P0 - El swarm de 20 agentes no corre realmente en el pipeline

Evidencia:

- `packages/agents/src/registry.ts` registra 20 agentes.
- `apps/server/src/modules/pipeline/routes.ts:153-160` ejecuta solo:
  - `connected-strategy-analyst`
  - `competitive-advantage-analyst`
  - `business-model-analyst`
  - `data-science-opportunity-analyst`
  - `architecture-improvement-analyst`
  - `ai-frontier-analyst`
- `apps/server/src/modules/analysis/routes.ts:200-207` repite el mismo subset.
- `apps/server/src/modules/health/routes.ts:88-95` tambien repite el mismo subset.

Impacto:

La UI puede decir "20 agentes", pero los agentes mas importantes de coordinacion, causalidad, validacion, temporalidad y costos no influyen en las propuestas reales.

### P0 - Agentes leen claves de worksheets inexistentes

Evidencia:

- Agentes leen claves tipo `ws04_q_automation_level`, `ws05_q_proprietary_data`, `ws07_q_modularity`, `ws08_q_instrumentation`.
- El dominio actual define claves canonicas como `ce_automatic_execution`, `dsr_data_availability`, `ar_modularity`, `ws07_agents`, `ws08_adoption_kpis`.
- Archivos afectados:
  - `packages/agents/src/agents/connected-strategy-analyst.ts`
  - `packages/agents/src/agents/competitive-advantage-analyst.ts`
  - `packages/agents/src/agents/business-model-analyst.ts`
  - `packages/agents/src/agents/data-science-opportunity-analyst.ts`
  - `packages/agents/src/agents/architecture-improvement-analyst.ts`
  - `packages/agents/src/agents/ai-frontier-analyst.ts`

Impacto:

Los especialistas parecen existir, pero muchos de sus checks se alimentan de campos que nunca llegan desde `ALL_WORKSHEETS`, por lo que el analisis no es confiable.

### P0 - Los prompts de Antigravity son demasiado generales

Evidencia:

- `apps/server/src/modules/pipeline/routes.ts:460-505` genera un prompt por proyecto basado casi solo en scores debiles.
- No usa las `ImprovementProposal[]` reales del composer.
- No incluye path del proyecto, archivos afectados, criterios de aceptacion, riesgos, rollback, ni comandos.
- Ya existe `packages/prompt-packets/src/index.ts`, pero el pipeline no lo usa para prompts finales.

Impacto:

El entregable central del producto queda flojo: Antigravity recibe "mejora esta metrica" en vez de instrucciones ejecutables con evidencia.

### P1 - Endpoint de prompt packets mal montado

Evidencia:

- `apps/server/src/index.ts:78` monta `reportRoutes` en `/api/prompt-packets`.
- `apps/server/src/modules/reports/routes.ts:263` define `router.post('/prompt-packets/generate', ...)`.
- `apps/web/src/config.ts:33` apunta a `/api/prompt-packets/generate`.

Ruta real actual probable: `/api/prompt-packets/prompt-packets/generate`.
Ruta esperada por frontend: `/api/prompt-packets/generate`.

Impacto:

La generacion individual de prompt packets desde frontend queda rota o inconsistente.

### P1 - Launcher no usa bien proyectos dinamicos

Evidencia:

- `apps/server/src/modules/projects/routes.ts:173-181` tiene `LAUNCHER_MAP` hardcoded con IDs hyphen.
- El pipeline normaliza IDs con underscores en `apps/server/src/modules/pipeline/routes.ts:511`.
- `Project` usa `launcherScript`, pero `POST /api/projects/:id/launch` castea a `{ path, script }`.

Impacto:

Proyectos escaneados en SQLite pueden no lanzar su script real. El objetivo "un click sin problemas de puertas/puertos" queda fragil.

### P1 - UI de inteligencia y mejoras usa datos mock/estaticos

Evidencia:

- `apps/web/src/context/ProjectContext.tsx` usa solo `MOCK_PROJECTS`.
- `apps/web/src/pages/PlatformIntelPage.tsx` usa solo `MOCK_PROJECTS`.
- `apps/web/src/pages/StrategicImprovePage.tsx` mezcla pipeline con `STATIC` y `MOCK_PROJECTS`.
- `apps/web/src/pages/LauncherPage.tsx` usa `MOCK_PROJECTS`.

Impacto:

La plataforma no "recuerda" de verdad todo lo que existe si la UI principal no lee SQLite/API como fuente primaria.

### P1 - Tipo de findings en StrategicImprovePage no coincide con el backend

Evidencia:

- Backend guarda `AnalystFinding` con `detail` y `severity`.
- `StrategicImprovePage` espera `description` y `priority`.
- Lineas clave:
  - `apps/server/src/modules/pipeline/routes.ts:39`
  - `apps/server/src/modules/pipeline/routes.ts:210`
  - `apps/web/src/pages/StrategicImprovePage.tsx:18-27`
  - `apps/web/src/pages/StrategicImprovePage.tsx:287-293`

Impacto:

La pestaña de hallazgos reales puede mostrar textos vacios o prioridades incorrectas.

### P1 - Memoria temporal insuficiente

Evidencia:

- `apps/server/src/db/repositories/pipeline-runs.ts` guarda resumen global, pero no snapshots por proyecto/metrica.
- `temporal-analyst` espera `historicalRuns` con `scores`, pero el pipeline no se los alimenta.

Impacto:

No hay mejora continua real ni deteccion historica de regresiones por proyecto.

### P2 - Exports incompletos

Evidencia:

- `packages/agents/src/index.ts` no exporta `getAgentsByTier`, `getAgentsByCrew` ni los runners nuevos.
- `packages/domain/src/index.ts` no exporta `WS15_FIVE_FORCES`, aunque si esta en `ALL_WORKSHEETS`.

Impacto:

Otros paquetes no pueden consumir limpiamente las capacidades nuevas que el estado del proyecto afirma que existen.

### P2 - Estado y versionado desalineados

Evidencia:

- `CURRENT_STATE.md` dice v2.3.0.
- `CURRENT_TASK.md` dice v2.2.0.
- `PROJECT_MANIFEST.yaml` dice v0.2.0 y `scaffold-complete`.
- `package.json` y paquetes dicen v0.1.0.

Impacto:

Los agentes y operadores no saben si estan trabajando sobre scaffold, v2.2 o v2.3.

---

# Prompts Precisos Para Antigravity

Los prompts siguientes estan listos para pegar en Antigravity. Ejecutalos en orden. Cada prompt esta acotado para evitar conflictos.

## Prompt 01 - Conectar el swarm real de 20 agentes al pipeline

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P0
Objetivo: hacer que el pipeline real use el swarm jerarquico de 20 agentes, no solo 6 analistas.

## Contexto

Connected Strategy declara 20 agentes en `packages/agents/src/registry.ts`, con supervisor, crew leads y especialistas. Sin embargo:

- `apps/server/src/modules/pipeline/routes.ts` ejecuta solo 6 analistas + `proposal-composer`.
- `apps/server/src/modules/analysis/routes.ts` repite el mismo subset.
- `apps/server/src/modules/health/routes.ts` repite el mismo subset.

Esto rompe la promesa central del producto: auditorias con agentes especialistas interconectados.

## Archivos a modificar

- `apps/server/src/modules/pipeline/routes.ts`
- `apps/server/src/modules/analysis/routes.ts`
- `apps/server/src/modules/health/routes.ts`
- Opcional si ayuda: crear `apps/server/src/modules/analysis/orchestrator.ts`
- Opcional si ayuda: `packages/agents/src/index.ts`

## Requisitos

1. Crear una funcion reutilizable de orquestacion del pipeline que ejecute fases:
   - strategist-supervisor para planear.
   - recon-lead.
   - portfolio-scanner y competitive-intel-agent cuando aplique.
   - analysis-lead.
   - worksheet-synthesizer.
   - analistas especialistas existentes.
   - frontier-mapper-agent cuando haya entidades WS12.
   - causal-mapper usando scores calculados.
   - temporal-analyst usando historial si existe.
   - anomaly-detector usando scores actuales y portfolio scores.
   - proposal-composer.
   - validation-agent.
   - cost-estimator-agent.
   - action-lead.
   - strategist-supervisor otra vez para sintesis final si hay contradicciones.

2. No romper compatibilidad del response actual de `/api/pipeline/run-full`.

3. En cada resultado de proyecto incluir:
   - `agentRuns`: lista de agentes ejecutados, status, duration, evidence.
   - `validatedProposals`: propuestas que pasaron validation-agent.
   - `flaggedProposals`: propuestas con issues.
   - `causal`: output de causal-mapper.
   - `temporal`: output de temporal-analyst.
   - `anomalies`: output de anomaly-detector.
   - `actionPackage`: output de action-lead.

4. Persistir jobs para cada agente como hoy se hace con los analistas.

5. Si un agente no tiene input suficiente, debe devolver resultado skipped/empty explicito, no fallar todo el pipeline.

## Criterios de aceptacion

- `GET /api/analysis/agents` sigue devolviendo 20 agentes.
- `POST /api/pipeline/run-full` devuelve para cada proyecto al menos 15 agentes ejecutados o skipped explicitamente.
- `proposal-composer` recibe findings de temporal, anomaly y causal cuando existan.
- `validation-agent` corre despues de `proposal-composer`.
- `action-lead` corre despues de validation/cost.
- Typecheck pasa en server y agents.

## Verificacion

Ejecutar:

```powershell
pnpm --filter @cs/agents typecheck
pnpm --filter @cs/server typecheck
pnpm test
```

Luego arrancar la app y probar:

```powershell
scripts\start.bat
```

En la UI, correr "Pipeline completo sin costo" y confirmar que el resultado muestra el swarm extendido.
```

## Prompt 02 - Corregir claves de worksheets en agentes especialistas

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P0
Objetivo: hacer que los agentes especialistas usen las claves reales de `ALL_WORKSHEETS`.

## Contexto

Los agentes leen claves antiguas como:

- `ws04_q_automation_level`
- `ws05_q_proprietary_data`
- `ws07_q_modularity`
- `ws08_q_instrumentation`
- `ws03_q_network_effect`

Pero `packages/domain/src/worksheets.ts` define claves actuales como:

- `ce_automatic_execution`
- `sci_network_effect`
- `dsr_data_availability`
- `dsr_instrumentation_coverage`
- `ar_modularity`
- `ar_test_coverage`
- `ar_observability`
- `bms_revenue_model_clarity`
- `cp_internal_fit`

## Archivos a modificar

- `packages/agents/src/agents/connected-strategy-analyst.ts`
- `packages/agents/src/agents/competitive-advantage-analyst.ts`
- `packages/agents/src/agents/business-model-analyst.ts`
- `packages/agents/src/agents/data-science-opportunity-analyst.ts`
- `packages/agents/src/agents/architecture-improvement-analyst.ts`
- `packages/agents/src/agents/ai-frontier-analyst.ts`
- Opcional: crear `packages/agents/src/worksheet-answer-adapter.ts`
- Agregar tests en `tests/core.test.ts` o nuevo test en `packages/agents/src/*.test.ts`

## Requisitos

1. Crear un adapter pequeno que lea respuestas por clave canonica y permita alias legacy solo como fallback.
2. Reemplazar todas las lecturas `wsXX_q_*` por claves canonicas del dominio.
3. Cada agente debe declarar en comentarios o constantes:
   - metricas que evalua
   - worksheet IDs que consume
   - keys canonicas que usa
4. Agregar test que falle si un agente usa una key `ws\d\d_q_` que no existe en `getAllQuestionIds()`.
5. No cambiar el shape de `AnalystReport`.

## Criterios de aceptacion

- No queda ninguna lectura directa de `wsXX_q_*` inexistente en agentes.
- Los analistas producen hallazgos distintos cuando cambian valores canonicos como `ar_test_coverage`, `sci_network_effect`, `ce_automatic_execution`.
- `pnpm --filter @cs/agents typecheck` pasa.
- `pnpm test` pasa.

## Verificacion

```powershell
pnpm --filter @cs/domain typecheck
pnpm --filter @cs/agents typecheck
pnpm test
```
```

## Prompt 03 - Convertir los prompts de Antigravity en entregables accionables

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P0
Objetivo: reemplazar prompts genericos del pipeline por prompt packets precisos basados en propuestas reales.

## Contexto

`apps/server/src/modules/pipeline/routes.ts` genera prompts con `generateAntigravityPrompt()`, pero solo usa conteos y scores debiles. Ya existe `packages/prompt-packets/src/index.ts` con `generatePacketFromProposal()` y `toMarkdown()`.

## Archivos a modificar

- `apps/server/src/modules/pipeline/routes.ts`
- `packages/prompt-packets/src/index.ts` si hace falta enriquecer formato
- `apps/web/src/pages/PromptPacketsPage.tsx`
- `apps/web/src/pages/StrategicImprovePage.tsx`

## Requisitos

1. Despues de `proposal-composer` y `validation-agent`, generar prompt packets por cada propuesta valida.
2. Cada prompt para Antigravity debe incluir:
   - project name
   - project path
   - proposal title
   - context
   - evidence
   - expected impact
   - risk level
   - affected components/files
   - acceptance criteria
   - verification commands
   - "Do not touch" scope
3. Para propuestas high-risk, generar `codex_plan` en lugar de `antigravity_execution`.
4. El response de `/api/pipeline/prompts` debe devolver prompts por propuesta, no solo por proyecto.
5. La UI debe mostrar:
   - prompt source proposal ID
   - risk
   - copy button
   - status validated/flagged

## Criterios de aceptacion

- Un prompt generado menciona una propuesta concreta y no solo "Improve Data Science".
- Cada prompt trae criterios de aceptacion y comandos.
- Si no hay propuestas validas, la UI dice claramente "no hay propuestas validas".
- Typecheck web/server pasa.

## Verificacion

```powershell
pnpm --filter @cs/server typecheck
pnpm --filter @cs/web typecheck
pnpm test
```
```

## Prompt 04 - Arreglar ruta de prompt packets

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P1
Objetivo: corregir el endpoint de prompt packet generation.

## Contexto

`apps/server/src/index.ts` monta `reportRoutes` en:

- `/api/reports`
- `/api/prompt-packets`

Pero `apps/server/src/modules/reports/routes.ts` define:

- `router.post('/prompt-packets/generate', ...)`

El frontend espera:

- `/api/prompt-packets/generate`

La ruta real queda probablemente duplicada: `/api/prompt-packets/prompt-packets/generate`.

## Archivos a modificar

- `apps/server/src/modules/reports/routes.ts`
- `apps/server/src/index.ts` si decides separar routers
- `apps/web/src/config.ts` solo si cambias estrategia
- Agregar test API ligero si existe patron local

## Requisitos

1. La ruta final debe ser exactamente `POST /api/prompt-packets/generate`.
2. No romper rutas bajo `/api/reports`.
3. Mantener compatibilidad del body:
   - `{ proposal, type }`
4. Si es posible, separar `promptPacketRoutes` de `reportRoutes`.

## Criterios de aceptacion

- `api.promptPacketGenerate` en frontend apunta a una ruta existente.
- No existe una ruta duplicada `/api/prompt-packets/prompt-packets/generate`.
- Typecheck server/web pasa.

## Verificacion

```powershell
pnpm --filter @cs/server typecheck
pnpm --filter @cs/web typecheck
```
```

## Prompt 05 - Hacer live la pagina de Mejoras Estrategicas

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P1
Objetivo: que `StrategicImprovePage` sea una pantalla real de mejoras, no una mezcla de mocks y estaticos.

## Contexto

`apps/web/src/pages/StrategicImprovePage.tsx` usa:

- `MOCK_PROJECTS`
- `STATIC`
- tipos `LiveFinding` con `description/priority`, pero backend devuelve `detail/severity`

## Archivos a modificar

- `apps/web/src/pages/StrategicImprovePage.tsx`
- `apps/web/src/config.ts` si hace falta endpoint nuevo
- Opcional: crear hook `apps/web/src/hooks/useProjects.ts`
- Opcional: crear hook `apps/web/src/hooks/usePipelineResults.ts`

## Requisitos

1. Cargar proyectos desde `GET /api/projects`, con fallback a mocks solo si API no responde.
2. Cargar findings desde `GET /api/pipeline/findings` usando el tipo real:
   - `finding.detail`
   - `finding.severity`
   - `finding.evidence`
   - `finding.loopPhase`
3. Cargar proposals desde `GET /api/pipeline/proposals`.
4. Cargar prompt packets desde `GET /api/pipeline/prompts`.
5. Reemplazar `STATIC` por una seccion "fallback demo" claramente marcada, o eliminarla si hay API.
6. Mostrar por proyecto:
   - findings por severidad
   - proposals validadas/flagged
   - prompt packets listos para copiar
   - ultimo pipeline run
7. Mantener boton "Correr Pipeline (sin costo)".

## Criterios de aceptacion

- Si el pipeline ya corrio, no se muestran propuestas estaticas.
- Los hallazgos reales muestran `detail` y `severity` correctamente.
- El prompt copiado corresponde al proyecto seleccionado.
- Typecheck web pasa.

## Verificacion

```powershell
pnpm --filter @cs/web typecheck
```
```

## Prompt 06 - Hacer live PlatformIntel, Launcher y ProjectContext

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P1
Objetivo: reemplazar dependencia primaria de `MOCK_PROJECTS` por API/SQLite en las pantallas que deben recordar plataformas reales.

## Contexto

Estas piezas usan mocks como fuente primaria:

- `apps/web/src/context/ProjectContext.tsx`
- `apps/web/src/pages/PlatformIntelPage.tsx`
- `apps/web/src/pages/LauncherPage.tsx`

El producto debe recordar plataformas reales, skills, workflows, scripts y accesos desde SQLite/API.

## Archivos a modificar

- `apps/web/src/context/ProjectContext.tsx`
- `apps/web/src/pages/PlatformIntelPage.tsx`
- `apps/web/src/pages/LauncherPage.tsx`
- `apps/server/src/modules/projects/routes.ts`
- `apps/server/src/db/repositories/projects.ts`
- `packages/domain/src/types.ts` si faltan campos persistidos

## Requisitos

1. Extender persistencia de `projects` para guardar:
   - `launcherScript`
   - `healthUrl`
   - `description`
   - `scriptCount`
   - `skills`
   - `workflows`
   - `serviceAccess`
2. Exponer esos campos en `GET /api/projects`.
3. `ProjectContext` debe cargar proyectos de API y usar mocks solo como fallback.
4. `PlatformIntelPage` debe usar proyectos live.
5. `LauncherPage` debe usar proyectos live.
6. Mostrar estado "API live" vs "demo fallback".

## Criterios de aceptacion

- Al correr `POST /api/projects/scan`, la UI actualiza la lista sin tocar `mockData.ts`.
- Launcher muestra proyectos escaneados reales.
- PlatformIntel muestra workflows/skills persistidos cuando existan.
- Typecheck server/web pasa.

## Verificacion

```powershell
pnpm --filter @cs/server typecheck
pnpm --filter @cs/web typecheck
pnpm test
```
```

## Prompt 07 - Arreglar launcher: IDs, launcherScript y seguridad de spawn

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P1
Objetivo: hacer confiable el lanzamiento de plataformas con un click.

## Contexto

Problemas actuales:

- `apps/server/src/modules/projects/routes.ts` usa `LAUNCHER_MAP` hardcoded con IDs hyphen.
- El pipeline normaliza proyectos con underscores.
- `Project` tiene `launcherScript`, pero launch route busca `script`.
- `spawn('cmd.exe', ['/c', ...])` arma comandos con strings que deben validarse.

## Archivos a modificar

- `apps/server/src/modules/projects/routes.ts`
- `packages/runtime/src/launch-profile.ts`
- `packages/runtime/src/session-manager.ts` si decides conectar sesiones
- `apps/web/src/pages/LauncherPage.tsx`

## Requisitos

1. Crear funcion unica `normalizeProjectId()` compartida o al menos consistente.
2. Soportar aliases hyphen/underscore para compatibilidad:
   - `connected-strategy` y `connected_strategy`
   - `balam-demo` y `balam_demo`
3. Usar `project.launcherScript` si existe.
4. Validar que el script existe dentro de `project.path` antes de lanzarlo.
5. Si no hay script, abrir VS Code con el path.
6. Devolver respuesta clara:
   - method
   - resolvedPath
   - scriptExists
   - pid/session si aplica
7. No lanzar rutas fuera de `C:\dev` salvo configuracion explicita.

## Criterios de aceptacion

- `POST /api/projects/connected-strategy/launch` funciona.
- `POST /api/projects/connected_strategy/launch` funciona.
- Si el script no existe, API devuelve error claro o fallback controlado a VS Code.
- No se ejecuta ningun script fuera del project path.
- Typecheck server pasa.

## Verificacion

```powershell
pnpm --filter @cs/server typecheck
```
```

## Prompt 08 - Agregar memoria temporal real por proyecto/metrica

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P1
Objetivo: permitir que `temporal-analyst` detecte regresiones reales usando historial SQLite.

## Contexto

`temporal-analyst` espera `historicalRuns` con scores. Actualmente `pipeline_runs` guarda resumen global, pero no scores por proyecto/metrica.

## Archivos a modificar

- `apps/server/src/db/index.ts`
- `apps/server/src/db/repositories/pipeline-runs.ts`
- `apps/server/src/modules/pipeline/routes.ts`
- `packages/agents/src/agents/temporal-analyst.ts` si hace falta adaptar input
- Opcional: endpoint `GET /api/pipeline/history/:projectId`

## Requisitos

1. Agregar tabla nueva, por ejemplo `project_metric_snapshots`:
   - id
   - pipeline_run_id
   - project_id
   - timestamp
   - scores JSON
   - metrics JSON opcional
2. En cada pipeline run, guardar snapshot por proyecto despues de calcular metrics.
3. Antes de correr `temporal-analyst`, leer snapshots anteriores del proyecto y pasar `historicalRuns`.
4. Exponer historial por proyecto para UI.
5. Mantener migracion backward compatible.

## Criterios de aceptacion

- Segunda ejecucion de pipeline produce `temporal-analyst` con `runsAnalyzed > 0`.
- Si una metrica baja mas de umbral, aparece finding de regresion.
- No se rompe `GET /api/pipeline/history`.
- Typecheck server/agents pasa.

## Verificacion

```powershell
pnpm --filter @cs/server typecheck
pnpm --filter @cs/agents typecheck
pnpm test
```
```

## Prompt 09 - Hacer especialistas mas expertos con rubricas declarativas

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P1
Objetivo: elevar los agentes de heuristicas sueltas a especialistas auditables con rubricas por dominio.

## Contexto

Hoy los agentes existen y devuelven findings, pero su expertise esta mezclada en codigo procedural. Necesitamos que cada agente tenga una rubrica clara para:

- Connected Strategy / Wharton
- Competitive Advantage
- Business Model
- Data Science / MITx rigor
- Architecture
- AI Frontier

## Archivos a modificar

- `packages/agents/src/types.ts`
- `packages/agents/src/registry.ts`
- `packages/agents/src/agents/*.ts`
- Opcional: crear `packages/agents/src/rubrics.ts`
- Tests en `tests/core.test.ts` o paquete agents

## Requisitos

1. Definir tipo `AgentRubric`:
   - domain
   - frameworks
   - inputSignals
   - scoringKeys
   - evidenceRequirements
   - forbiddenGenericAdvice
   - outputQualityChecks
2. Asociar una rubrica a cada `AgentDefinition`.
3. Cada agente debe usar su rubrica para:
   - validar inputs minimos
   - etiquetar findings con framework
   - rechazar consejos genericos sin evidencia
4. Agregar test que garantice que cada agente tiene rubrica.
5. UI AgentOrchestrator debe poder mostrar framework/rubrica desde API, no desde lista static.

## Criterios de aceptacion

- `GET /api/analysis/agents` devuelve rubricas por agente.
- Ningun agente especialista queda sin `frameworks`.
- Findings incluyen framework o dimension estrategica.
- Typecheck agents/web/server pasa.

## Verificacion

```powershell
pnpm --filter @cs/agents typecheck
pnpm --filter @cs/server typecheck
pnpm --filter @cs/web typecheck
pnpm test
```
```

## Prompt 10 - Conectar AgentOrchestratorPage al registro real

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P2
Objetivo: eliminar drift entre UI de agentes y registry real.

## Contexto

`apps/web/src/pages/AgentOrchestratorPage.tsx` mantiene un array static `AGENTS`. El registry real vive en `packages/agents/src/registry.ts` y API `GET /api/analysis/agents`.

## Archivos a modificar

- `apps/web/src/pages/AgentOrchestratorPage.tsx`
- `apps/web/src/config.ts` si falta endpoint
- `packages/agents/src/index.ts`

## Requisitos

1. Cargar agentes desde `GET /api/analysis/agents`.
2. Usar static AGENTS solo como fallback demo.
3. Mostrar:
   - tier
   - crew
   - loopPhase
   - inputContract
   - outputContract
   - canDelegate
   - runsAutonomously
   - rubrics si Prompt 09 ya existe
4. Mantener vistas hierarchy/orgchart/flow.
5. Si API esta offline, mostrar badge "demo fallback".

## Criterios de aceptacion

- Si registry cambia, la UI cambia sin editar `AgentOrchestratorPage.tsx`.
- Los 20 agentes aparecen desde API.
- Typecheck web pasa.

## Verificacion

```powershell
pnpm --filter @cs/web typecheck
```
```

## Prompt 11 - Exportar capacidades nuevas correctamente

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P2
Objetivo: corregir exports incompletos en paquetes compartidos.

## Contexto

Faltan exports publicos para capacidades que ya existen:

- `packages/agents/src/index.ts` no exporta `getAgentsByTier`, `getAgentsByCrew` ni runners nuevos.
- `packages/domain/src/index.ts` no exporta `WS15_FIVE_FORCES`.

## Archivos a modificar

- `packages/agents/src/index.ts`
- `packages/domain/src/index.ts`
- Tests si aplica

## Requisitos

1. Exportar:
   - `AgentTier`
   - `CrewId`
   - `getAgentsByTier`
   - `getAgentsByCrew`
   - runners de nuevos agentes
2. Exportar `WS15_FIVE_FORCES`.
3. No romper imports existentes.

## Criterios de aceptacion

- Paquetes consumidores pueden importar helpers nuevos desde `@cs/agents`.
- Paquetes consumidores pueden importar `WS15_FIVE_FORCES` desde `@cs/domain`.
- Typecheck monorepo pasa.

## Verificacion

```powershell
pnpm --filter @cs/domain typecheck
pnpm --filter @cs/agents typecheck
pnpm test
```
```

## Prompt 12 - Alinear versiones y estado canonico

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P2
Objetivo: alinear metadata de version/estado para evitar confusion de agentes.

## Contexto

Hay desalineacion:

- `CURRENT_STATE.md`: v2.3.0
- `CURRENT_TASK.md`: v2.2.0
- `PROJECT_MANIFEST.yaml`: v0.2.0, `scaffold-complete`
- `package.json` y paquetes: v0.1.0

## Archivos a modificar

- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`
- `PROJECT_MANIFEST.yaml`
- `package.json`
- `apps/*/package.json`
- `packages/*/package.json`

## Requisitos

1. Definir version canonica actual como `2.3.0` si ese es el estado real.
2. Actualizar status a `operational` o equivalente consistente.
3. Agregar changelog breve de esta alineacion.
4. No cambiar dependencias ni scripts.

## Criterios de aceptacion

- Todos los archivos de estado mencionan la misma version.
- `PROJECT_MANIFEST.yaml` no dice `scaffold-complete` si la plataforma ya esta operacional.
- Typecheck no afectado.

## Verificacion

```powershell
pnpm --filter @cs/domain typecheck
pnpm --filter @cs/agents typecheck
pnpm --filter @cs/server typecheck
pnpm --filter @cs/web typecheck
```
```

## Prompt 13 - Proteger serviceAccess y credenciales locales

```markdown
# ANTIGRAVITY_EXECUTION_PROMPT

Repositorio: C:\dev\Connected_Strategy
Prioridad: P2
Objetivo: mantener el acceso rapido a plataformas sin exponer credenciales en codigo.

## Contexto

`apps/web/src/mockData.ts` contiene `serviceAccess` con usuario y password hint. Aunque sea local, esto puede terminar en git o en capturas. El producto necesita ayudar a entrar a plataformas, pero con seguridad.

## Archivos a modificar

- `packages/domain/src/types.ts`
- `apps/web/src/mockData.ts`
- `apps/web/src/pages/PlatformIntelPage.tsx`
- `apps/server/src/db/index.ts`
- `apps/server/src/db/repositories/projects.ts`
- `.gitignore`
- Crear archivo local ejemplo: `config/service_access.example.json`

## Requisitos

1. Mover `serviceAccess` sensible a archivo local ignorado por git, por ejemplo `config/service_access.local.json`.
2. Crear `config/service_access.example.json` sin secretos reales.
3. UI debe mostrar:
   - nombre del servicio
   - URL
   - usuario si existe
   - passwordHint solo bajo boton "revelar"
   - aviso "local only"
4. No guardar passwords completos.
5. `.gitignore` debe ignorar `config/service_access.local.json`.

## Criterios de aceptacion

- No queda password hint sensible hardcoded en `mockData.ts`.
- La UI sigue ayudando a abrir servicios.
- El archivo ejemplo documenta el formato.
- Typecheck web/server/domain pasa.

## Verificacion

```powershell
pnpm --filter @cs/domain typecheck
pnpm --filter @cs/server typecheck
pnpm --filter @cs/web typecheck
```
```
