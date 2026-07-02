---
type: prompt
---
# V3 PHASE 07 — Route + UI Wiring (Final Phase)

**Goal:** Montar el endpoint `POST /api/pipeline/run-v3` que orquesta las 7 phases
A-G y exponer una página en el frontend para disparar y ver resultados. v1
(`run-full`) y v2 (`run-deep`) siguen intactos.

**Modelo:** Opus 4.7
**Estimado:** 90 min
**Pre-requisitos:** PHASE-01..06 ✅

---

## CONTEXTO

- `apps/server/src/index.ts` — registro de rutas existente (no romper)
- `apps/web/src/pages/` — páginas existentes; agregar 1 nueva
- `state/V3_MASTER_PLAN.md` §2 — diagrama del orchestrator

---

## TAREAS

### 7.1 V3 route orchestrator

Archivo nuevo: `apps/server/src/modules/pipeline/v3-route.ts`

```typescript
import express from 'express';
import { Request, Response, Router } from 'express';
import { ProjectStateStore } from '@cs/agents/v3/state-store';
import { listProjects } from '../../db/repositories/projects.js';
import { insertRun, updateRunStatus } from '../../db/repositories/v3-runs.js';
import { runV3Pipeline } from '@cs/agents/v3/pipeline-orchestrator';

const router: Router = express.Router();
const store = new ProjectStateStore('data/projects');

router.post('/run-v3', async (req: Request, res: Response) => {
  const body = req.body as {
    projectIds?: string[];
    naturalLanguageContext?: string;
    skipPhases?: Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'>;
    useGemini?: boolean;
    competitorHints?: string[];
    customerSegment?: string;
  };

  const runId = `v3-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const projects = listProjects().filter(p => !body.projectIds || body.projectIds.includes(p.id));

  if (projects.length === 0) {
    return res.status(400).json({ ok: false, error: 'No projects matched' });
  }

  // Fire-and-track: long-running, return runId immediately
  const startedAt = new Date().toISOString();
  insertRun({ runId, projectId: projects[0].id, startedAt, status: 'running', stateSnapshotPath: '' });

  // Run async (don't await — let HTTP return)
  (async () => {
    try {
      for (const project of projects) {
        await runV3Pipeline({
          runId,
          project,
          store,
          options: {
            useGemini: body.useGemini !== false,
            naturalLanguageContext: body.naturalLanguageContext,
            skipPhases: body.skipPhases ?? [],
            competitorHints: body.competitorHints,
            customerSegment: body.customerSegment,
          },
        });
      }
      updateRunStatus(runId, 'done', { endedAt: new Date().toISOString() });
    } catch (err) {
      updateRunStatus(runId, 'failed', { endedAt: new Date().toISOString(), errorMessage: String(err) });
    }
  })();

  res.json({ ok: true, runId, projectsQueued: projects.length, statusEndpoint: `/api/pipeline/v3-status/${runId}` });
});

router.get('/v3-status/:runId', (req, res) => {
  const run = getRunById(req.params.runId);   // from db/repositories/v3-runs
  if (!run) return res.status(404).json({ ok: false });
  res.json({ ok: true, run });
});

router.get('/v3-state/:projectId', (req, res) => {
  const state = store.load(req.params.projectId);
  if (!state) return res.status(404).json({ ok: false, error: 'No v3 state for this project' });
  res.json({ ok: true, state });
});

