---
type: prompt
---
# V3 PHASE 01 — Unify Worksheet Schema (Wharton 1-a-1)

**Goal:** Reemplazar las definiciones inventadas de v2 con un schema canónico que mapea
1-a-1 con las 11 worksheets reales de Wharton, manteniendo backward-compat con los IDs
ya en uso por v1 analysts.

**Modelo:** Opus 4.7
**Estimado:** 60-90 min
**Pre-requisitos:** ninguno (primera fase)

---

## CONTEXTO (lee antes de actuar)

- `state/V3_MASTER_PLAN.md` §3 — el mapeo Wharton 1-a-1
- `packages/domain/src/worksheets.ts` — schema v1 actual (NO romper IDs en uso)
- `packages/agents/src/worksheets/definitions.ts` — schema v2 inventado (lo vas a reemplazar/migrar)
- `packages/agents/src/agents/connected-strategy-analyst.ts` — usa IDs v1, no se debe romper

PDFs Wharton (referencia):
- `docs/Varios/Wharton/Conected Strategy/All WorkSheets Sunking 1-6.pdf` (ejemplo lleno)
- `docs/Varios/Wharton/Conected Strategy/Worksheet 7-11 en BLanco.pdf`
- `docs/Varios/Wharton/Resumen Business Strategy_ COmpetitive Advantage.pdf`

---

## TAREAS

### 1.1 Crear el módulo v3 worksheet schema

Archivo nuevo: `packages/domain/src/v3/worksheets-canonical.ts`

Define interfaces TypeScript que reflejan la estructura REAL de Wharton (no Q&A
con scoringWeight como v2). Cada worksheet es una **estructura tipada distinta** que
se rellena con análisis estructurado.

```typescript
// Pseudocódigo — implementa con tus tipos exactos

export const JOURNEY_STAGES = [
  'latent_need',
  'awareness',
  'search',
  'decide',
  'order_pay',
  'receive',
  'experience',
  'post_purchase',
] as const;
export type JourneyStage = typeof JOURNEY_STAGES[number];

export const CONNECTED_MODES = [
  'respond_to_desire',
  'curated_offering',
  'coach_behavior',
  'automatic_execution',
] as const;
export type ConnectedMode = typeof CONNECTED_MODES[number];

export const CONNECTION_ARCHITECTURES = [
  'connected_producer',
  'connected_retailer',
  'market_maker',
  'crowd_orchestrator',
  'p2p_network_creator',
] as const;
export type ConnectionArchitecture = typeof CONNECTION_ARCHITECTURES[number];

export const STAR_DIMENSIONS = ['sense', 'transmit', 'analyze', 'react'] as const;
export type StarDimension = typeof STAR_DIMENSIONS[number];

export const SUBFUNCTIONS_4R9 = [
  // Recognize
  'become_aware',
  // Request
  'search_decide',
  'order',
  'pay',
  // Respond
  'receive',
  'experience',
  'after_sale',
  // Repeat
  'learn_connect',
  'monetize',
] as const;
export type Subfunction = typeof SUBFUNCTIONS_4R9[number];

// ─── WS01 + WS02 — Customer Journey + WTP/Pain ──────────────────────────────
export interface WS01_JourneyMap {
  scope: { customerSegment: string; useCase: string };
  stages: Record<JourneyStage, {
    underlyingNeed: string;
    customerActions: string[];
    decisionFactors: string[];
    touchpoints: string[];
    painPoints: string[];                     // ← WS02
    wtpDrivers: Array<{                       // ← WS02
      name: string;
      relativeScore: '++' | '+' | '0' | '-' | '--';   // vs competitor baseline
      competitorScores: Record<string, '++' | '+' | '0' | '-' | '--'>;
    }>;
  }>;
}

// ─── WS03 — Information Flow ─────────────────────────────────────────────────
export interface WS03_InfoFlow {
  grid: Record<JourneyStage, {
    description: string;
    trigger: string;
    frequency: 'event' | 'continuous' | 'periodic' | 'on_demand' | 'none';
    richness: 'low' | 'medium' | 'high';
    customerEffort: 'low' | 'medium' | 'high';
    inferenceParty: 'customer' | 'firm' | 'algorithm' | 'shared';
    improvementIdea: string;
  }>;
}

// ─── WS04 — Why-How Ladder ───────────────────────────────────────────────────
export interface WS04_WhyHowLadder {
  rungs: Array<{
    level: number;          // 1 = transactional, ↑ = deeper purpose
    statement: string;
    whyAbove?: string;      // why goes UP the ladder
    howBelow?: string;      // how goes DOWN the ladder
  }>;
  topPurpose: string;       // the deepest "in the eyes of the customer..."
}

// ─── WS05 — Response × Stage Matrix ──────────────────────────────────────────
export interface WS05_ResponseMatrix {
  cells: Record<ConnectedMode, Record<JourneyStage, {
    response: string;
    requiredInfo: string[];
    currentlyImplemented: boolean;
  }>>;
}

// ─── WS06 — Repeat Levels ────────────────────────────────────────────────────
export const REPEAT_LEVELS = {
  1: 'unified_experience',
  2: 'improved_customization',
  3: 'meta_data_insights',
  4: 'trusted_partner',
} as const;

export interface WS06_RepeatLearning {
  currentLevel: 1 | 2 | 3 | 4;
  evidenceForLevel: string[];
  learning: Record<
    'customization' | 'deeper_needs' | 'optimization' | 'new_offerings' | 'efficiency',
    Array<{ experienceN: number; observation: string; }>
  >;
  pathToNextLevel: string;
}

// ─── WS07 + WS08 — Connected Strategy Matrix ─────────────────────────────────
export interface WS07_ExistingMatrix {
  cells: Record<ConnectedMode, Record<ConnectionArchitecture, {
    selfActivities: string[];
    competitorActivities: Array<{ competitor: string; activity: string }>;
    isWhitespace: boolean;
  }>>;
}

export interface WS08_NewIdeasMatrix {
  ideas: Array<{
    cell: { mode: ConnectedMode; architecture: ConnectionArchitecture };
    description: string;
    businessModel: string;
    requiredConnections: string[];
    informationFlows: string[];
    revenueLevers: Array<'what' | 'when' | 'who' | 'why' | 'currency'>;
    feasibility: 1 | 2 | 3 | 4 | 5;
  }>;
}

// ─── WS09 / WS10 / WS11 — STAR × Subfunction Grid ────────────────────────────
export interface WS09_SubfunctionGrid {
  cells: Record<StarDimension, Record<Subfunction, { description: string }>>;
}

export interface WS10_TechSolutions {
  cells: Record<StarDimension, Record<Subfunction, {
    currentTech: string;
    selectionScores: { convenience: -2|-1|0|1|2; safety: -2|-1|0|1|2; cost: -2|-1|0|1|2 };
    appliedIn: string;   // ej: "auth in /api/login"
  }>>;
}

export interface WS11_EmergingTech {
  cells: Record<StarDimension, Record<Subfunction, {
    emergingTechCandidates: Array<{ name: string; readinessLevel: 1|2|3|4|5|6|7|8|9; unlocks: string }>;
  }>>;
}
```

