# PORT_REGISTRY_POLICY

This file defines how ports must work across all portals, launchers, services, and tools in `Connected_Strategy`.

## Goal

Keep ports stable when possible, but never let a busy fixed port break the operator workflow.

## Source of truth hierarchy

### 1. Preferred fixed ports

The preferred fixed ports live in:

- `config/port_registry.yaml`

These are the canonical desired ports for:

- Connected_Strategy web
- Connected_Strategy API
- Connected_Strategy local tooling
- any discovered project once a stable preferred port is assigned

### 2. Live resolved ports

The live runtime truth lives in:

- `ops/runtime/active_ports.json`

This file must contain the actual port in use when:

- the preferred fixed port is free and used as-is
- the preferred fixed port is busy and a fallback port was allocated

## Required application behavior

Any launcher, portal card, local runtime session, or helper that needs a port must:

1. read `ops/runtime/active_ports.json` first
2. if no live override exists, read `config/port_registry.yaml`
3. if neither contains an entry, request discovery or assign a new fixed-preferred entry and record it

## Change protocol

If runtime had to choose a different port because the fixed one was busy:

1. write the live value to `ops/runtime/active_ports.json`
2. update `CURRENT_STATE.md`
3. append a short note to `CHANGELOG_PROJECT.md`
4. keep `config/port_registry.yaml` unchanged unless the team decides to permanently adopt the new port

## Fixed port principle

Use fixed ports whenever practical because they reduce operator confusion.

But never hardcode ports in multiple places.

The only allowed places for canonical port truth are:

- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`

Every other file should read from those sources or from a generated runtime layer that reads them.
