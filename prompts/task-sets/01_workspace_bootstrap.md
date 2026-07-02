---
type: prompt
---
# SET-01 Workspace Bootstrap

Lee primero:

- `prompts/shared/00_expert_operating_system.md`
- `prompts/shared/01_resume_protocol.md`
- `prompts/shared/02_definition_of_done.md`
- `docs/00_master_execution_plan.md`
- `docs/01_parallel_task_sets.md`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`

## Objetivo

Crear el skeleton tecnico del proyecto para que los demas sets puedan trabajar en paralelo sin colisionar.

## Write scope exclusivo

- root del repo `C:\dev\Connected_Strategy`
- configuracion de workspace (pnpm-workspace.yaml, tsconfig, etc.)
- scripts base (package.json root)
- scaffolding inicial de `apps/` y `packages/`

## No-touch files

- `prompts/`
- `docs/`
- `antigravity/`
- `ops/agent_handoffs/`
- `CHANGELOG_PROJECT.md` (solo el coordinador)

## Debes construir

- monorepo `pnpm`
- shell base para:
  - `apps/web` (Vite + React + TypeScript)
  - `apps/server` (Node + TypeScript + Express)
  - `apps/desktop` (Electron placeholder)
- packages vacios o minimos para:
  - `packages/domain`
  - `packages/knowledge`
  - `packages/agents`
  - `packages/runtime`
  - `packages/reporting`
  - `packages/prompt-packets`
- scripts root para dev, build y test
- contrato base para configuracion local y data directories
- port config reader que lea `ops/runtime/active_ports.json` primero, luego `config/port_registry.yaml`

## No debes hacer aun

- logica profunda de worksheets
- analisis de conocimiento
- UI final
- runtime collision logic avanzada
- reporting completo

## Entregables minimos

- layout estable del repo
- scripts que permitan a los otros sets trabajar
- placeholders y contratos de extension
- actualizacion completa de estado

## Criterio de salida

Sales cuando `SET-02` a `SET-07` pueden arrancar sin discutir estructura de repo ni write scopes.
