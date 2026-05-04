# V3 MASTER PLAN — "Mega-Professional" Connected Strategy Analyzer

**Autor:** Claude Sonnet 4.6 (planificación) → ejecutado por Antigravity con Opus 4.7
**Fecha:** 2026-05-02
**Status:** PLAN — sin código, solo diseño y prompts ejecutables.

---

## 0. POR QUÉ V3 (no implementar nada todavía — leer completo primero)

La auditoría profunda de v2 (ver §10 al final) reveló que la implementación actual:

1. **Inventa worksheets propios** que NO mapean 1-a-1 con las 11 worksheets reales de Wharton (que el usuario tiene en `docs/Varios/Wharton/`).
2. **Pretende usar modelos Gemini diferenciados** pero los 7 especialistas terminan corriendo todos en `gemini-2.5-flash`.
3. **No tiene memoria entre corridas** — `cachedDeepResults` vive en RAM, se pierde al reiniciar el servidor; las respuestas de worksheets generadas por LLM no se persisten en SQLite.
4. **Frontera eficiente es retórica, no matemática** — el campo `frontierOpportunity` es texto libre que la LLM inventa sin un modelo cuantitativo de WTP/Cost.
5. **Sintetizador está hambriento** — recibe sólo *resúmenes* (scores, conteos, primeros 200 chars de narrativas), nunca lee código real ni respuestas crudas de worksheets.
6. **Sample bias en el código** — sólo 5-8 archivos con regex `route|model|service|main|index` se mandan a la LLM; código real de seguridad/ML/analytics nunca llega.
7. **Ventaja competitiva sostenible "más allá de la frontera"** se delega 100% a Gemini sin restricciones — no hay test de "imitabilidad", no hay activity-system mapping real.
8. **Output para Antigravity es prosa** — un blob de markdown sin manifest de archivos, sin tests de aceptación, sin estructura.

V3 ataca exactamente estos 8 huecos sin romper v2 (ambos coexisten).

---

## 1. PRINCIPIOS DE DISEÑO V3

| # | Principio | Concreto |
|---|-----------|----------|
| 1 | **Wharton 1-a-1** | Las 11 worksheets V3 reproducen las estructuras reales (matrices, columnas, scoring ++/+/-/--) |
| 2 | **Aditivo, no destructivo** | v2 (`run-deep`) y v1 (`run-full`) intactos. V3 monta `POST /api/pipeline/run-v3` |
| 3 | **Single source of truth** | Worksheets viven en `@cs/domain` (canonical IDs) — agentes leen y escriben ahí |
| 4 | **Memoria persistente por proyecto** | `data/projects/<id>/` con `state.json`, `history.jsonl`, `context.md`, `citations.jsonl` |
| 5 | **Modelos Gemini reales por tarea** | flash para enumeración, pro para razonamiento, 2.0-flash+search para investigación |
| 6 | **Frontera cuantitativa** | WTP y Cost como vectores numéricos; Pareto-dominancia detecta white-space |
| 7 | **Citation-first** | Toda afirmación sobre competidores requiere URL en `groundingMetadata` o se descarta |
| 8 | **Tool-use para sintetizador** | El chief-strategist puede pedir lecturas adicionales de archivos durante razonamiento |
| 9 | **Validación zod** | Toda respuesta JSON de LLM pasa por schema antes de consumirse |
| 10 | **Antigravity handoff estructurado** | 3 artefactos: `manifest.json` (archivos), `acceptance-tests.md` (criterios), `strategy.md` (narrativa) |

---