### 1.2 Crear el "competitive advantage" canonical schema

Archivo nuevo: `packages/domain/src/v3/competitive-canonical.ts`

```typescript
export interface FiveForcesAnalysis {
  customers: ForceAnalysis;
  suppliers: ForceAnalysis;
  rivalry: ForceAnalysis;
  entrants: ForceAnalysis;
  substitutes: ForceAnalysis;
  industryAttractiveness: 1 | 2 | 3 | 4 | 5;
}
export interface ForceAnalysis {
  attractiveness: 1 | 2 | 3 | 4 | 5;
  drivers: string[];
  evidence: Array<{ claim: string; sourceUrl: string; date?: string }>;
}

export interface ScenarioAnalysis {
  uncertainties: [
    { name: string; high: string; low: string },
    { name: string; high: string; low: string }
  ];
  scenarios: Array<{
    name: string;
    quadrant: 'HH' | 'HL' | 'LH' | 'LL';
    narrative: string;
    strategicImplication: string;
  }>;
}

export interface CompetitorProfile {
  name: string;
  url: string;                     // requerido — sin URL no se acepta
  pricing: string;
  positioning: string;
  recentMoves: Array<{ date: string; description: string; sourceUrl: string }>;
  wtpScores: Record<string, '++'|'+'|'0'|'-'|'--'>;   // por driver
  costScores: Record<string, '++'|'+'|'0'|'-'|'--'>;
}

export interface DriverScore {
  name: string;
  weight: number;                  // 0-1 por segmento
  selfScore: -2 | -1 | 0 | 1 | 2;
  competitorScores: Record<string, -2|-1|0|1|2>;
  evidence?: string;
}

export interface ActivitySystemMap {
  positioning: string[];           // 3-6 main strategic choices
  coreChoices: Array<{
    id: string;
    label: string;
    centrality: number;            // # connections (computed)
    valueChainStage: 'inbound'|'operations'|'outbound'|'marketing'|'service'|'support';
  }>;
  supportingActivities: Array<{ id: string; label: string; }>;
  reinforcementMatrix: Record<string, string[]>;  // activityA → [activities it reinforces]
  oeVsSp: Record<string, 'OE' | 'SP'>;   // per activityId — Operational Effectiveness vs Strategic Positioning
  mermaid: string;                 // mermaid graph source
  imitabilityScore: number;        // 0-1 (1 = harder to copy)
}

export interface ThreeFitsAssessment {
  internal: { score: number; justification: string; gaps: string[] };
  external: { score: number; justification: string; gaps: string[] };
  dynamic: { score: number; justification: string; gaps: string[] };
}

export interface FrontierAnalysis {
  axes: { wtpDrivers: string[]; costDrivers: string[] };
  points: Array<{
    entity: string;                // 'self' | competitor name
    wtp: number;
    cost: number;
    dominatedBy: string[];
  }>;
  paretoFront: string[];           // entity names on the frontier
  selfPosition: 'below' | 'on' | 'above';
  candidateMoves: Array<{
    moveId: string;
    name: string;
    description: string;
    currentPoint: { wtp: number; cost: number };
    projectedPoint: { wtp: number; cost: number };
    breaksTradeOffs: boolean;
    dominatesAll: boolean;
    imitabilityScore: number;
    requiredActivities: string[];
    wharton_basis: string[];      // ej: ["WS04_repeat_level", "WS06_customization"]
  }>;
}
```

