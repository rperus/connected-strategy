# V3 PHASE 06 — Antigravity Handoff Packaging

**Goal:** Por cada `topPriority` del sintetizador, generar 4 archivos estructurados en
`data/projects/<id>/antigravity/move-N/` que Antigravity puede consumir directamente.
Esto reemplaza el "blob de markdown" que producía v2.

**Modelo:** Opus 4.7
**Estimado:** 60-75 min
**Pre-requisitos:** PHASE-01..05 ✅

---

## CONTEXTO

- `state/V3_MASTER_PLAN.md` §8 — formato de los 4 archivos por move
- v2 producía `synthesisResult.antigravityMasterPrompt` como string suelto
  en `cachedDeepResults.masterPrompts[]` — eso se elimina

---

## TAREAS

### 6.1 Manifest builder

`packages/agents/src/v3/handoff/manifest-builder.ts`

```typescript
export interface MoveManifest {
  moveId: string;
  title: string;
  wharton_basis: string[];
  frontier_impact: { wtp_delta: number; cost_delta: number };
  files_to_create: Array<{ path: string; purpose: string }>;
  files_to_edit: Array<{ path: string; lines?: string; change: string }>;
  files_to_delete: Array<{ path: string; reason: string }>;
  dependencies_to_add: string[];   // npm/pnpm package strings
  dependencies_to_remove: string[];
  estimated_loc: number;
  estimated_hours: number;
  references: { worksheets: string[]; findings: string[] };
}

export async function buildManifest(
  priority: Priority,
  state: ProjectStateV3,
  ctx: { llm: LLMProvider; fileReader: FileReader }
): Promise<MoveManifest>;
```

**Implementación:** Llama Gemini 2.5 Pro con un prompt que recibe la priority +
contexto del repo (file discovery, package.json, existing routes/models). El modelo
responde con manifest JSON validado por zod.

**Prompt esqueleto:**

```
Eres un ingeniero senior planificando UN cambio concreto al proyecto {projectName}.

Priority a implementar:
- Title: {priority.title}
- Summary: {priority.summary}
- Wharton basis: {priority.wharton_basis}
- Hint: {priority.antigravityPromptHint}

Estructura del repo:
{discoverySummary}

Stack: {packageJson.dependencies + devDependencies, top-level only}

Tu tarea: produce un manifest.json que liste EXACTAMENTE qué archivos crear, editar
o borrar. Incluye:
- Para `files_to_edit`, especifica `lines` cuando sea posible (ej: "120-145")
- Para `files_to_create`, especifica `purpose` en una oración
- `dependencies_to_add` con versiones específicas (ej: "date-fns@^3.0")
- `estimated_loc` y `estimated_hours` realistas

NO incluyas archivos que no existen sin marcarlos como `files_to_create`.
NO inventes paths — usa los del repo discovery.
SI necesitas verificar un path/función existente, usa la tool `grep_repo`.

Responde con JSON puro matching `MoveManifestSchema`.
```

**Schema zod:**

```typescript
export const manifestSchema = z.object({
  moveId: z.string(),
  title: z.string().max(150),
  wharton_basis: z.array(z.string()).min(1),
  frontier_impact: z.object({ wtp_delta: z.number(), cost_delta: z.number() }),
  files_to_create: z.array(z.object({ path: z.string(), purpose: z.string() })),
  files_to_edit: z.array(z.object({
    path: z.string(),
    lines: z.string().optional(),
    change: z.string(),
  })),
  files_to_delete: z.array(z.object({ path: z.string(), reason: z.string() })),
  dependencies_to_add: z.array(z.string()),
  dependencies_to_remove: z.array(z.string()),
  estimated_loc: z.number().int().nonnegative(),
  estimated_hours: z.number().nonnegative(),
  references: z.object({ worksheets: z.array(z.string()), findings: z.array(z.string()) }),
});
```

### 6.2 Acceptance tests builder

`packages/agents/src/v3/handoff/acceptance-builder.ts`

```typescript
export async function buildAcceptanceTests(
  priority: Priority,
  manifest: MoveManifest,
  state: ProjectStateV3,
  ctx: { llm: LLMProvider }
): Promise<string>;     // returns markdown content for acceptance-tests.md
```

**Prompt:**