## 2. ARQUITECTURA V3 (mapa completo)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  POST /api/pipeline/run-v3                                                 │
│  (apps/server/src/modules/pipeline/v3-route.ts — NUEVO)                    │
└─────────────────┬──────────────────────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  ProjectStateStore  │  (data/projects/<id>/state.json)
        │  (load + lock)      │  ← lee snapshot previo, prepara nueva corrida
        └────────┬────────────┘
                 │
                 ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE A — DISCOVERY (paralelo, 30-60s)            │
        │  ─────────────────────────────────────────────     │
        │  • code-cartographer       (AST + tree-sitter)     │
        │  • repo-history-scanner    (git log, churn)        │
        │  • dependency-grapher      (package graph)         │
        │  Output → state.json:discovery                     │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE B — WHARTON CONNECTED STRATEGY (paralelo)   │
        │  ─────────────────────────────────────────────     │
        │  • customer-journey-mapper     (WS01+WS02)  pro    │
        │  • info-flow-analyzer          (WS03)       flash  │
        │  • deeper-needs-laddering      (WS04+WS06)  pro    │
        │  • connected-experience-matrix (WS05+WS07+  pro    │
        │                                 WS08)              │
        │  • tech-stack-mapper           (WS09+WS10+  flash  │
        │                                 WS11)              │
        │  • revenue-model-architect     (delivery)   pro    │
        │  Output → state.json:wharton + DB worksheets       │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE C — COMPETITIVE ADVANTAGE (paralelo)        │
        │  ─────────────────────────────────────────────     │
        │  • industry-structure-analyst  (5F+scenarios)      │
        │    [gemini-2.0-flash + Google Search]              │
        │  • competitor-intelligence     (deep research)     │
        │    [gemini-2.0-flash + Google Search + cite]       │
        │  • wtp-cost-driver-scorer      (++/+/-/--)  pro    │
        │  • activity-system-mapper      (interdep)   pro    │
        │  Output → state.json:competitive                   │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE D — CODE QUALITY SWARM (paralelo)           │
        │  ─────────────────────────────────────────────     │
        │  • db-architect          gemini-2.5-pro            │
        │  • security-auditor      gemini-2.5-pro            │
        │  • api-design-critic     gemini-2.5-flash          │
        │  • performance-engineer  gemini-2.5-flash          │
        │  • ml-readiness          gemini-2.5-flash          │
        │  • frontend-perf         gemini-2.5-flash          │
        │  • observability         gemini-2.5-flash          │
        │  (todos con AST-driven file selection, no regex)   │
        │  Output → state.json:swarm                         │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE E — FRONTIER MATH (determinístico)          │
        │  ─────────────────────────────────────────────     │
        │  • Construye vectores WTP_proyecto, WTP_competidor │
        │  • Calcula Pareto frontier en (WTP, Cost)          │
        │  • Identifica puntos dominados / dominantes        │
        │  • Genera "above-frontier moves" con score formal  │
        │  Output → state.json:frontier                      │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE F — CHIEF STRATEGIST (gemini-2.5-pro+TOOL)  │
        │  ─────────────────────────────────────────────     │
        │  • Recibe TODOS los outputs de A-E                 │
        │  • Tool-use: puede pedir read_file(path,lines) y   │
        │    grep(pattern) para investigación dirigida       │
        │  • Produce Strategy Audit (5 preguntas Wharton)    │
        │  • Three Fits assessment (Internal/External/Dyn)   │
        │  • Top-N priorities con justificación cruzada      │
        │  • Activity System diagram (mermaid)               │
        │  Output → state.json:synthesis                     │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  PHASE G — ANTIGRAVITY HANDOFF (determinístico)    │
        │  ─────────────────────────────────────────────     │
        │  Por cada priority del top-N, genera:              │
        │  • manifest.json   — archivos exactos a editar     │
        │  • acceptance-tests.md — criterios verificables    │
        │  • strategy.md     — el "por qué" estratégico      │
        │  • prompt.md       — texto listo para pegar        │
        │  Carpeta: data/projects/<id>/antigravity/<n>/      │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────────────┐
        │  HISTORY APPEND                                    │
        │  Append a data/projects/<id>/history.jsonl         │
        │  con run_id, timestamps, deltas vs corrida previa  │
        └────────────────────────────────────────────────────┘
