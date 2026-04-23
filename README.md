# Connected_Strategy Execution Pack

Este workspace contiene el paquete de ejecucion para construir la plataforma `Connected_Strategy` con Antigravity y agent manager, manteniendo todo bajo `C:\dev\Connected_Strategy`.

## Leer en este orden

1. `CURRENT_STATE.md`
2. `CURRENT_TASK.md`
3. `CHANGELOG_PROJECT.md`
4. `PROJECT_MANIFEST.yaml`
5. `docs/operations/AGENT_MANAGER_CEREBRO_WORKFLOW.md`
6. `antigravity/prompts/16_AGENT_MANAGER_CEREBRO_OPERATING_SYSTEM.md`
7. `antigravity/prompts/17_FIRST_PROMPT_CONNECTED_STRATEGY.md`

## Que ya queda preparado

- Plan maestro completo de la plataforma.
- Mapa de frentes paralelos con dependencias, write scopes y criterio de salida.
- Sistema local de reanudacion si la maquina se apaga o la sesion se pierde.
- Prompt operativo comun para que todos los agentes trabajen como expertos en:
  - Connected Strategy / Wharton
  - Competitive advantage
  - Business model design
  - MITx MicroMasters in Data Science
  - Mejora de arquitectura, AI frontier y mejora continua
- Prompts listos por set de tareas para usar en agent manager.

## Convencion operativa

- Todo artefacto nuevo del proyecto debe vivir dentro de `C:\dev\Connected_Strategy`.
- El trabajo se coordina por sets. No mezclar write scopes entre agentes paralelos.
- El estado canonico para Antigravity/Cerebro ahora vive en la raiz:
  - `CURRENT_STATE.md`
  - `CURRENT_TASK.md`
  - `CHANGELOG_PROJECT.md`
  - `PROJECT_MANIFEST.yaml`
- Antes de arrancar cualquier set, leer siempre:
  - `prompts/shared/00_expert_operating_system.md`
  - `prompts/shared/01_resume_protocol.md`
  - `prompts/shared/02_definition_of_done.md`
  - `prompts/shared/03_codex_plan_or_execute_rule.md`

## Primer arranque recomendado

1. Ejecutar `prompts/task-sets/00_program_director.md`
2. Ejecutar `prompts/task-sets/01_workspace_bootstrap.md`
3. Lanzar en paralelo:
   - `prompts/task-sets/02_knowledge_and_domain.md`
   - `prompts/task-sets/03_analysis_orchestrator.md`
   - `prompts/task-sets/04_ui_workbench.md`
   - `prompts/task-sets/05_runtime_collision_launcher.md`
   - `prompts/task-sets/06_reporting_and_prompt_packets.md`
   - `prompts/task-sets/07_desktop_shell_icons_shortcuts.md`
4. Cerrar con `prompts/task-sets/08_integration_qa_release.md`

## Nota sobre project-state-rhythm

Ya existe una forma canonica alineada a `project-state-rhythm` y `agent-manager-cerebro`. Usa primero:

- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`
- `PROJECT_MANIFEST.yaml`
- `docs/operations/AGENT_MANAGER_CEREBRO_WORKFLOW.md`
- `docs/operations/PORT_REGISTRY_POLICY.md`
- `antigravity/prompts/16_AGENT_MANAGER_CEREBRO_OPERATING_SYSTEM.md`

La carpeta `state/` sigue existiendo como material previo, pero la entrada canonica para Antigravity ahora es el state pack de la raiz.

## Legacy pack

Si necesitas mirar el paquete previo, sigue disponible en:

- `docs/02_project_state_rhythm.md`
- `state/RESUME_INSTRUCTIONS.md`
- `state/CURRENT_STATE.md`
- `state/TASK_BOARD.json`
- `state/CHECKPOINT_LOG.md`
