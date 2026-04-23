# SET-07 Desktop Shell, Icons And Shortcuts

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
- `docs/00_master_execution_plan.md`
- `docs/01_parallel_task_sets.md`
- `docs/03_antigravity_operating_model.md`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`

## Objetivo

Construir la envoltura desktop de la plataforma para Windows, con icono, shortcut de escritorio, empaquetado instalable y experiencia lista para taskbar.

## Tu write scope exclusivo

- `apps/desktop/`
- `assets/icons/`
- `scripts/` (solo scripts de installer y shortcuts)

## No-touch files

- `apps/web/`
- `apps/server/`
- `packages/runtime/`
- `packages/reporting/`
- `packages/prompt-packets/`
- `packages/agents/`
- `packages/domain/`
- `packages/knowledge/`
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## Debes construir

- wrapper Electron conectado a la web app local
- icon set del producto
- instalacion local Windows
- shortcut de escritorio
- experiencia tray/taskbar-ready
- soporte para abrir la plataforma como si fuera programa real

## Requisito importante

El objetivo final es que el usuario pueda abrir la plataforma con doble click desde escritorio y tenerla pin-ready para barra de tareas.

Si Windows limita el pinning automatico:

- deja el app empaquetado y el icono correcto
- deja atajo de escritorio funcionando
- deja el camino minimo para pin manual

## Entregables

- shell desktop funcional
- assets de icono
- shortcut o scripts de shortcut
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
