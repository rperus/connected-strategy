# Reporte de Fragilidad del Sistema y Objetos "Dios" (Fase 3)

Este reporte analiza los cuellos de botella de la arquitectura y la centralidad de la red en la plataforma `Connected_Strategy`. 

## 1. Top 15 Nodos con Mayor Centralidad de Intermediación (Betweenness Centrality)
La centralidad de intermediación mide qué tan frecuentemente un nodo actúa como un puente a lo largo del camino más corto entre cualquier par de nodos en el sistema. Los nodos con puntajes altos son los cuellos de botella del flujo de información.

| Nodo | Archivo | ID en el Grafo | Centralidad |
| --- | --- | --- | --- |
| `index.ts` | `packages/agents/src/index.ts` | `packages_agents_src_index_ts_src_index` | 0.078219 |
| `index.ts` | `packages/domain/src/index.ts` | `packages_domain_src_index_ts_src_index` | 0.064646 |
| `index.ts` | `apps/server/src/index.ts` | `apps_server_src_index_ts_src_index` | 0.060161 |
| `closeDb()` | `apps/server/src/db/index.ts` | `db_index_closedb` | 0.042212 |
| `runV3Pipeline()` | `packages/agents/src/v3/pipeline-orchestrator.ts` | `v3_pipeline_orchestrator_runv3pipeline` | 0.042101 |
| `routes.ts` | `apps/server/src/modules/pipeline/routes.ts` | `pipeline_routes` | 0.042076 |
| `index.ts` | `apps/server/src/db/index.ts` | `apps_server_src_db_index_ts_db_index` | 0.041778 |
| `causal-mapper.ts` | `packages/agents/src/agents/causal-mapper.ts` | `agents_causal_mapper` | 0.041348 |
| `getDb()` | `apps/server/src/db/index.ts` | `apps_server_src_db_index_ts_db_index_getdb` | 0.040906 |
| `getProjectRoot()` | `packages/runtime/src/port-config.ts` | `src_port_config_getprojectroot` | 0.040468 |
| `AgentResult` | `packages/agents/src/types.ts` | `src_types_agentresult` | 0.039119 |
| `runCausalMapper()` | `packages/agents/src/agents/causal-mapper.ts` | `agents_causal_mapper_runcausalmapper` | 0.038908 |
| `runProjectAutonomously()` | `apps/server/src/scheduler.ts` | `src_scheduler_runprojectautonomously` | 0.038166 |
| `defaultScoringWeights()` | `packages/domain/src/types.ts` | `src_types_defaultscoringweights` | 0.036407 |
| `computeStrategicMetrics()` | `packages/domain/src/scoring.ts` | `src_scoring_computestrategicmetrics` | 0.035092 |

---

## 2. Análisis Profundo de los Cuellos de Botella Principales

### Target A: `closeDb()` (Cuello de Botella de Infraestructura)
* **Archivo:** `apps/server/src/db/index.ts`
* **Puntaje de Centralidad:** `0.042212`
* **Vecinos Directos (1-hop):** 2
* **Radio de Impacto Transitivo (2-hop):** 36 nodos
* **Efecto de Ruptura (Split Effect):** 1 subgrafos aislados creados si se elimina.
* **Conexiones Clave:** Conecta directamente la infraestructura de persistencia con el cierre ordenado de la API y el bus de mantenimiento.

### Target B: `runV3Pipeline()` (Cuello de Botella del Swarm de Agentes V3)
* **Archivo:** `packages/agents/src/v3/pipeline-orchestrator.ts`
* **Puntaje de Centralidad:** `0.042101`
* **Vecinos Directos (1-hop):** 27
* **Radio de Impacto Transitivo (2-hop):** 129 nodos
* **Efecto de Ruptura (Split Effect):** 0 subgrafos aislados creados si se elimina.
* **Conexiones Clave:** Conecta la base de datos de historial (`saveHistoricalRun()`), los gestores de contexto de Gemini, los archivos Wharton parsed y el orquestador principal del Swarm multitarea.

---

## 3. Propuestas Detalladas de Refactorización y Desacoplamiento

### Propuesta 1: Desacoplamiento de `closeDb()` y persistencia (Patrón de Ciclo de Vida del Servidor)
Actualmente `closeDb()` es un puente masivo porque el servidor de Express (`index.ts`) y los scripts de mantenimiento y limpieza en `db/maintenance.ts` llaman a esta función de manera directa y ad-hoc, acoplando fuertemente el ciclo de vida de la base de datos con las operaciones de red.
* **Solución de Desacoplamiento:**
  1. **Servicio de Ciclo de Vida (Lifecycle Manager):** Crear un `ServerLifecycleManager` central en la infraestructura que registre listeners de apagado (`shutdown hooks`).
  2. **Registro Desacoplado:** La base de datos y la cola de tareas se registran a sí mismas en el gestor de ciclo de vida en el inicio. Cuando Express o el proceso de limpieza ordenan apagar, llaman al `LifecycleManager.shutdown()`, el cual ejecuta los hooks de forma asíncrona sin que las rutas o routers importen `closeDb()` directamente.
  3. **Resultado:** Reducción de la centralidad de intermediación de `closeDb()` de `0.042` a `<0.005`, convirtiéndola en un nodo terminal de infraestructura local.

### Propuesta 2: Desacoplamiento de `runV3Pipeline()` (Patrón Mediator y Event-Driven Architecture)
`runV3Pipeline()` es el cerebro que importa y ejecuta secuencialmente a todos los agentes especialistas de Wharton (Customer Journey, Info Flow, Deeper Needs, Tech Stack, Revenue Model, Swarm QA, etc.). Esto crea un **Monolito de Orquestación** (God Orchestrator) extremadamente difícil de probar unitariamente de manera aislada.
* **Solución de Desacoplamiento:**
  1. **Patrón Mediador (Mediator Pattern):** Introducir un `PipelineMediator` basado en eventos. En lugar de que `runV3Pipeline` importe todos los agentes directamente, registra a cada agente especialista como un "Handler" de una fase del pipeline.
  2. **Orquestación por Eventos:** El pipeline emite un evento `PhaseReadyEvent` (ej. `ws01_complete`). Los agentes especialistas se suscriben a sus respectivas entradas y emiten eventos de salida (ej. `runCustomerJourneyMapper` emite `ws01_complete`).
  3. **Resultado:** `runV3Pipeline()` ya no importa los 15 agentes especialistas de Wharton. Su centralidad e in-degree se desploman, y el sistema se vuelve altamente extensible, permitiendo agregar nuevos agentes estrategas Wharton simplemente escuchando eventos de fase.
