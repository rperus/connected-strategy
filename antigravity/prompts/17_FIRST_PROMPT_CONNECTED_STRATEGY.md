---
type: prompt
---
Continue from the existing Connected_Strategy repo state; do not redesign the project from scratch.

Use `agent-manager-cerebro` and `project-state-rhythm` if they are available in your environment.

Read these files first:
- CURRENT_STATE.md
- CURRENT_TASK.md
- CHANGELOG_PROJECT.md
- PROJECT_MANIFEST.yaml
- docs/operations/AGENT_MANAGER_CEREBRO_WORKFLOW.md
- docs/operations/PORT_REGISTRY_POLICY.md
- antigravity/prompts/16_AGENT_MANAGER_CEREBRO_OPERATING_SYSTEM.md
- prompts/shared/00_expert_operating_system.md
- prompts/shared/01_resume_protocol.md
- prompts/shared/02_definition_of_done.md
- prompts/shared/03_codex_plan_or_execute_rule.md

Important constraints:
- this repo is the canonical workspace for the platform and all new artifacts must stay inside C:\dev\Connected_Strategy
- use one pinned coordinator chat called Cerebro plus at most three reusable worker slots
- do not make the human the message bus between workers
- prefer fixed ports, but never let a busy fixed port break the operator flow
- treat config/port_registry.yaml as the preferred fixed-port source of truth
- treat ops/runtime/active_ports.json as the live runtime source of truth
- launcher and portal code must read active_ports.json first and then fall back to port_registry.yaml
- if runtime resolves a different live port, update CURRENT_STATE.md and append a note to CHANGELOG_PROJECT.md
- do not hardcode ports in multiple places
- do not touch other projects directly unless the platform is explicitly preparing launch profiles or analysis inputs
- preserve write-set isolation across workers

Your first job is to become the coordinator and start the platform build safely.

Do this in order:
1. claim the coordinator role as Cerebro
2. update CURRENT_TASK.md with the exact first active slice
3. inspect the existing set prompts in prompts/task-sets/
4. decide whether they are already usable as-is or need light rewrites before dispatch
5. run Wave 0 and Wave 1 first:
   - SET-00 Program Director
   - SET-01 Workspace Bootstrap
6. only after SET-01 is complete, dispatch the first parallel implementation wave in safe batches across Chat 1, Chat 2, and Chat 3

The first parallel wave should ultimately cover:
- knowledge and domain
- analysis orchestrator
- UI workbench
- runtime collision launcher
- reporting and prompt packets
- desktop shell and shortcuts

When you dispatch workers:
- use the exact slot header format from the Cerebro operating system
- define write scope and no-touch files
- require slot handoff file updates
- forbid worker questions at the end

After every meaningful completed slice:
- update CURRENT_STATE.md
- update CURRENT_TASK.md
- append CHANGELOG_PROJECT.md
- update the relevant slot handoff file

For your first response, do not start coding. Act as Cerebro and output only the next operator action block needed to begin the workflow.
