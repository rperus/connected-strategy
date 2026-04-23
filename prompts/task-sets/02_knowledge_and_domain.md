# SET-02 Knowledge And Domain Engine

```
TITULO SUGERIDO: Chat 1
SLOT: Chat 1
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
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

Construir el cerebro estructural del producto: tipos, worksheets, formulas, scoring contracts y la capa de ingestion de conocimiento para Connected Strategy, competitive advantage, business model y MITx data science.

## Tu write scope exclusivo

- `packages/domain/`
- `packages/knowledge/`
- `data/`

## No-touch files

- `apps/`
- `packages/runtime/`
- `packages/reporting/`
- `packages/prompt-packets/`
- `packages/agents/`
- `config/port_registry.yaml`
- `ops/runtime/active_ports.json`
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## Debes construir

- tipos y schemas TypeScript para:
  - projects
  - worksheets
  - worksheet answers
  - strategic metrics
  - competitive landscape
  - business model profile
  - improvement proposals
  - evidence links
  - launch profiles
- motor de worksheets editable y versionable
- formulas y contratos de scoring transparentes para:
  - Connected Experience Score
  - Closed Loop Maturity
  - Switching Cost Index
  - WTP Uplift Index
  - Cost Reduction Potential
  - Competitive Positioning Index
  - Business Model Strength
  - Data Science Readiness
  - Architecture Resilience
  - Strategic Advantage Composite
- ingestion de conocimiento desde los archivos de Wharton y el primer acercamiento local
- estructuras para futuras fuentes como business plans

## Requisitos especiales

- Toda formula debe ser explicable y editable.
- El LLM no debe ser la fuente unica de los puntajes.
- Debes mapear todo a los loops `Sense/Transmit/Analyze/React/Repeat` y `Recognize/Request/Respond/Repeat`.
- Debes dejar pruebas de unidad para contratos y formulas clave.

## Entregables

- paquetes `domain` y `knowledge` funcionales
- fuentes locales indexables
- contratos listos para ser consumidos por analisis, UI y reportes
- handoff file actualizado

## Contrato de fin

Al terminar, escribe exactamente uno de:

```
LISTO
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

```
BLOQUEADO
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

```
CONTINUE
HANDOFF_FILE: ops/agent_handoffs/chat_1.md
```

No hagas preguntas al humano al final. Solo entrega el bloque de estado.