```
Genera el archivo acceptance-tests.md para esta priority. Estructura:

# Acceptance Tests — {moveId}

## Functional
[lista checklist con criterios observables: "User opens X → sees Y", etc.]

## Code Quality
- [ ] `pnpm --filter <package> test` passes
- [ ] `pnpm --filter <package> build` clean
- [ ] No new lint errors
- [ ] Coverage para nuevo código ≥80%

## Strategic (validable manualmente o vía métricas)
[refer a worksheets/scores que deben moverse, ej: "WS06 repeat_level: actual N1 → esperado ≥N2"]

Sé específico. Cada checkpoint debe ser verificable sin ambigüedad.
```

Valida que el output contenga las 3 secciones (`Functional`, `Code Quality`,
`Strategic`) — si falta alguna, reintenta hasta 2 veces.

### 6.3 Strategy doc builder

`packages/agents/src/v3/handoff/strategy-builder.ts`

```typescript
export async function buildStrategyDoc(
  priority: Priority,
  state: ProjectStateV3,
  ctx: { llm: LLMProvider }
): Promise<string>;
```

**Prompt:**

```
Genera strategy.md — documento de "por qué este cambio." Audiencia:
desarrollador junior que necesita entender el contexto estratégico, no sólo
la mecánica del cambio.

Estructura sugerida:

# Why This Move — Strategic Rationale

**Wharton anchor:** [worksheets relacionados]

[2-3 párrafos explicando]
- Estado actual del proyecto en este eje (cita evidence: "WS06 está en L1 porque ...")
- Qué problema/oportunidad ataca
- Por qué este cambio mueve el needle estratégico (referenciar frontier impact, 
  switching cost, repeat level, etc.)
- Por qué los competidores no lo han hecho / no pueden copiarlo fácil

**Frontier impact:** WTP +X.X, Cost +Y.Y
**Imitability score:** 0.NN — explicación

Sé concreto, no hand-wavy. Cita números reales del state.
```

### 6.4 Antigravity prompt builder

`packages/agents/src/v3/handoff/prompt-builder-handoff.ts`

```typescript
export function buildAntigravityPrompt(
  moveId: string,
  projectId: string,
  manifest: MoveManifest
): string;        // determinístico, no necesita LLM
```

**Template:**

```
# Antigravity Worker Prompt — {moveId}

Eres un Antigravity worker implementando "{manifest.title}" para el proyecto {projectId}.

**Lee primero, en este orden:**
1. data/projects/{projectId}/antigravity/{moveId}/strategy.md  ← contexto
2. data/projects/{projectId}/antigravity/{moveId}/manifest.json ← qué archivos
3. data/projects/{projectId}/antigravity/{moveId}/acceptance-tests.md ← criterios

**Workflow:**

1. Aplica TODOS los cambios listados en manifest.json:
   - files_to_create: {N} archivos
   - files_to_edit: {M} archivos
   - files_to_delete: {K} archivos
   - dependencies_to_add: {L} paquetes
   Preserva código no relacionado.

2. Corre todas las verificaciones de acceptance-tests.md hasta que pasen.

3. Si encuentras inconsistencia entre strategy.md y manifest.json: la strategy
   manda. Actualiza el manifest si es necesario antes de aplicar.

4. Commit con mensaje:
   `feat: {moveId} — {manifest.title.slice(0, 60)}`

5. Actualiza data/projects/{projectId}/state.json:
   - userContext.completedPriorities += ['{moveId}']

6. STOP y reporta:
   - Files changed (count)
   - Tests passing (count / total)
   - Commit SHA
   - Cualquier desviación del manifest con justificación

**Si te bloqueas:**
- NO uses --no-verify, NO skipees tests
- Diagnostica raíz, fíjala, reintenta
- Si sigue bloqueado tras 3 intentos: escribe `BLOCKED.md` en la carpeta del move
  con detalle del problema, marca la priority como blocked en state, STOP.
```

### 6.5 Phase G orchestrator

`packages/agents/src/v3/handoff/index.ts`

