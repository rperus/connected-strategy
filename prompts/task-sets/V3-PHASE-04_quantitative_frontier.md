---
type: prompt
---
# V3 PHASE 04 — Quantitative Frontier Engine

**Goal:** Reemplazar el campo `frontierOpportunity: string` (texto libre que la LLM
inventa en v2) por un motor matemático determinístico que opera sobre los vectores
WTP/Cost producidos por `wtp-cost-driver-scorer` en PHASE-03.

**Modelo:** Opus 4.7
**Estimado:** 60-75 min
**Pre-requisitos:** PHASE-01 ✅, PHASE-02 ✅, PHASE-03 ✅ (necesitas DriverScore[])

---

## CONTEXTO

- `state/V3_MASTER_PLAN.md` §5 — modelo cuantitativo completo
- `packages/domain/src/v3/competitive-canonical.ts` — interface `FrontierAnalysis`
- Output de PHASE-03: `wtpDrivers: DriverScore[]` y `costDrivers: DriverScore[]`

---

## CONCEPTO

Esta fase es **100% determinística** (sin LLM). Hace álgebra simple sobre vectores
y aplica el algoritmo Pareto.

---

## TAREAS

### 4.1 Frontier engine

Archivo nuevo: `packages/agents/src/v3/frontier/engine.ts`

```typescript
export interface FrontierInput {
  self: { name: string; wtpDrivers: DriverScore[]; costDrivers: DriverScore[] };
  competitors: Array<{ name: string }>;   // los scores ya están dentro de driver.competitorScores
  segment?: { name: string; weights?: Record<string, number> };  // opcional
}

export function computeFrontier(input: FrontierInput): FrontierAnalysis;
```

**Algoritmo:**

```typescript
// 1. Aggregate per entity
function aggregate(entityName: string, drivers: DriverScore[], weights: Record<string, number>): number {
  return drivers.reduce((sum, d) => {
    const score = entityName === 'self' ? d.selfScore : (d.competitorScores[entityName] ?? 0);
    const w = weights[d.name] ?? d.weight ?? 1 / drivers.length;
    return sum + score * w;
  }, 0);
}

// 2. Build points
const entities = ['self', ...input.competitors.map(c => c.name)];
const points = entities.map(name => ({
  entity: name,
  wtp: aggregate(name, input.self.wtpDrivers, weights),
  cost: -aggregate(name, input.self.costDrivers, costWeights),  // negativo: lower cost = better
  dominatedBy: [] as string[],
}));

// 3. Compute dominance
for (const p of points) {
  for (const q of points) {
    if (p.entity === q.entity) continue;
    if (q.wtp >= p.wtp && q.cost >= p.cost && (q.wtp > p.wtp || q.cost > p.cost)) {
      p.dominatedBy.push(q.entity);
    }
  }
}

// 4. Pareto front
const paretoFront = points.filter(p => p.dominatedBy.length === 0).map(p => p.entity);

// 5. Self position
const selfPoint = points.find(p => p.entity === 'self')!;
let selfPosition: 'below' | 'on' | 'above';
if (selfPoint.dominatedBy.length === 0 && paretoFront.length === 1) selfPosition = 'above';
else if (selfPoint.dominatedBy.length === 0) selfPosition = 'on';
else selfPosition = 'below';

return { axes: ..., points, paretoFront, selfPosition, candidateMoves: [] };
```

### 4.2 Candidate moves generator

Archivo nuevo: `packages/agents/src/v3/frontier/candidate-moves.ts`

