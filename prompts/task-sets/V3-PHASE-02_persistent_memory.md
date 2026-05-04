# V3 PHASE 02 — Persistent Project Memory

**Goal:** Reemplazar `cachedDeepResults` (RAM, vida = 1 proceso) con storage en disco
por proyecto que sobreviva reinicios y mantenga historia de corridas.

**Modelo:** Opus 4.7
**Estimado:** 45-60 min
**Pre-requisitos:** PHASE-01 ✅ (necesitas tipos canónicos)

---

## CONTEXTO

- `state/V3_MASTER_PLAN.md` §6 — layout completo de `data/projects/<id>/`
- `apps/server/src/db/` — patrones existentes de SQLite (no romper)
- v2 actualmente guarda en `cachedDeepResults` en `deep-route.ts:43`

---

## DECISIÓN DE DISEÑO

**Filesystem JSON, no SQLite.**

Razones:
- Los outputs son árboles complejos (matrices anidadas) — JSON nativo es más limpio
- El usuario puede inspeccionarlos a mano
- Append-only para historia (jsonl) es trivial sin schema migration
- SQLite ya se usa para *catálogo* de proyectos (lista, paths) — eso sigue ahí

---

## TAREAS

### 2.1 Definir el ProjectStateStore

Archivo nuevo: `packages/agents/src/v3/state-store.ts`

```typescript
export interface ProjectStateV3 {
  schemaVersion: '3.0.0';
  projectId: string;
  projectName: string;
  projectPath: string;
  lastRunId: string | null;
  lastRunAt: string | null;        // ISO8601
  discovery?: DiscoveryResult;
  wharton?: {
    ws01?: WS01_JourneyMap;
    ws02?: never;                  // merged into ws01
    ws03?: WS03_InfoFlow;
    ws04?: WS04_WhyHowLadder;
    ws05?: WS05_ResponseMatrix;
    ws06?: WS06_RepeatLearning;
    ws07?: WS07_ExistingMatrix;
    ws08?: WS08_NewIdeasMatrix;
    ws09?: WS09_SubfunctionGrid;
    ws10?: WS10_TechSolutions;
    ws11?: WS11_EmergingTech;
  };
  competitive?: {
    fiveForces?: FiveForcesAnalysis;
    scenarios?: ScenarioAnalysis;
    competitors?: CompetitorProfile[];
    wtpDrivers?: DriverScore[];
    costDrivers?: DriverScore[];
    activitySystem?: ActivitySystemMap;
  };
  swarm?: {
    findings: SpecialistFinding[];
    perSpecialist: Record<string, { count: number; durationMs: number }>;
  };
  frontier?: FrontierAnalysis;
  synthesis?: {
    threeFits: ThreeFitsAssessment;
    strategyAuditAnswers: Record<string, string>;
    topPriorities: Priority[];
    healthScore: { value: number; ci: [number, number] };
    executiveSummary: string;
    activitySystemMermaid: string;
  };
  userContext: {
    naturalLanguageUpdates: Array<{ at: string; message: string; appliedChanges: string[] }>;
    dismissedPriorities: string[];
    completedPriorities: string[];
  };
}

export class ProjectStateStore {
  constructor(private rootDir: string /* default: data/projects */) {}

  load(projectId: string): ProjectStateV3 | null;
  save(state: ProjectStateV3): void;       // atomic write (tmpfile + rename)
  appendHistory(projectId: string, runRecord: RunRecord): void;     // history.jsonl
  appendCitation(projectId: string, citation: Citation): void;       // citations.jsonl
  readContext(projectId: string): string;                            // context.md
  appendContext(projectId: string, message: string, changes: string[]): void;
  cacheLLM(projectId: string, promptHash: string, response: unknown): void;
  readLLMCache(projectId: string, promptHash: string): unknown | null;
}

export interface RunRecord {
  runId: string;
  startedAt: string;
  endedAt: string;
  phasesCompleted: Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'>;
  delta: { newPriorities: number; resolvedPriorities: number; healthScoreDelta: number };
  errors: Array<{ phase: string; message: string }>;
}

export interface Citation {
  claim: string;
  sourceUrl: string;
  retrievedAt: string;
  agent: string;
}
```

**Implementación clave:**
- `load()`: si no existe `state.json`, devuelve `null` (no crashea)
- `save()`: escribe a `state.json.tmp` luego `rename` atómico (evita corrupción)
- `appendHistory()` y `appendCitation()`: usan `fs.appendFile` con newline
- `cacheLLM()`: archivo `llm-cache/<sha256>.json`