### 1.3 Backward-compat con v1

NO toques `packages/domain/src/worksheets.ts` (los IDs v1 se siguen usando).

En el barrel `packages/domain/src/index.ts`, agrega exports nuevos sin romper los viejos:

```typescript
// existente: export * from './worksheets.js';
export * from './v3/worksheets-canonical.js';
export * from './v3/competitive-canonical.js';
```

### 1.4 Schemas zod (validación runtime de outputs LLM)

Archivo nuevo: `packages/domain/src/v3/schemas.ts`

Por cada interfaz arriba, declara su zod schema. Ejemplo:

```typescript
import { z } from 'zod';

export const journeyStageEnum = z.enum(JOURNEY_STAGES);
export const connectedModeEnum = z.enum(CONNECTED_MODES);
// ...

export const ws01Schema = z.object({
  scope: z.object({ customerSegment: z.string().min(3), useCase: z.string().min(3) }),
  stages: z.record(journeyStageEnum, z.object({
    underlyingNeed: z.string(),
    customerActions: z.array(z.string()),
    decisionFactors: z.array(z.string()),
    touchpoints: z.array(z.string()),
    painPoints: z.array(z.string()),
    wtpDrivers: z.array(z.object({
      name: z.string(),
      relativeScore: z.enum(['++','+','0','-','--']),
      competitorScores: z.record(z.string(), z.enum(['++','+','0','-','--'])),
    })),
  })),
});

// ... un schema por cada WS y por cada componente competitive
```

Estos schemas son **el contrato** que las respuestas LLM deben cumplir.

### 1.5 Test fixtures

Archivo nuevo: `packages/domain/src/v3/__tests__/fixtures.ts`

Crea 1 fixture por cada WS01-WS11 con datos reales del caso Sun King del PDF
`All WorkSheets Sunking 1-6.pdf`. Esto te servirá en fases siguientes para tests.

Estructura mínima:
```typescript
export const sunkingWS01: WS01_JourneyMap = { /* ... extraído del PDF */ };
export const sunkingWS02: ...;  // pain points + WTP del Sun King ya están en el PDF
// etc.
```

Si no puedes leer el PPTX, usa los PDFs `min` (tienen el texto extraíble). Si tampoco
puedes, deja el fixture con datos plausibles inventados PERO marca con
`// TODO: replace with real Sun King data from PDF` — así no bloqueas la fase.

### 1.6 Tests de schema

Archivo nuevo: `packages/domain/src/v3/__tests__/schemas.test.ts`

```typescript
describe('v3 worksheet schemas', () => {
  it('accepts valid Sun King WS01 fixture', () => {
    expect(ws01Schema.parse(sunkingWS01)).toBeDefined();
  });
  it('rejects WS01 with missing journey stage', () => {
    const broken = { ...sunkingWS01, stages: {} };
    expect(() => ws01Schema.parse(broken)).toThrow();
  });
  // similar por cada WS
});
```

---

## VERIFICACIÓN

Antes de marcar como ✅ done:

```bash
pnpm --filter @cs/domain exec tsc --noEmit       # build limpio
pnpm --filter @cs/domain test                    # todos los tests pasan
pnpm --filter @cs/agents exec tsc --noEmit       # no rompiste agentes
pnpm --filter @cs/server exec tsc --noEmit       # no rompiste server
```

Si los 4 dan verde → fase OK.

---

## ENTREGABLES

- [x] `packages/domain/src/v3/worksheets-canonical.ts`
- [x] `packages/domain/src/v3/competitive-canonical.ts`
- [x] `packages/domain/src/v3/schemas.ts` (zod)
- [x] `packages/domain/src/v3/__tests__/fixtures.ts` (Sun King)
- [x] `packages/domain/src/v3/__tests__/schemas.test.ts`
- [x] Barrel update en `packages/domain/src/index.ts`
- [x] V3_CHECKPOINT.md actualizado: PHASE-01 ✅
- [x] Commit: `feat(v3): phase 1 — canonical Wharton schema (WS01-11 + CA)`

---

## NOTAS PARA FASES SIGUIENTES

Anota en V3_CHECKPOINT.md "Notas cross-phase":
- Lista exacta de tipos exportados desde `@cs/domain` (los necesita PHASE-03 para los agentes)
- Cualquier worksheet donde tu fixture quedó con `TODO` (PHASE-05 lo necesita real al testear)
