# SET-05 Runtime Collision Launcher

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
- `docs/operations/PORT_REGISTRY_POLICY.md`
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- `docs/00_master_execution_plan.md`
- `docs/01_parallel_task_sets.md`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`

## Objetivo

Construir el sistema que detecta proyectos, crea launch profiles, abre plataformas con un click y evita colisiones de puertos, procesos, nombres de sesion y variables.

## Tu write scope exclusivo

- `packages/runtime/`
- `apps/server/src/modules/runtime/`

## No-touch files

- `apps/web/`
- `apps/desktop/`
- `apps/server/src/index.ts` (solo agregar import de tus routes, no reescribir)
- `packages/reporting/`
- `packages/prompt-packets/`
- `packages/agents/`
- `packages/domain/` (consume, no modifiques)
- `config/port_registry.yaml` (lee, no modifiques)
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## CRITICAL: Port policy

- `config/port_registry.yaml` es la fuente de puertos fijos preferidos. LEELA.
- `ops/runtime/active_ports.json` es la fuente de verdad en runtime. ESCRIBELA cuando un puerto cambie.
- Tu launcher debe leer `active_ports.json` primero, luego `port_registry.yaml` como fallback.
- Si un puerto fijo esta ocupado, asigna uno libre y escribe el override en `active_ports.json`.
- No hardcodees puertos en ningun otro archivo.

## Debes construir

- detector de stacks por proyecto
- `LaunchProfile` por repo
- asignacion segura de puertos (leyendo la policy)
- sesiones efimeras de runtime
- salud de proceso y health URLs
- registro de herramientas externas:
  - Codex
  - Antigravity
  - URLs o apps configurables
- politica de apertura sin necesidad de `.bat` manuales del usuario

## Requisitos especiales

- Debes soportar al menos Node/Vite, monorepos Node y Python como casos base.
- Debes dejar hooks para Docker cuando exista compose.
- Debes preservar los repos auditados; no debes reescribir configuraciones del proyecto original para resolver colisiones.

## Entregables

- modulo runtime funcional
- contratos de launch y session status
- reglas de colision y aislamiento
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