```typescript
export interface MoveCandidate {
  source: 'ws08_idea' | 'wharton_finding' | 'swarm_finding' | 'manual';
  name: string;
  description: string;
  wharton_basis: string[];
  // Estimaciones del upstream agent o LLM:
  wtpDriverDeltas: Record<string, number>;     // driverName → delta (-2 a +2)
  costDriverDeltas: Record<string, number>;
  requiredActivities: string[];                 // ids del activity-system map
}

export function evaluateMove(
  current: { wtp: number; cost: number },
  competitors: Array<{ entity: string; wtp: number; cost: number }>,
  move: MoveCandidate,
  baseDrivers: { wtp: DriverScore[]; cost: DriverScore[] },
  activitySystem: ActivitySystemMap
): {
  projectedPoint: { wtp: number; cost: number };
  breaksTradeOffs: boolean;          // wtp' > wtp AND cost' > cost (recordando que cost = -realCost)
  dominatesAll: boolean;
  imitabilityScore: number;
} {
  // Apply deltas
  const newWtp = current.wtp + sumDeltas(move.wtpDriverDeltas, baseDrivers.wtp);
  const newCost = current.cost + sumDeltas(move.costDriverDeltas, baseDrivers.cost);

  // Trade-offs broken?
  const breaksTradeOffs = newWtp > current.wtp && newCost > current.cost;

  // Dominates all competitors?
  const dominatesAll = competitors.every(
    c => newWtp >= c.wtp && newCost >= c.cost && (newWtp > c.wtp || newCost > c.cost)
  );

  // Imitability: derivado del activity system + densidad de requiredActivities
  // si requiredActivities cubren ≥2 core choices con alta centralidad → harder to copy
  const imitabilityScore = computeMoveImitability(move, activitySystem);

  return { projectedPoint: { wtp: newWtp, cost: newCost }, breaksTradeOffs, dominatesAll, imitabilityScore };
}

function computeMoveImitability(move: MoveCandidate, sys: ActivitySystemMap): number {
  // Para cada activity required, suma su centralidad y si es SP (no OE)
  const total = move.requiredActivities.reduce((acc, aid) => {
    const choice = sys.coreChoices.find(c => c.id === aid);
    const isSP = sys.oeVsSp[aid] === 'SP';
    const centrality = choice?.centrality ?? 1;
    return acc + (isSP ? centrality : centrality * 0.3);
  }, 0);
  // Normalize: max possible = sum of all centralities
  const maxCentrality = sys.coreChoices.reduce((a, c) => a + c.centrality, 0);
  return Math.min(1, total / Math.max(1, maxCentrality));
}
```

### 4.3 Move discovery (de WS08 + findings)

Archivo nuevo: `packages/agents/src/v3/frontier/discover-moves.ts`

```typescript
export function discoverMoves(state: ProjectStateV3): MoveCandidate[] {
  const moves: MoveCandidate[] = [];

  // 1. Cada idea de WS08 es un candidato
  if (state.wharton?.ws08) {
    for (const idea of state.wharton.ws08.ideas) {
      moves.push({
        source: 'ws08_idea',
        name: idea.description.slice(0, 80),
        description: idea.description,
        wharton_basis: [`WS08:${idea.cell.mode}/${idea.cell.architecture}`],
        wtpDriverDeltas: estimateWtpDeltas(idea, state),  // heurístico
        costDriverDeltas: estimateCostDeltas(idea, state),
        requiredActivities: idea.requiredConnections,
      });
    }
  }

  // 2. Cada swarm finding "high" o "critical" cuyo whartonImpact.raisesWtp || reducesCost
  if (state.swarm) {
    for (const f of state.swarm.findings) {
      if (f.severity === 'critical' || f.severity === 'high') {
        if (f.whartonImpact.raisesWtp || f.whartonImpact.reducesCost) {
          moves.push({
            source: 'swarm_finding',
            name: f.title,
            description: f.remediation,
            wharton_basis: [f.id],
            wtpDriverDeltas: f.whartonImpact.raisesWtp ? { 'quality': 1 } : {},
            costDriverDeltas: f.whartonImpact.reducesCost ? { 'maintenance': 1 } : {},
            requiredActivities: [],
          });
        }
      }
    }
  }

  // 3. Pain points sin remediación pueden generar moves implícitos
  // (opcional, requiere LLM — se hace en chief-strategist phase F)

  return moves;
}

function estimateWtpDeltas(idea: WS08Idea, state: ProjectStateV3): Record<string, number> {
  // Heurística simple: si idea.feasibility >= 4 → +1 a "differentiation"; siempre +0.5 a "innovation"
  // (puedes mejorarlo con tabla de mapeo idea.cell → drivers)
  return idea.feasibility >= 4 ? { differentiation: 1, innovation: 0.5 } : { innovation: 0.5 };
}
```

### 4.4 Top-level orchestration

Archivo nuevo: `packages/agents/src/v3/frontier/index.ts`

```typescript
export async function runFrontierPhase(state: ProjectStateV3): Promise<FrontierAnalysis> {
  if (!state.competitive?.wtpDrivers || !state.competitive?.costDrivers) {
    throw new Error('Frontier requires competitive.wtpDrivers and costDrivers');
  }

  const baseFrontier = computeFrontier({
    self: {
      name: state.projectName,
      wtpDrivers: state.competitive.wtpDrivers,
      costDrivers: state.competitive.costDrivers,
    },
    competitors: (state.competitive.competitors ?? []).map(c => ({ name: c.name })),
  });

  const moves = discoverMoves(state);
  const evaluated = moves.map((m, i) => {
    const evaluation = evaluateMove(
      baseFrontier.points.find(p => p.entity === 'self')!,
      baseFrontier.points.filter(p => p.entity !== 'self'),
      m,
      { wtp: state.competitive!.wtpDrivers!, cost: state.competitive!.costDrivers! },
      state.competitive!.activitySystem!
    );
    return {
      moveId: `move-${i + 1}`,
      name: m.name,
      description: m.description,
      currentPoint: { wtp: baseFrontier.points.find(p => p.entity === 'self')!.wtp, cost: baseFrontier.points.find(p => p.entity === 'self')!.cost },
      ...evaluation,
      requiredActivities: m.requiredActivities,
      wharton_basis: m.wharton_basis,
    };
  });

  // Sort by: dominatesAll desc, breaksTradeOffs desc, imitability desc
  evaluated.sort((a, b) => {
    if (a.dominatesAll !== b.dominatesAll) return a.dominatesAll ? -1 : 1;
    if (a.breaksTradeOffs !== b.breaksTradeOffs) return a.breaksTradeOffs ? -1 : 1;
    return b.imitabilityScore - a.imitabilityScore;
  });

  return { ...baseFrontier, candidateMoves: evaluated.slice(0, 12) };  // top 12
}
```