```

---

## 3. EL MAPEO WHARTON 1-A-1 (lo más importante)

| WS | Wharton (real) | Estructura | Agente V3 | Modelo | Output |
|----|----------------|------------|-----------|--------|--------|
| WS01 | Map Current Customer Journey | Swimlane × 8 stages × 3 column groups | `customer-journey-mapper` | gemini-2.5-pro | `journeyStages[8]` con `latentNeed`, `awareness`, `search`, `decide`, `orderPay`, `receive`, `experience`, `postPurchase` |
| WS02 | WTP Drivers + Pain Points | Por stage | `customer-journey-mapper` | gemini-2.5-pro | Para cada stage: `painPoints[]`, `wtpDrivers[]` con score relativo a 2-3 competidores (++ a --) |
| WS03 | Information Flow | 6 atributos × 8 stages | `info-flow-analyzer` | gemini-2.5-flash | Grid `[stage][attribute]` con `description`, `trigger`, `frequency`, `richness`, `customerEffort`, `inference`, `improvementIdea` |
| WS04 | Why-How Ladder | Vertical, multi-rung | `deeper-needs-laddering` | gemini-2.5-pro | `ladder[]` con `level`, `purpose`, `whyUp`, `howDown`. Top = "deeper purpose" |
| WS05 | Response × Stage Matrix | 4 modes × 8 stages | `connected-experience-matrix` | gemini-2.5-pro | `[mode][stage]` con `response`, `requiredInfo` para cada cell |
| WS06 | Repeat Levels Learning | 5 categories × 4 experiences | `deeper-needs-laddering` | gemini-2.5-pro | `[category][exp_n]` + `currentRepeatLevel: 1|2|3|4` (Unified/Customization/MetaData/TrustedPartner) |
| WS07 | Connected Strategy Matrix - Existing | 4 modes × 5 architectures | `connected-experience-matrix` | gemini-2.5-pro | `[mode][architecture]` con `currentActivities`, `competitorActivities`, `whitespace: bool` |
| WS08 | Connected Strategy Matrix - New Ideas | 4 modes × 5 architectures (white-space focus) | `connected-experience-matrix` | gemini-2.5-pro | `newIdeas[]` con `cell`, `description`, `businessModel`, `requiredConnections`, `feasibility` |
| WS09 | Sub-functions Grid | 4 STAR × 9 sub-functions | `tech-stack-mapper` | gemini-2.5-flash | `[star][subfn]` con `currentSubfunction` |
| WS10 | Tech Solutions per Sub-function | Misma grid | `tech-stack-mapper` | gemini-2.5-flash | `[star][subfn]` con `currentTech`, `selectionScores: {convenience, safety, cost}` |
| WS11 | Emerging Tech | Misma grid | `tech-stack-mapper` | gemini-2.5-flash | `[star][subfn]` con `emergingTech[]`, `unlocks[]` |

**Las 5 architectures (columnas WS07/WS08):** Connected Producer, Connected Retailer, Market Maker, Crowd Orchestrator, P2P Network Creator.

**Los 4 modes (filas WS05/WS07/WS08):** Respond-to-Desire, Curated Offering, Coach Behavior, Automatic Execution.

**Los 9 sub-functions (columnas WS09/WS10/WS11):** Become aware of need, Search/decide on option, Order, Pay, Receive, Experience, After-sale improve, Learn/connect, Monetize.

---

## 4. LADO COMPETITIVE ADVANTAGE (paralelo a Connected Strategy)

| Componente Wharton | Agente V3 | Modelo | Output estructurado |
|---------------------|-----------|--------|---------------------|
| 5 Forces | `industry-structure-analyst` | gemini-2.0-flash + Google Search | `forces: { customers, suppliers, rivalry, entrants, substitutes }` cada uno con `attractiveness: 1-5`, `drivers[]`, `evidence[]` (URLs) |
| Scenarios 2×2 | `industry-structure-analyst` | gemini-2.0-flash + Search | `uncertainties[2]`, `scenarios[4]` con `name`, `narrative`, `strategicImplication` |
| Competitor profiles | `competitor-intelligence` | gemini-2.0-flash + Search | `competitors[]` con `name`, `url`, `pricing`, `wtpScores`, `costScores`, `recentMoves[]` con `date` y `sourceUrl` |
| WTP Drivers ++/+/-/-- | `wtp-cost-driver-scorer` | gemini-2.5-pro | `wtpDrivers[]` con `name`, `weight`, `selfScore`, `competitorScores[]` (numérico: ++=2, +=1, -=-1, --=-2) |
| Cost Drivers ++/+/-/-- | `wtp-cost-driver-scorer` | gemini-2.5-pro | Mismo formato pero invertido (más bajo = mejor) |
| Activity System Map | `activity-system-mapper` | gemini-2.5-pro | `coreChoices[]` (centralidad alta), `supportingActivities[]`, `connections[][]` (matriz de refuerzo), `oeVsSp[]` (Operational Effectiveness vs Strategic Positioning por activity), `mermaid: string` |
| Three Fits | `chief-strategist` (Phase F) | gemini-2.5-pro | `internalFit`, `externalFit`, `dynamicFit` cada uno con score 0-100 + justificación + gaps |

---

## 5. FRONTERA EFICIENTE — MODELO CUANTITATIVO REAL

**Reemplaza el campo `frontierOpportunity: string` libre por matemática verificable.**

### 5.1 Vector positioning

Para cada entidad (proyecto + N competidores):
```
WTP_vector  = [score_driver_1, score_driver_2, ..., score_driver_K]   ∈ ℝ^K, valores en {-2,-1,0,1,2}
Cost_vector = [score_driver_1, score_driver_2, ..., score_driver_M]   ∈ ℝ^M, valores en {-2,-1,0,1,2}

