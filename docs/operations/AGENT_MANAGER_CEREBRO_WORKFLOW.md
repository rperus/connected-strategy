# AGENT_MANAGER_CEREBRO_WORKFLOW

This file is the canonical Cerebro workflow for `Connected_Strategy`.

## Canonical read order for Cerebro

1. `CURRENT_STATE.md`
2. `CURRENT_TASK.md`
3. `CHANGELOG_PROJECT.md`
4. `PROJECT_MANIFEST.yaml`
5. `docs/operations/AGENT_MANAGER_CEREBRO_WORKFLOW.md`
6. `docs/operations/PORT_REGISTRY_POLICY.md`
7. `antigravity/prompts/16_AGENT_MANAGER_CEREBRO_OPERATING_SYSTEM.md`

## Coordinator model

- one pinned coordinator: `Cerebro`
- at most three reusable worker slots:
  - `Chat 1`
  - `Chat 2`
  - `Chat 3`

The human should only:

- open slots when Cerebro says so
- write `listo` to Cerebro when a worker stops
- write `continue` only when Cerebro explicitly says so

## Canonical worker handoff files

- `ops/agent_handoffs/chat_1.md`
- `ops/agent_handoffs/chat_2.md`
- `ops/agent_handoffs/chat_3.md`

## Default first wave

### Wave 0

- Cerebro reads the state pack and operating docs.
- Cerebro takes ownership of `CURRENT_TASK.md`.
- Cerebro decides whether to keep or revise the earlier set prompts under `prompts/task-sets/`.

### Wave 1

Run serially first:

1. `SET-00 Program Director`
2. `SET-01 Workspace Bootstrap`

### Wave 2

Only after `SET-01` is complete, dispatch in parallel:

1. `SET-02 Knowledge and Domain`
2. `SET-03 Analysis Orchestrator`
3. `SET-04 UI Workbench`
4. `SET-05 Runtime Collision Launcher`
5. `SET-06 Reporting and Prompt Packets`
6. `SET-07 Desktop Shell, Icons and Shortcuts`

Use only up to 3 worker slots at a time. If more than 3 tasks are ready, batch them.

## Port policy for all workers

Every worker that touches runtime, launcher, routes, dev scripts, configs, or operator docs must obey:

- `config/port_registry.yaml` is the preferred fixed-port source of truth.
- `ops/runtime/active_ports.json` is the live override source of truth.
- launcher and portal code must read `active_ports.json` first, then fall back to `port_registry.yaml`.
- if a fixed port is busy, write the resolved live port to `active_ports.json`.
- if a live port changes, update `CURRENT_STATE.md` and append a note to `CHANGELOG_PROJECT.md`.

## Worker prompt header contract

Every worker prompt must begin with:

```text
TITULO SUGERIDO: Chat 1
SLOT: Chat 1
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
MODO: worker
```

Change only the slot number and handoff path.

## Worker end state contract

Workers must end with exactly one of:

```text
LISTO
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

```text
BLOQUEADO
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

```text
CONTINUE
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

## No-touch policy

Do not let two implementation workers touch the same high-risk surface at the same time. For this repo, high-risk shared surfaces include:

- root state pack files
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- shared route registration
- any root workspace config

If overlap exists, serialize or move integration to the closing wave.
