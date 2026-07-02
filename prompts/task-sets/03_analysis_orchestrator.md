---
type: prompt
---
# SET-03 Analysis Orchestrator And Agents

```
TITULO SUGERIDO: Chat 1
SLOT: Chat 1
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
MODO: worker
```

Lee primero:

- `prompts/shared/00_expert_operating_system.md`
- `prompts/shared/01_resume_protocol.md`
- `prompts/shared/02_definition_of_done.md`
- `prompts/shared/03_codex_plan_or_execute_rule.md`
- `docs/00_master_execution_plan.md`
- `docs/01_parallel_task_sets.md`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`

## Objetivo

Construir el backend de analisis local y el sistema multiagente determinista para portfolio scan, analysis runs, proposal generation y mejora continua.

## Tu write scope exclusivo

- `packages/agents/`
- `apps/server/src/modules/analysis/`
- `apps/server/src/modules/projects/`

## No-touch files

- `apps/web/`
- `apps/desktop/`
- `apps/server/src/index.ts` (solo agregar import de tus routes, no reescribir)
- `packages/runtime/`
- `packages/reporting/`
- `packages/prompt-packets/`
- `packages/domain/` (consume, no modifiques)
- `packages/knowledge/` (consume, no modifiques)
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## Debes construir

- discovery de proyectos en `C:\dev`
- clasificacion inicial por stack y madurez
- contratos de jobs para analisis
- agentes especialistas al menos para:
  - Portfolio Scanner
  - Worksheet Synthesizer
  - Connected Strategy Analyst
  - Competitive Advantage Analyst
  - Business Model Analyst
  - Data Science Opportunity Analyst
  - Architecture Improvement Analyst
  - AI Frontier Analyst
  - Proposal Composer
- endpoints/modulos para lanzar analisis y leer resultados
- memoria de resultados y trazabilidad de evidencia

## Politica del sistema multiagente

- Usa agentes como workflows deterministas, no como chat libre.
- Consume los contratos de `packages/domain` y `packages/knowledge`.
- Deja puntos de extension para proveedor LLM Gemini-first.
- No ejecutes cambios sobre otros proyectos. Solo analiza y prepara propuestas.

## Entregables

- modulo de analisis funcional
- contratos y registros de jobs
- agentes especialistas definidos
- handoff file actualizado

## Contrato de fin

Al terminar, escribe exactamente uno de:

```
LISTO
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

```
BLOQUEADO
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

```
CONTINUE
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

No hagas preguntas al humano al final. Solo entrega el bloque de estado.