WTP_aggregate  = Σ (weight_i × WTP_vector[i])     // weight aprendido por segmento
Cost_aggregate = Σ (weight_j × Cost_vector[j])    // invertido: mayor = peor
```

### 5.2 Pareto frontier

Plot todos los puntos (WTP_aggregate, -Cost_aggregate) en 2D.
La **frontera eficiente** es el conjunto de puntos no dominados:

> Punto A domina B si `A.WTP ≥ B.WTP` y `A.Cost ≤ B.Cost`, con al menos una desigualdad estricta.

### 5.3 Three positions

| Posición | Definición matemática | Recomendación |
|----------|----------------------|---------------|
| Below | Existe ≥1 competidor que domina al proyecto | Adoptar best practices (cerrar gaps) |
| On | Es Pareto-optimal pero hay otros también | Reforzar trade-offs propios; comunicar diferenciación |
| Above | Domina a todos los competidores | Rara vez ocurre sin connected strategy — verificar imitabilidad |

### 5.4 "Beyond the frontier" — el santo grial

Un movimiento candidato **m** mueve al proyecto a `(WTP', Cost')`. Es "beyond the frontier" si:
1. `(WTP', Cost')` **no es dominado** por ningún competidor actual.
2. Mejora **ambos** ejes simultáneamente (`WTP' > WTP` Y `Cost' < Cost`) — rompe el trade-off natural.
3. Pasa el **test de imitabilidad de 70%** (Wharton): si un competidor copia el 70% de actividades requeridas, ¿obtiene <70% del beneficio? Calculado vía interdependencia del activity-system map.

El agente `wtp-cost-driver-scorer` produce esta tupla; el `chief-strategist` la valida con tool-use sobre el activity-system map.

### 5.5 Output del frontier engine

```typescript
{
  frontier: {
    points: [
      { entity: 'self', wtp: 7.2, cost: -3.4, dominated_by: [] },
      { entity: 'competitor_a', wtp: 8.1, cost: -2.0, dominated_by: ['competitor_b'] },
      ...
    ],
    paretoFront: ['self', 'competitor_b'],   // los no dominados
    selfPosition: 'on' | 'below' | 'above',
    candidateMoves: [
      {
        name: 'Add coach-behavior layer to onboarding',
        projected: { wtp: 8.5, cost: -3.1 },
        breaksTradeOffs: true,
        dominatesAll: false,
        imitabilityScore: 0.78,    // 0-1, alto = difícil copiar (frontera duradera)
        requiredActivities: ['ws05_coach_layer', 'ws07_p2p_network'],
        antigravityPromptRef: 'data/projects/<id>/antigravity/move-1/'
      }
    ]
  }
}
```

---

## 6. PERSISTENT PROJECT MEMORY

Estructura de archivos por proyecto:

```
data/projects/<projectId>/
├── state.json              ← snapshot canónico (siempre el último)
├── history.jsonl           ← append-only (1 línea por corrida con run_id, timestamp, deltas)
├── context.md              ← user-supplied free-text context (NL updates acumulados)
├── citations.jsonl         ← toda evidencia con URL (competidores, mercado, regulación)
├── llm-cache/              ← cache de respuestas LLM con hash(prompt)
│   └── <hash>.json
└── antigravity/
    ├── move-1/
    │   ├── manifest.json   ← { filesToEdit, filesToCreate, filesToDelete }
    │   ├── acceptance-tests.md
    │   ├── strategy.md     ← por qué esta priority
    │   └── prompt.md       ← texto listo para pegar en Antigravity
    ├── move-2/...
    └── INDEX.md            ← índice de todos los moves generados