### 2.2 Migration helper

Archivo nuevo: `packages/agents/src/v3/migrators.ts`

```typescript
export function migrateState(raw: unknown): ProjectStateV3 {
  // verifica schemaVersion; si es < 3.0.0 aplica transformaciones idempotentes
  // hoy solo soporta 3.0.0; deja stub para futuros 3.1.0 etc.
}
```

### 2.3 SQLite extension (sólo agregar tabla nueva)

En `apps/server/src/db/migrations/` agrega un nuevo archivo (ej: `008_v3_runs.sql`):

```sql
CREATE TABLE IF NOT EXISTS v3_runs (
  run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','done','failed')),
  health_score INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd REAL,
  error_message TEXT,
  state_snapshot_path TEXT NOT NULL  -- ruta al data/projects/<id>/snapshots/<run_id>.json
);

CREATE INDEX IF NOT EXISTS idx_v3_runs_project ON v3_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_v3_runs_status ON v3_runs(status);
```

**Importante:** sólo agregar (CREATE TABLE IF NOT EXISTS), nunca DROP.

### 2.4 Repository pattern

Archivo nuevo: `apps/server/src/db/repositories/v3-runs.ts`

```typescript
export function insertRun(record: V3Run): void;
export function updateRunStatus(runId: string, status: 'done'|'failed', extra: {...}): void;
export function listRuns(projectId: string, limit?: number): V3Run[];
export function getLatestRun(projectId: string): V3Run | null;
```

### 2.5 Snapshots por corrida

Cada corrida exitosa hace dump de `state.json` actual a `data/projects/<id>/snapshots/<runId>.json`.
Esto da **rollback** y **diff entre corridas** gratis.

Helper en `state-store.ts`:
```typescript
snapshotState(projectId: string, runId: string): string  // returns snapshot path
loadSnapshot(projectId: string, runId: string): ProjectStateV3 | null
diffSnapshots(projectId: string, runIdA: string, runIdB: string): StateDiff
```

### 2.6 Tests

Archivo nuevo: `packages/agents/src/v3/__tests__/state-store.test.ts`

Casos mínimos:
- save → load roundtrip preserva todos los campos
- load de proyecto inexistente devuelve null
- appendHistory escribe línea jsonl válida
- save concurrente (2 writes simultáneos) no corrompe
- cacheLLM(hash) → readLLMCache(mismo hash) devuelve mismo objeto
- migrateState con schemaVersion '3.0.0' es idempotente

### 2.7 Cleanup util

Archivo nuevo: `packages/agents/src/v3/cleanup.ts`

```typescript
// Borra snapshots viejos, mantiene últimos N
export function pruneSnapshots(projectId: string, keep: number = 20): number;

// Borra cache LLM > N días
export function pruneLLMCache(projectId: string, maxAgeDays: number = 30): number;
```

---

## VERIFICACIÓN

```bash
pnpm --filter @cs/agents exec tsc --noEmit
pnpm --filter @cs/agents test -- state-store
pnpm --filter @cs/server exec tsc --noEmit
```

Test manual:
```bash
node -e "
const { ProjectStateStore } = require('./packages/agents/dist/v3/state-store.js');
const s = new ProjectStateStore('./data/projects');
s.save({ schemaVersion: '3.0.0', projectId: 'test', /* ... */ });
console.log(s.load('test'));
"
```

Verificar que existe `data/projects/test/state.json` con contenido válido.

---

## ENTREGABLES

- [x] `packages/agents/src/v3/state-store.ts`
- [x] `packages/agents/src/v3/migrators.ts`
- [x] `packages/agents/src/v3/cleanup.ts`
- [x] `packages/agents/src/v3/__tests__/state-store.test.ts`
- [x] `apps/server/src/db/migrations/008_v3_runs.sql`
- [x] `apps/server/src/db/repositories/v3-runs.ts`
- [x] V3_CHECKPOINT.md actualizado: PHASE-02 ✅
- [x] Commit: `feat(v3): phase 2 — persistent project state store`

---

## NOTAS

- `data/projects/` debe estar en `.gitignore` (datos por proyecto, no código).
  Pero crea `data/projects/.gitkeep` y `data/projects/README.md` explicando estructura.
- El cache LLM puede crecer rápido — implementa pruneLLMCache en `cleanup.ts`.
- `state.json` puede ser grande (50-200 KB). NO uses `JSON.stringify(state, null, 2)`
  en producción si el usuario reporta lentitud — usa stringify sin pretty-print.