```typescript
export async function runHandoffPhase(
  state: ProjectStateV3,
  ctx: AgentV3Context
): Promise<{ movesGenerated: number; indexPath: string }> {
  if (!state.synthesis?.topPriorities) {
    throw new Error('No topPriorities to handoff');
  }

  const baseDir = path.join('data', 'projects', state.projectId, 'antigravity');
  await fs.mkdir(baseDir, { recursive: true });

  const movesGenerated: Array<{ moveId: string; title: string; effort: string; impact: string }> = [];

  for (const [i, priority] of state.synthesis.topPriorities.entries()) {
    const moveId = `move-${i + 1}`;
    const moveDir = path.join(baseDir, moveId);
    await fs.mkdir(moveDir, { recursive: true });

    ctx.log(`[handoff] generating ${moveId}: ${priority.title}`);

    const manifest = await buildManifest(priority, state, ctx);
    await fs.writeFile(path.join(moveDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    const acceptanceMd = await buildAcceptanceTests(priority, manifest, state, ctx);
    await fs.writeFile(path.join(moveDir, 'acceptance-tests.md'), acceptanceMd);

    const strategyMd = await buildStrategyDoc(priority, state, ctx);
    await fs.writeFile(path.join(moveDir, 'strategy.md'), strategyMd);

    const promptMd = buildAntigravityPrompt(moveId, state.projectId, manifest);
    await fs.writeFile(path.join(moveDir, 'prompt.md'), promptMd);

    movesGenerated.push({
      moveId,
      title: priority.title,
      effort: priority.estimatedEffort,
      impact: priority.estimatedImpact,
    });
  }

  // Generate INDEX.md
  const indexMd = generateIndex(state, movesGenerated);
  const indexPath = path.join(baseDir, 'INDEX.md');
  await fs.writeFile(indexPath, indexMd);

  return { movesGenerated: movesGenerated.length, indexPath };
}
```

### 6.6 Index generator

```typescript
function generateIndex(state: ProjectStateV3, moves: Array<{...}>): string {
  return `# Antigravity Moves — ${state.projectName}

Generated: ${state.lastRunAt}
Run ID: ${state.lastRunId}
Health Score: ${state.synthesis?.healthScore?.value} (CI ${state.synthesis?.healthScore?.ci?.join('-')})

## Executive Summary

${state.synthesis?.executiveSummary}

## Moves (sorted by impact)

${moves.map((m, i) => `### ${m.moveId}: ${m.title}

- Impact: **${m.impact}** | Effort: **${m.effort}**
- Files: [manifest.json](./${m.moveId}/manifest.json)
- Why: [strategy.md](./${m.moveId}/strategy.md)
- Tests: [acceptance-tests.md](./${m.moveId}/acceptance-tests.md)
- Antigravity prompt: [prompt.md](./${m.moveId}/prompt.md)

`).join('\n')}

---

## How to use

1. Pick a move (highest impact / lowest effort first usually)
2. Open its prompt.md
3. Paste into Antigravity
4. Antigravity reads the other 3 files and implements
5. After commit, mark complete in state.json:userContext.completedPriorities

Re-run \`POST /api/pipeline/run-v3\` after completing moves to get fresh analysis.
`;
}
```

### 6.7 Tests

```typescript
describe('handoff phase', () => {
  it('generates 4 files per priority', async () => {
    const state = loadFixture('synthesized-state');
    const { movesGenerated } = await runHandoffPhase(state, mockCtx);
    expect(movesGenerated).toBe(state.synthesis!.topPriorities.length);
    // Verify each moveDir has 4 files
  });
  it('manifest schema valid', async () => { ... });
  it('INDEX.md lista todos los moves en orden', async () => { ... });
});
```

---

## VERIFICACIÓN

```bash
pnpm --filter @cs/agents exec tsc --noEmit
pnpm --filter @cs/agents test -- handoff
```

Smoke test:

```bash
# tras phase F completada en test fixture:
ls data/projects/test/antigravity/
# expected: INDEX.md + move-1/ + move-2/ + ...

ls data/projects/test/antigravity/move-1/
# expected: manifest.json + acceptance-tests.md + strategy.md + prompt.md
```

---

## ENTREGABLES

- [x] `packages/agents/src/v3/handoff/manifest-builder.ts`
- [x] `packages/agents/src/v3/handoff/acceptance-builder.ts`
- [x] `packages/agents/src/v3/handoff/strategy-builder.ts`
- [x] `packages/agents/src/v3/handoff/prompt-builder-handoff.ts`
- [x] `packages/agents/src/v3/handoff/index.ts`
- [x] `manifestSchema` en `packages/domain/src/v3/schemas.ts`
- [x] Tests
- [x] V3_CHECKPOINT.md actualizado: PHASE-06 ✅
- [x] Commit: `feat(v3): phase 6 — antigravity handoff packaging`

---

## NOTAS

- El INDEX.md es lo PRIMERO que el usuario humano abre. Debe ser excelente.
  Considera agregar un mini-dashboard al inicio: "X moves, Y high-impact,
  estimated total Z hours."
- Cada `prompt.md` debe ser autocontenido (Antigravity puede llegar frío).
- El campo `wharton_basis` permite trazar a posteriori qué worksheet motivó qué cambio
  — no lo descartes, es valor diferenciador.