```

**state.json schema (resumido):**

```typescript
{
  schemaVersion: '3.0.0',
  projectId: string,
  lastRunId: string,
  lastRunAt: ISO8601,
  discovery: { /* Phase A output */ },
  wharton: {
    ws01_journey: {...}, ws02_wtp_pain: {...}, ws03_info_flow: {...},
    ws04_ladder: {...},  ws05_response: {...}, ws06_repeat: {...},
    ws07_existing: {...}, ws08_new_ideas: {...},
    ws09_subfns: {...}, ws10_tech: {...}, ws11_emerging: {...},
  },
  competitive: {
    fiveForces: {...}, scenarios: {...}, competitors: [...],
    wtpDrivers: [...], costDrivers: [...], activitySystem: {...}
  },
  swarm: { /* 7 specialists' findings */ },
  frontier: { /* §5 output */ },
  synthesis: {
    threeFits: {...},
    strategyAuditAnswers: {...},   // 5 preguntas Wharton
    topPriorities: [...],
    healthScore: { value: 72, ci: [64, 80] },
    executiveSummary: string
  },
  userContext: {
    naturalLanguageUpdates: [{ at, message, appliedChanges: [...] }],
    dismissedPriorities: [string],
    completedPriorities: [string]
  }
}
```

---

## 7. CHIEF STRATEGIST CON TOOL-USE

**Modelo:** `gemini-2.5-pro` con `thinkingBudget: 16000` (verificar API SDK soporta `thinkingConfig`).

**Tools expuestas al sintetizador:**

```typescript
const tools = [
  {
    name: 'read_file',
    description: 'Read N lines of a project file starting at offset',
    parameters: { path: string, offset?: number, limit?: number }
  },
  {
    name: 'grep_repo',
    description: 'Search for regex pattern in project',
    parameters: { pattern: string, glob?: string, max_results?: number }
  },
  {
    name: 'read_worksheet_answer',
    description: 'Read raw user answer for a specific worksheet question',
    parameters: { worksheetId: string, questionId: string }
  },
  {
    name: 'compare_to_history',
    description: 'Get prior synthesis for the same project',
    parameters: { fields?: string[] }
  }
];
```

**Bucle de razonamiento (en código orquestador):**

```
1. Build initial prompt: 5 audit questions + Three Fits checklist + all upstream summaries
2. Call gemini-2.5-pro with tools enabled
3. While response.functionCalls exist:
     - Execute each tool call
     - Append result to conversation
     - Re-call gemini
4. Validate final JSON with zod schema
5. If validation fails: re-prompt with diff (≤3 retries)
```

Este patrón — agentic loop con tools — es lo que hace que el sintetizador deje de ser "ciego con resúmenes" y empiece a investigar como un consultor humano.

---

## 8. ANTIGRAVITY HANDOFF FORMAT

Por cada `priority` del top-N (default N=5), Phase G genera:

### `data/projects/<id>/antigravity/move-N/manifest.json`
```json
{
  "moveId": "move-1",
  "title": "Implement habit formation via daily streak system",
  "wharton_basis": ["WS04_repeat_level", "WS06_customization", "WS03_switching_cost:habit"],
  "frontier_impact": { "wtp_delta": 1.2, "cost_delta": -0.3 },
  "files_to_create": [
    { "path": "packages/domain/src/streaks.ts", "purpose": "Streak calculation logic" }
  ],
  "files_to_edit": [
    { "path": "apps/web/src/pages/Dashboard.tsx", "lines": "120-145", "change": "Add StreakCard component" }
  ],
  "files_to_delete": [],
  "dependencies_to_add": ["date-fns@^3.0"],
  "estimated_loc": 350,
  "estimated_hours": 6
}
```

### `data/projects/<id>/antigravity/move-N/acceptance-tests.md`
```markdown
# Acceptance Tests — Move 1

## Functional
- [ ] User opens dashboard → ve "🔥 Day N streak" card
- [ ] User completes daily action → streak count incrementa
- [ ] User skips a day → streak resets a 1
- [ ] Streak ≥ 7 → desbloquea badge "Week Warrior"

## Code Quality
- [ ] `pnpm --filter @cs/domain test` passes
- [ ] `pnpm --filter @cs/web build` clean
- [ ] No new lint errors
- [ ] StreakCard tiene unit tests con ≥80% branch coverage

## Strategic (validable manualmente)
- [ ] WS06 repeat_level del proyecto sube de N1 a ≥N2
- [ ] sci_habit_formation score sube ≥20 puntos
```

### `data/projects/<id>/antigravity/move-N/strategy.md`
```markdown
# Why This Move — Strategic Rationale