router.get('/v3-moves/:projectId', (req, res) => {
  const state = store.load(req.params.projectId);
  if (!state?.synthesis) return res.json({ ok: true, moves: [] });
  // Read INDEX.md from disk
  const indexPath = `data/projects/${req.params.projectId}/antigravity/INDEX.md`;
  res.json({
    ok: true,
    moves: state.synthesis.topPriorities.map((p, i) => ({
      moveId: `move-${i + 1}`,
      title: p.title,
      summary: p.summary,
      impact: p.estimatedImpact,
      effort: p.estimatedEffort,
      paths: {
        manifest: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/manifest.json`,
        prompt: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/prompt.md`,
        strategy: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/strategy.md`,
        acceptance: `data/projects/${req.params.projectId}/antigravity/move-${i + 1}/acceptance-tests.md`,
      },
    })),
    indexPath,
  });
});

router.post('/v3-context/:projectId', (req, res) => {
  const message = req.body.message as string;
  if (!message) return res.status(400).json({ ok: false, error: 'message required' });
  store.appendContext(req.params.projectId, message, []);
  res.json({ ok: true });
});

router.get('/v3-history/:projectId', (req, res) => {
  // Read history.jsonl
  const lines = readJsonl(`data/projects/${req.params.projectId}/history.jsonl`);
  res.json({ ok: true, runs: lines });
});

export default router;
```

### 7.2 Pipeline orchestrator (las 7 phases)

`packages/agents/src/v3/pipeline-orchestrator.ts`

```typescript
export interface RunV3Opts {
  runId: string;
  project: { id: string; name: string; path: string; stack: string };
  store: ProjectStateStore;
  options: {
    useGemini: boolean;
    naturalLanguageContext?: string;
    skipPhases: Array<'A'|'B'|'C'|'D'|'E'|'F'|'G'>;
    competitorHints?: string[];
    customerSegment?: string;
  };
}

export async function runV3Pipeline(opts: RunV3Opts): Promise<void> {
  const { runId, project, store, options } = opts;
  const skip = new Set(options.skipPhases);

  // Load existing state or init
  let state = store.load(project.id) ?? initEmptyState(project);
  state.lastRunId = runId;
  state.lastRunAt = new Date().toISOString();

  // Append NL context if provided
  if (options.naturalLanguageContext) {
    store.appendContext(project.id, options.naturalLanguageContext, []);
  }

  const ctx = makeAgentCtx({ runId, project, store, useGemini: options.useGemini });
  const phasesCompleted: string[] = [];
  const errors: Array<{ phase: string; message: string }> = [];

  // Phase A — Discovery
  if (!skip.has('A')) {
    try {
      state.discovery = (await runCodeCartographer({ projectPath: project.path }, ctx)).data!;
      phasesCompleted.push('A');
      store.save(state);
    } catch (e) { errors.push({ phase: 'A', message: String(e) }); }
  }

  // Phase B — Wharton (parallel)
  if (!skip.has('B')) {
    try {
      const segment = options.customerSegment ?? 'primary user';
      const competitors = options.competitorHints ?? [];

      const ws01 = await runCustomerJourneyMapper({ projectPath: project.path, projectName: project.name, customerSegment: segment, useCase: 'main use', competitorNames: competitors }, ctx);

      const [ws03, ws04ws06, ws05ws07ws08, ws09ws10ws11] = await Promise.all([
        runInfoFlowAnalyzer({ ws01Output: ws01.data!, projectPath: project.path }, ctx),
        runDeeperNeedsLaddering({ ws01Output: ws01.data!, projectPath: project.path, projectName: project.name }, ctx),
        runConnectedExperienceMatrix({ ws01Output: ws01.data!, ws04Output: undefined as any, competitorNames: competitors, projectPath: project.path }, ctx),  // ws04 lives in deeper-needs output; reorder if needed
        runTechStackMapper({ projectPath: project.path, packageJson: state.discovery!.packageJson, fileDiscovery: state.discovery!.fileDiscovery }, ctx),
      ]);

      const revenueModel = await runRevenueModelArchitect({ ws07Output: ws05ws07ws08.data!.ws07, ws08Output: ws05ws07ws08.data!.ws08, competitorPricing: [] }, ctx);

      state.wharton = {
        ws01: ws01.data,
        ws03: ws03.data?.ws03,
        ws04: ws04ws06.data?.ws04,
        ws05: ws05ws07ws08.data?.ws05,
        ws06: ws04ws06.data?.ws06,
        ws07: ws05ws07ws08.data?.ws07,
        ws08: ws05ws07ws08.data?.ws08,
        ws09: ws09ws10ws11.data?.ws09,
        ws10: ws09ws10ws11.data?.ws10,
        ws11: ws09ws10ws11.data?.ws11,
      };
      // Save delivery model fields somewhere appropriate (extend state if needed)
      phasesCompleted.push('B');
      store.save(state);
    } catch (e) { errors.push({ phase: 'B', message: String(e) }); }
  }

  // Phase C — Competitive (parallel)
  if (!skip.has('C')) {
    try {
      const [forces, intel, drivers, activitySys] = await Promise.all([
        runIndustryStructureAnalyst({ projectName: project.name, sector: 'auto-detect', segment: options.customerSegment }, ctx),
        runCompetitorIntelligence({ projectName: project.name, sector: 'auto-detect', projectDescription: state.discovery?.readme ?? '', knownCompetitors: options.competitorHints }, ctx),
        runWtpCostDriverScorer({ ws01Output: state.wharton!.ws01!, competitors: [], projectPath: project.path }, ctx),
        runActivitySystemMapper({ ws01Output: state.wharton!.ws01!, ws07Output: state.wharton!.ws07!, ws08Output: state.wharton!.ws08!, projectPath: project.path }, ctx),
      ]);
      state.competitive = {
        fiveForces: forces.data?.fiveForces,
        scenarios: forces.data?.scenarios,
        competitors: intel.data?.competitors,
        wtpDrivers: drivers.data?.wtpDrivers,
        costDrivers: drivers.data?.costDrivers,
        activitySystem: activitySys.data,
      };
      phasesCompleted.push('C');
      store.save(state);
    } catch (e) { errors.push({ phase: 'C', message: String(e) }); }
  }

  // Phase D — Code Quality Swarm (parallel)
  if (!skip.has('D')) {
    try {
      const swarmResults = await Promise.all([
        runDbArchitect({ /* ... */ }, ctx),
        runSecurityAuditor({ /* ... */ }, ctx),
        runApiDesignCritic({ /* ... */ }, ctx),
        runPerformanceEngineer({ /* ... */ }, ctx),
        runMlReadiness({ /* ... */ }, ctx),
        runFrontendPerf({ /* ... */ }, ctx),
        runObservability({ /* ... */ }, ctx),
      ]);
      state.swarm = mergeSwarmResults(swarmResults);
      phasesCompleted.push('D');
      store.save(state);
    } catch (e) { errors.push({ phase: 'D', message: String(e) }); }
  }

  // Phase E — Frontier math (deterministic)
  if (!skip.has('E')) {
    try {
      state.frontier = await runFrontierPhase(state);
      phasesCompleted.push('E');
      store.save(state);
    } catch (e) { errors.push({ phase: 'E', message: String(e) }); }
  }

  // Phase F — Chief Strategist
  if (!skip.has('F')) {
    try {
      const synth = await runChiefStrategist({ state }, ctx);
      state.synthesis = synth.data;
      phasesCompleted.push('F');
      store.save(state);
    } catch (e) { errors.push({ phase: 'F', message: String(e) }); }
  }

  // Phase G — Handoff packaging
  if (!skip.has('G')) {
    try {
      await runHandoffPhase(state, ctx);
      phasesCompleted.push('G');
    } catch (e) { errors.push({ phase: 'G', message: String(e) }); }
  }

  // Snapshot + history
  const snapshotPath = store.snapshotState(project.id, runId);
  store.appendHistory(project.id, {
    runId,
    startedAt: state.lastRunAt!,
    endedAt: new Date().toISOString(),
    phasesCompleted: phasesCompleted as any,
    delta: computeDelta(state, /* prior state */ null),
    errors,
  });
}
```

### 7.3 Mount route en server

Edita `apps/server/src/index.ts` (sólo agregar 2 líneas):

```typescript
import v3PipelineRoutes from './modules/pipeline/v3-route.js';
app.use('/api/pipeline', v3PipelineRoutes);
```

### 7.4 Frontend page

Archivo nuevo: `apps/web/src/pages/v3/V3Dashboard.tsx`

Componentes mínimos:
- **Botón "Run V3 Analysis"** → POST `/api/pipeline/run-v3`
- **Status poller** → GET `/api/pipeline/v3-status/:runId` cada 3s
- **Project picker** (lista de proyectos del DB)
- **Optional inputs:** customer segment, competitor hints (textarea), NL context
- **Skip phases** checkboxes (útil para iteración)

Cuando termine:
- **Health Score card** con CI: `72 ± 8`
- **Frontier plot** (D3 o recharts) con puntos del project + competidores
- **Three Fits**: 3 barras con score 0-100
- **Activity System** mermaid render (`mermaid.render`)
- **Top Priorities lista** con copy-to-clipboard del prompt.md
- **History timeline** (último N runs con health score delta)

### 7.5 Frontend page para inspeccionar moves

Archivo nuevo: `apps/web/src/pages/v3/V3Moves.tsx`

- Tabla con todos los moves (impact, effort, status: pending/completed)
- Click en row abre un drawer con tabs: Manifest, Strategy, Acceptance, Prompt
- Botón "Mark complete" → POST `/api/pipeline/v3-context/:projectId` con `completedPriority`
- Botón "Copy prompt" → al portapapeles

### 7.6 NL context update UI

En el dashboard, un textarea grande "Context (lenguaje natural):" + botón "Save context".
POST `/api/pipeline/v3-context/:projectId`. Esto se acumula en `context.md` y futuras
corridas lo consideran.

### 7.7 Sidebar entry

Edita `apps/web/src/components/Sidebar.tsx` para agregar:
```tsx
<NavLink to="/v3">V3 Analysis</NavLink>
<NavLink to="/v3/moves">Antigravity Moves</NavLink>
```

### 7.8 Routes config

Edita `apps/web/src/App.tsx` para agregar:
```tsx
<Route path="/v3" element={<V3Dashboard />} />
<Route path="/v3/moves" element={<V3Moves />} />
```

---

## VERIFICACIÓN

### Backend smoke
```bash
pnpm --filter @cs/server exec tsc --noEmit
pnpm --filter @cs/server build
node apps/server/dist/index.js &
sleep 2

# El endpoint existe
curl -s -X POST http://127.0.0.1:4311/api/pipeline/run-v3 \
  -H 'Content-Type: application/json' \
  -d '{"useGemini": false, "customerSegment": "indie hacker"}' | jq

# debe devolver { ok: true, runId: "v3-...", ... }
```

### Frontend smoke
```bash
pnpm --filter @cs/web build
pnpm --filter @cs/web preview
# abrir http://localhost:5173/v3 — debe cargar sin errores en consola
```

### Integration end-to-end
```bash
# 1. Run v3 contra proyecto fixture (sin Gemini, todo offline)
curl -X POST http://127.0.0.1:4311/api/pipeline/run-v3 -d '{...}'

# 2. Esperar finished (poll v3-status)
# 3. Verificar artifacts
ls data/projects/<projectId>/antigravity/
cat data/projects/<projectId>/antigravity/INDEX.md
ls data/projects/<projectId>/antigravity/move-1/
# ⇒ manifest.json, acceptance-tests.md, strategy.md, prompt.md

# 4. v1 y v2 siguen funcionando
curl -X POST http://127.0.0.1:4311/api/pipeline/run-full -d '{}'
curl -X POST http://127.0.0.1:4311/api/pipeline/run-deep -d '{}'
```

---

## ENTREGABLES

- [x] `apps/server/src/modules/pipeline/v3-route.ts`
- [x] `packages/agents/src/v3/pipeline-orchestrator.ts`
- [x] `apps/web/src/pages/v3/V3Dashboard.tsx`
- [x] `apps/web/src/pages/v3/V3Moves.tsx`
- [x] Updates a Sidebar.tsx, App.tsx, server index.ts
- [x] V3_CHECKPOINT.md actualizado: PHASE-07 ✅
- [x] Commit final: `feat(v3): phase 7 — orchestrator + UI; v3 ready end-to-end`

---

## SUCCESS CRITERIA FINAL (todos verdes = release)

- ✅ `POST /api/pipeline/run-v3` corre completo en proyecto fixture sin errores fatales
- ✅ `data/projects/<test>/state.json` contiene los 7 phases poblados
- ✅ El JSON de WS01 tiene exactamente 8 stages
- ✅ El JSON de WS07 tiene 4×5 = 20 cells con flag isWhitespace
- ✅ `frontier.candidateMoves[]` ≥1 con `imitabilityScore > 0.6`
- ✅ `data/projects/<test>/antigravity/` tiene ≥3 carpetas move-N con 4 archivos cada una
- ✅ Health score reporta `value` Y `ci`
- ✅ Toda mención de competidor en `synthesis` tiene URL en `citations.jsonl`
- ✅ v1 (`run-full`) y v2 (`run-deep`) siguen funcionando idénticos
- ✅ UI en `/v3` carga, dispara analyses, muestra resultados

Si todos verdes → **RELEASE COMMIT**: `release(v3): mega-professional connected strategy analyzer`

---

## NOTAS

- El orchestrator NO usa try/catch global — usa try/catch por fase para que si
  Phase D falla, Phases E-G aún corran con state parcial.
- En modo `useGemini: false`, los agentes deben tener offlineFallback estructurado
  (devolver schemas válidos pero con valores placeholder calibrados, no `null`).
- Para el frontend, si no quieres pelear con D3, usa `recharts` (más fácil para
  scatter del frontier).
- La página `/v3/moves` es lo que el usuario va a usar más — invierte tiempo en
  hacerla buena (copy-to-clipboard, mark complete, ver diffs entre runs).
