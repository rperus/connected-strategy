---
type: documentation
title: Parallel Task Sets
description: Parallel Task Sets
timestamp: '2026-06-27T17:40:07Z'
---

# Parallel Task Sets

## Regla de oro

No correr en paralelo sets con write scopes que se toquen. Si un set necesita integrar archivos compartidos, esa integracion queda para `SET-08`.

## Vista general

| Set | Nombre | Modo | Dependencias | Write scope principal |
| --- | --- | --- | --- | --- |
| SET-00 | Program Director and State Keeper | serial y continuo | ninguna | `docs/`, `state/`, coordinacion |
| SET-01 | Workspace Bootstrap | serial primero | SET-00 | root del repo, scaffolding inicial |
| SET-02 | Knowledge and Domain Engine | paralelo | SET-01 | `packages/domain`, `packages/knowledge`, `data/` |
| SET-03 | Analysis Orchestrator and Agents | paralelo | SET-01 | `packages/agents`, `apps/server/src/modules/analysis`, `apps/server/src/modules/projects` |
| SET-04 | UI Workbench and Worksheet Editor | paralelo | SET-01 | `apps/web` |
| SET-05 | Runtime Collision Launcher | paralelo | SET-01 | `packages/runtime`, `apps/server/src/modules/runtime` |
| SET-06 | Reporting and Prompt Packets | paralelo | SET-01 | `packages/reporting`, `packages/prompt-packets`, `apps/server/src/modules/reports` |
| SET-07 | Desktop Shell, Icons and Shortcuts | paralelo | SET-01 | `apps/desktop`, `assets/icons`, installer scripts |
| SET-08 | Integration, QA and Release Local | serial de cierre | SET-02..SET-07 | archivos de integracion y pruebas finales |

## SET-00

- Proposito: coordinar, secuenciar, desbloquear, actualizar estado y validar handoffs.
- No debe implementar modulos del producto.
- Debe ser el duenio de `state/`.

## SET-01

- Proposito: dejar el terreno listo para que los demas sets trabajen sin pelearse por el layout del repo.
- Debe crear la estructura base y los contratos de extension, no implementar logica profunda del producto.
- Sale cuando el repo corre en modo minimo y los demas sets tienen write scopes estables.

## SET-02 a SET-07

Estos son los primeros sets que si deben correr en paralelo una vez terminado `SET-01`.

### Orden recomendado de lanzamiento

1. `SET-02`
2. `SET-03`
3. `SET-04`
4. `SET-05`
5. `SET-06`
6. `SET-07`

## SET-08

- Proposito: unir todo, cerrar conflictos, probar el sistema completo y dejar release local.
- Es el unico set autorizado a tocar cableado compartido final si otros sets no lo hicieron.

## Politica de handoff

Cada set debe entregar:

- Resumen de lo hecho
- Lista exacta de archivos creados/modificados
- Riesgos pendientes
- Comandos de verificacion
- Actualizacion de `state/TASK_BOARD.json`
- Entrada nueva en `state/CHECKPOINT_LOG.md`

## Primeros prompts paralelos

Los primeros prompts de agentes paralelos ya estan listos en:

- `prompts/task-sets/02_knowledge_and_domain.md`
- `prompts/task-sets/03_analysis_orchestrator.md`
- `prompts/task-sets/04_ui_workbench.md`
- `prompts/task-sets/05_runtime_collision_launcher.md`
- `prompts/task-sets/06_reporting_and_prompt_packets.md`
- `prompts/task-sets/07_desktop_shell_icons_shortcuts.md`