**Wharton anchor:** WS04 Why-How Ladder + WS06 Repeat Level

Currently the project sits at Repeat Level 1 (Unified Experience). The why-how
ladder shows the deeper purpose is "ayudar al usuario a construir hábitos
sostenibles," but the codebase has no mechanism to reward consistency.

Adding a streak system moves the platform to Repeat Level 2 (Improved
Customization) and creates a switching-cost moat (sci_habit_formation):
breaking a 47-day streak is a real psychological cost that competitors cannot
replicate without their own equivalent system.

**Frontier impact:** WTP +1.2 (engagement), Cost -0.3 (lower CAC via retention).
**Imitability score:** 0.61 — moderate. Competitors can copy the mechanic;
they cannot copy the accumulated streak data of *your* users (data lock-in).
```

### `data/projects/<id>/antigravity/move-N/prompt.md`
```markdown
# Antigravity Worker Prompt — Move 1

You are implementing Move 1 of the Connected Strategy improvement plan for
project XYZ.

**Read first (in order):**
1. data/projects/<id>/antigravity/move-1/strategy.md  ← context
2. data/projects/<id>/antigravity/move-1/manifest.json ← exact files
3. data/projects/<id>/antigravity/move-1/acceptance-tests.md ← criteria

**Workflow:**
1. Make all file changes per manifest.json (preserve unrelated code)
2. Run acceptance tests; iterate until all pass
3. Commit with message: "feat: Move 1 — daily streak system (WS06 L2)"
4. Update data/projects/<id>/state.json:userContext.completedPriorities += ['move-1']
5. STOP and report back
```

---

## 9. EXECUTION PLAN — 6 PHASES PARA ANTIGRAVITY

Antigravity (Opus 4.7) ejecuta estas fases secuencialmente. Cada una tiene su SET prompt en `prompts/task-sets/`. El `V3-CEREBRO_BOOTSTRAP.md` es la entrada continua que decide qué fase corre.

| Phase | SET file | Output | Verificación |
|-------|----------|--------|--------------|
| 1 | `V3-PHASE-01_unify_worksheets.md` | Unified worksheet schema en `@cs/domain` | TS build limpio, IDs canónicos en uso |
| 2 | `V3-PHASE-02_persistent_memory.md` | `ProjectStateStore` + filesystem layout | `data/projects/<test>/state.json` legible |
| 3 | `V3-PHASE-03_wharton_agents.md` | 6 agentes Wharton + 7 swarm code agents | Cada agente devuelve JSON válido por zod |
| 4 | `V3-PHASE-04_quantitative_frontier.md` | Frontier math engine | Test unit: detecta dominancia correcta en fixture |
| 5 | `V3-PHASE-05_chief_strategist.md` | Sintetizador con tool-use loop | Genera Strategy Audit completo en fixture |
| 6 | `V3-PHASE-06_handoff_packaging.md` | Phase G generator + carpeta `antigravity/` | Por cada priority crea 4 archivos |
| 7 | `V3-PHASE-07_route_and_ui.md` | `POST /api/pipeline/run-v3` + UI page | curl al endpoint devuelve runId |

---

## 10. AUDIT FINDINGS (resumen de lo que está mal en v2 — referencia)

(Detalles completos en el handoff del agente auditor; resumen accionable aquí.)

| Área | Problema v2 | Fix v3 |
|------|-------------|--------|
| Worksheets | IDs inventados, sólo 4-5 q por WS, regex permisivos | Schema canónico de `@cs/domain` con estructura Wharton real |
| Modelos | Todos los swarm en `gemini-2.5-flash` pese a docs | Tabla §2: pro para razonamiento, flash para enumeración, 2.0+search para investigación |
| Memoria | `cachedDeepResults` en RAM | `data/projects/<id>/state.json` + history.jsonl |
| Frontera | `frontierOpportunity: string` libre | Vectores numéricos + Pareto + test de imitabilidad |
| Sintetizador | Recibe sólo summaries de 200 chars | Tool-use con `read_file`, `grep_repo`, `read_worksheet_answer` |
| Code sample | 5-8 archivos con regex `route|model|service` | AST-driven file selection (tree-sitter / ts-morph) |
| LLM corrections | Aplicadas sin validar tipos | zod schemas obligatorios |
| Severity | Texto del modelo, sin calibrar | Rúbrica explícita en system prompt + cross-check |
| Handoff | Markdown blob | 4 artefactos: manifest.json + tests + strategy + prompt |
| Citations | `groundingMetadata` ignorado | Todas las afirmaciones de competidores requieren URL |
| Concurrencia | `_CS_FORCE_OFFLINE` mutando process.env globalmente | Context object pasado por argumento, no env |
| Cost control | Sin métrica de tokens | Token counter por corrida + dry-run estimator |

---

## 11. NO-TOUCH LIST (no romper nada existente)

- ❌ NO modificar `apps/server/src/modules/pipeline/routes.ts` (run-full)
- ❌ NO modificar `apps/server/src/modules/pipeline/deep-route.ts` (run-deep v2)
- ❌ NO modificar `packages/agents/src/registry.ts` AGENT_REGISTRY (v1)
- ❌ NO modificar `packages/agents/src/types.ts` salvo extender unions (additive)
- ❌ NO renombrar IDs canónicos de `packages/domain/src/worksheets.ts` ya en uso por v1 analysts
- ✅ SÍ se puede crear `packages/agents/src/v3/` carpeta nueva con todos los agentes v3
- ✅ SÍ se puede crear `apps/server/src/modules/pipeline/v3-route.ts`
- ✅ SÍ se puede crear `data/projects/` (carpeta nueva)
- ✅ SÍ se puede agregar columnas/tablas nuevas a SQLite (no DROP existentes)

---

## 12. SUCCESS CRITERIA (cuándo está hecho v3)

1. ✅ `POST /api/pipeline/run-v3` corre completo en proyecto fixture sin errores
2. ✅ `data/projects/<test>/state.json` contiene los 7 phases poblados
3. ✅ El JSON de WS01 tiene exactamente 8 stages con 3 column groups
4. ✅ El JSON de WS07 tiene matrix 4×5 con celdas marcadas como whitespace
5. ✅ `frontier.candidateMoves[]` contiene ≥1 move con `imitabilityScore > 0.6`
6. ✅ `data/projects/<test>/antigravity/` contiene ≥3 carpetas move-N con 4 archivos cada una
7. ✅ Health score reporta `value` Y `ci` (intervalo de confianza)
8. ✅ Toda mención de competidor en `synthesis` tiene URL en `citations.jsonl`
9. ✅ v1 (`run-full`) y v2 (`run-deep`) siguen funcionando exactamente igual
10. ✅ Tests unitarios: ≥80% para frontier engine, ≥60% para state store

---

## 13. RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|-----------|
| Gemini SDK no soporta `thinkingConfig` para 2.5-pro | Fallback a temperature=0.2 + max_tokens=24k; documentar en código |
| Tool-use loop infinito (sintetizador pide reads sin parar) | Cap de 12 tool calls por sesión; hard timeout 5min |
| Costo Gemini explota | Token counter por corrida; alerta si >$2; modo dry-run |
| Schema zod cambia y rompe historial | Schema versionado en `state.json:schemaVersion`; migrators idempotentes |
| Antigravity "se pierde" entre fases | Cerebro lee `state/V3_CHECKPOINT.md` en cada arranque y resume desde último ✅ |
| Frontera matemática produce empates falsos | Tie-break por `recencyOfData`; documentar limitación |
| Tree-sitter / ts-morph añade peso al bundle | Sólo en `@cs/agents` (server-side), no se exporta al frontend |

---

## REFERENCIAS

- Wharton Connected Strategy: Terwiesch & Siggelkow (libro + curso online).
- Material en `docs/Varios/Wharton/`:
  - `Conected Strategy/All WorkSheets Sunking 1-6.pdf` — ejemplo lleno (Sun King)
  - `Conected Strategy/Worksheet 7-11 en BLanco.pdf` — templates limpias
  - `Conected Strategy/Connected Strategy PPT.pdf` — slides marco
  - `Resumen Business Strategy_ COmpetitive Advantage.pdf` — 141 pp competitive advantage
  - `Mapipng activity System.pdf` — template activity system
- Audit completo de v2: ver chat (no archivado en disco).

---

**FIN DEL PLAN MAESTRO V3.**

Próximo paso para Antigravity: leer `prompts/task-sets/V3-CEREBRO_BOOTSTRAP.md`.