### 4.5 Tests unitarios (CRÍTICOS — esta fase es matemática)

Archivo nuevo: `packages/agents/src/v3/frontier/__tests__/engine.test.ts`

Casos OBLIGATORIOS:

```typescript
describe('computeFrontier', () => {
  it('detecta single-Pareto-optimal correctly', () => {
    // self: wtp=5, cost=-3 (mejor en ambos)
    // comp_a: wtp=3, cost=-5
    // comp_b: wtp=4, cost=-4
    // expected: paretoFront = ['self', 'comp_b'] (comp_a dominado por comp_b)
    // self.dominatedBy = [], position = 'on' (no es 'above' porque hay otro en frontier)
  });

  it('detecta self below frontier', () => {
    // self: wtp=2, cost=-2
    // comp: wtp=5, cost=-1
    // expected: self.dominatedBy = ['comp'], position = 'below'
  });

  it('detecta self above frontier (raro)', () => {
    // self: wtp=5, cost=-1 (domina a todos)
    // comp_a: wtp=4, cost=-2; comp_b: wtp=3, cost=-3
    // expected: paretoFront = ['self'], position = 'above'
  });

  it('handles empty competitors', () => { ... });
  it('respects custom weights', () => { ... });
});

describe('evaluateMove', () => {
  it('breaksTradeOffs=true cuando ambos ejes mejoran', () => { ... });
  it('breaksTradeOffs=false cuando sólo mejora WTP a costa de Cost', () => { ... });
  it('imitabilityScore alto cuando required activities son SP + alta centralidad', () => { ... });
  it('imitabilityScore bajo cuando required activities son OE', () => { ... });
});

describe('discoverMoves', () => {
  it('mapea cada WS08 idea a un MoveCandidate', () => { ... });
  it('filtra swarm findings por severity y whartonImpact', () => { ... });
});
```

### 4.6 Visualización opcional

Si te queda tiempo, agrega un helper `frontierToSVG.ts` que genere SVG con los puntos
y la frontera. No es bloqueante (PHASE-07 puede dibujarlo en frontend con D3).

---

## VERIFICACIÓN

```bash
pnpm --filter @cs/agents exec tsc --noEmit
pnpm --filter @cs/agents test -- frontier   # tests verdes
```

Test integración con fixture Sun King:

```bash
node -e "
const { computeFrontier } = require('./packages/agents/dist/v3/frontier/engine.js');
const { sunkingFrontierFixture } = require('./packages/domain/dist/v3/__tests__/fixtures.js');
const result = computeFrontier(sunkingFrontierFixture);
console.log(JSON.stringify(result, null, 2));
"
```

---

## ENTREGABLES

- [x] `packages/agents/src/v3/frontier/engine.ts`
- [x] `packages/agents/src/v3/frontier/candidate-moves.ts`
- [x] `packages/agents/src/v3/frontier/discover-moves.ts`
- [x] `packages/agents/src/v3/frontier/index.ts`
- [x] `packages/agents/src/v3/frontier/__tests__/engine.test.ts` (≥10 tests)
- [x] V3_CHECKPOINT.md actualizado: PHASE-04 ✅
- [x] Commit: `feat(v3): phase 4 — quantitative frontier engine`

---

## NOTAS

- Este módulo NO usa LLM. Es pura matemática + algoritmos. Más fácil de
  testear, más fácil de auditar, más rápido de correr (<1s).
- La calidad del output depende 100% de los `DriverScore[]` que produzca
  PHASE-03. Si esos están mal, esto produce números mal — pero el algoritmo
  es correcto.
- "Beyond the frontier" = `dominatesAll && breaksTradeOffs && imitabilityScore > 0.6`.
  Esa es la condición rigurosa de ventaja competitiva sostenible.
