# SET-06 Reporting And Prompt Packets

```
TITULO SUGERIDO: Chat 3
SLOT: Chat 3
HANDOFF_FILE: ops/agent_handoffs/chat_3.md
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

Construir la salida util del sistema: reportes imprimibles y generacion de prompt packets listos para Codex o Antigravity.

## Tu write scope exclusivo

- `packages/reporting/`
- `packages/prompt-packets/`
- `apps/server/src/modules/reports/`

## No-touch files

- `apps/web/`
- `apps/desktop/`
- `apps/server/src/index.ts` (solo agregar import de tus routes, no reescribir)
- `packages/runtime/`
- `packages/agents/`
- `packages/domain/` (consume, no modifiques)
- `packages/knowledge/` (consume, no modifiques)
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## Debes construir

- templates de reportes para:
  - portfolio
  - proyecto
  - propuesta
- soporte print-friendly y export a PDF
- generador de prompt packets con dos salidas:
  - `codex_plan_prompt.md`
  - `antigravity_execution_prompt.md`
- contratos que incluyan:
  - contexto
  - evidencia
  - objetivo
  - restricciones
  - archivos o areas afectadas
  - criterio de aceptacion
  - riesgos
  - pruebas esperadas

## Regla especial

Cada mejora relevante debe terminar en un prompt listo para pegar, no en notas vagas.

## Entregables

- modulo reporting funcional
- prompt packet engine funcional
- salidas listas para imprimir y ejecutar
- handoff file actualizado

## Contrato de fin

Al terminar, escribe exactamente uno de:

```
LISTO
HANDOFF_FILE: ops/agent_handoffs/chat_3.md
```

```
BLOQUEADO
HANDOFF_FILE: ops/agent_handoffs/chat_3.md
```

```
CONTINUE
HANDOFF_FILE: ops/agent_handoffs/chat_3.md
```

No hagas preguntas al humano al final. Solo entrega el bloque de estado.
