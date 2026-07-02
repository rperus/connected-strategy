---
type: prompt
---
# SET-04 UI Workbench And Worksheet Editor

```
TITULO SUGERIDO: Chat 2
SLOT: Chat 2
HANDOFF_FILE: ops/agent_handoffs/chat_2.md
MODO: worker
```

Lee primero:

- `prompts/shared/00_expert_operating_system.md`
- `prompts/shared/01_resume_protocol.md`
- `prompts/shared/02_definition_of_done.md`
- `docs/00_master_execution_plan.md`
- `docs/01_parallel_task_sets.md`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`

## Objetivo

Construir la interfaz principal de la plataforma como web app local: portfolio, detalle de proyecto, editor de worksheets, graficas, proposals, launcher y reportes.

## Tu write scope exclusivo

- `apps/web/`

## No-touch files

- `apps/server/`
- `apps/desktop/`
- `packages/runtime/`
- `packages/reporting/`
- `packages/agents/`
- `packages/domain/` (consume types via import, no modifiques)
- `packages/knowledge/` (consume, no modifiques)
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## Debes construir

- shell general del workbench
- navegacion por:
  - Portfolio
  - Project Detail
  - Worksheets
  - Competitive Advantage
  - Competition
  - Business Model
  - Data Science
  - Architecture
  - AI Frontier
  - Proposals
  - Prompt Packets
  - Reports
  - Launcher
- editor facil de worksheets
- vistas de graficas y scores
- UX clara para versionado, recalc y comparacion antes/despues
- launcher UI para proyectos locales y herramientas externas

## Requisitos de producto

- La app no debe verse como un dashboard generico.
- Debe priorizar claridad estrategica, profundidad y facilidad de edicion.
- La impresion de reportes debe tener modo pantalla y modo print-friendly.
- La API base URL debe leerse de la configuracion de puertos, no hardcodearse.

## Entregables

- workbench web funcional
- editor de worksheets usable
- secciones principales navegables
- handoff file actualizado

## Contrato de fin

Al terminar, escribe exactamente uno de:

```
LISTO
HANDOFF_FILE: ops/agent_handoffs/chat_2.md
```

```
BLOQUEADO
HANDOFF_FILE: ops/agent_handoffs/chat_2.md
```

```
CONTINUE
HANDOFF_FILE: ops/agent_handoffs/chat_2.md
```

No hagas preguntas al humano al final. Solo entrega el bloque de estado.
