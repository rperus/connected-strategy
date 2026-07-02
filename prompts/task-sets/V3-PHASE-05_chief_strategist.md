---
type: prompt
---
# V3 PHASE 05 — Chief Strategist con Tool-Use Loop

**Goal:** Construir el sintetizador maestro que produce el Strategy Audit completo
(las 5 preguntas Wharton + Three Fits + top priorities) usando `gemini-2.5-pro` con
**tool-use agentic** — puede pedir lecturas adicionales del repo durante su
razonamiento, en lugar de operar sólo sobre summaries pre-cocinados (el bug grande
de v2 sintetizador).

**Modelo:** Opus 4.7
**Estimado:** 90-120 min
**Pre-requisitos:** PHASE-01..04 ✅

---

## CONTEXTO

- `state/V3_MASTER_PLAN.md` §7 — diseño completo del tool-use loop
- v2 sintetizador (`packages/agents/src/agents/strategic-synthesizer.ts`) — lo que
  vas a NO replicar (es ciego, recibe sólo summaries)
- `packages/domain/src/v3/competitive-canonical.ts` — `ThreeFitsAssessment` shape

---

## DISEÑO

El chief-strategist:

1. Recibe el `ProjectStateV3` completo (después de PHASE-A..E)
2. Construye un prompt inicial con los 5 audit questions Wharton
3. Llama Gemini 2.5 Pro con tools habilitadas
4. Loop: si Gemini pide tool calls, los ejecuta y re-llama
5. Cuando Gemini devuelve respuesta final (no más tool calls): valida con zod
6. Si invalido, reintenta hasta 3 veces con diff de error
7. Retorna `SynthesisResult` para guardar en `state.synthesis`

**Tools expuestas:**

```typescript
const tools = [
  {
    name: 'read_file',
    description: 'Read file content from project. Use when you need to verify a specific implementation detail.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to projectPath' },
        offset: { type: 'number', description: 'Line offset (default 0)' },
        limit: { type: 'number', description: 'Max lines (default 200)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'grep_repo',
    description: 'Search regex pattern across project files',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        glob: { type: 'string', description: 'optional glob filter, e.g. "**/*.ts"' },
        max_results: { type: 'number', description: 'default 30' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'read_worksheet_answer',
    description: 'Get the raw answer for a specific worksheet question',
    input_schema: {
      type: 'object',
      properties: {
        worksheetId: { type: 'string' },
        questionId: { type: 'string' },
      },
      required: ['worksheetId', 'questionId'],
    },
  },
  {
    name: 'compare_to_history',
    description: 'Get a specific field from the previous run of this project',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string', description: 'dotpath into prior state, e.g. "synthesis.healthScore.value"' },
      },
      required: ['field'],
    },
  },
];
```

---

## TAREAS

### 5.1 Tool implementations

`packages/agents/src/v3/synthesis/tools.ts`

Cada tool devuelve `string` (resultado serializable que el modelo lee como texto):

```typescript
export async function executeTool(
  toolName: string,
  toolInput: any,
  ctx: ChiefStrategistContext
): Promise<string> {
  switch (toolName) {
    case 'read_file':
      return await ctx.fileReader.read(toolInput.path, toolInput.offset, toolInput.limit);
    case 'grep_repo':
      return await ctx.fileReader.grep(toolInput.pattern, toolInput.glob, toolInput.max_results ?? 30);
    case 'read_worksheet_answer':
      return JSON.stringify(getWorksheetAnswer(ctx.state, toolInput.worksheetId, toolInput.questionId));
    case 'compare_to_history':
      const prev = ctx.store.loadSnapshot(ctx.projectId, ctx.priorRunId);
      return JSON.stringify(getDotPath(prev, toolInput.field));
    default:
      return `ERROR: unknown tool ${toolName}`;
  }
}
```

### 5.2 Tool-use loop runner

`packages/agents/src/v3/synthesis/tool-loop.ts`

```typescript
export async function runToolLoop(
  initialPrompt: string,
  ctx: ChiefStrategistContext,
  opts: { maxIterations: number; maxToolCalls: number; onProgress?: (msg: string) => void }
): Promise<{ finalText: string; toolCallCount: number; iterations: number }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [
    { role: 'user', content: initialPrompt },
  ];

  let toolCallCount = 0;
  for (let iter = 0; iter < opts.maxIterations; iter++) {
    const response = await ctx.llm.generateWithTools({
      model: 'gemini-2.5-pro',
      messages,
      tools,
      temperature: 0.3,
      maxOutputTokens: 16000,
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      // Ejecuta todas las tools y agrega resultados
      const toolResults = await Promise.all(
        response.functionCalls.map(async (call) => {
          if (toolCallCount >= opts.maxToolCalls) {
            return { name: call.name, content: 'ERROR: tool budget exhausted' };
          }
          toolCallCount++;
          const result = await executeTool(call.name, call.input, ctx);
          opts.onProgress?.(`[tool] ${call.name}: ${JSON.stringify(call.input).slice(0, 80)}`);
          return { name: call.name, content: result };
        })
      );
      messages.push({ role: 'assistant', content: response.functionCalls });
      messages.push({ role: 'user', content: toolResults.map(r => `<tool_result name="${r.name}">${r.content.slice(0, 4000)}</tool_result>`).join('\n') });
    } else {
      return { finalText: response.text, toolCallCount, iterations: iter + 1 };
    }
  }
  throw new Error(`Tool loop exceeded ${opts.maxIterations} iterations`);
}
```

**Defaults:** `maxIterations = 10`, `maxToolCalls = 12`, hard timeout 5 min.

### 5.3 Prompt builder

`packages/agents/src/v3/synthesis/prompt-builder.ts`

```typescript
export function buildChiefStrategistPrompt(state: ProjectStateV3): string {
  return `# Strategy Audit — ${state.projectName}

You are the Chief Strategist. Your job is to produce a Wharton-grade strategic
synthesis using ALL the data collected. You have tools to investigate further.

## Pre-collected analysis (read carefully)

### WS01 Customer Journey + WS02 WTP/Pain
${JSON.stringify(state.wharton?.ws01, null, 2).slice(0, 6000)}

### WS04 Why-How Ladder + WS06 Repeat Level
${JSON.stringify({ ws04: state.wharton?.ws04, ws06: state.wharton?.ws06 }, null, 2).slice(0, 3000)}

### WS07 Existing Matrix (whitespace cells highlighted)
${formatWS07(state.wharton?.ws07)}

### WS08 New Ideas
${JSON.stringify(state.wharton?.ws08?.ideas, null, 2).slice(0, 4000)}

### Activity System
- Positioning: ${state.competitive?.activitySystem?.positioning?.join(', ')}
- Imitability score: ${state.competitive?.activitySystem?.imitabilityScore}
- Mermaid: ${state.competitive?.activitySystem?.mermaid?.slice(0, 1500)}

### Frontier
- Self position: ${state.frontier?.selfPosition}
- Pareto front: ${state.frontier?.paretoFront?.join(', ')}
- Top candidate moves (sorted): ${JSON.stringify(state.frontier?.candidateMoves?.slice(0, 5), null, 2)}

### 5 Forces
${JSON.stringify(state.competitive?.fiveForces, null, 2).slice(0, 3000)}

### Swarm findings (critical + high only)
${state.swarm?.findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 20).map(f => `- [${f.severity}] ${f.title} (${f.file ?? 'N/A'})`).join('\n')}

### Competitors
${state.competitive?.competitors?.map(c => `- ${c.name} — ${c.positioning}`).join('\n')}

## Your job

Answer the 5 Wharton Strategy Audit questions:

1. **Industry state and evolution.** What forces affect all players in this sector?
   How will they evolve over 12-24 months? Use scenarios from state.competitive.scenarios.

2. **WTP and cost drivers.** What drives WTP and cost for the segment? How is
   ${state.projectName} positioned vs competitors per the frontier analysis?

3. **Competitor movements / convergence.** Where are competitors heading? Is
   strategic convergence happening? Where is white-space?

4. **Best practices vs strategic differentiation.** Of ${state.projectName}'s
   activities, which are mere best practices (replicable easily) vs genuine
   differentiation (system-embedded)? Reference the activity system map and OE-vs-SP
   classification.

5. **Synergies in larger context.** If this project is part of a portfolio, how do
   its actions affect other parts? (Skip if standalone.)

## Three Fits assessment

For each fit (Internal / External / Dynamic), give:
- score 0-100
- 2-3 sentence justification anchored in evidence above
- gaps[] — concrete gaps to close

## Top priorities

Produce 5 priorities, sorted by impact × feasibility. Each priority must:
- Reference at least 1 specific frontier candidate move (by moveId) OR 1 specific swarm finding (by id)
- Have wharton_basis[] (which worksheets/concepts it derives from)
- Have antigravity_prompt_hint — a 2-3 sentence instruction for the Antigravity worker
  (PHASE-G will expand this into the full prompt)

## Output format

Respond with a SINGLE JSON object matching this schema (no prose outside the JSON):

\`\`\`json
{
  "strategyAuditAnswers": {
    "industryStateAndEvolution": "string (200-500 words)",
    "wtpAndCostDrivers": "string",
    "competitorMovements": "string",
    "bestPracticesVsDifferentiation": "string",
    "synergies": "string or null"
  },
  "threeFits": {
    "internal": { "score": number, "justification": "string", "gaps": ["string"] },
    "external": { "score": number, "justification": "string", "gaps": ["string"] },
    "dynamic": { "score": number, "justification": "string", "gaps": ["string"] }
  },
  "topPriorities": [
    {
      "priorityId": "string",
      "title": "string (≤80 chars)",
      "summary": "string (2-3 sentences)",
      "wharton_basis": ["string"],
      "frontierMoveId": "string | null",
      "swarmFindingId": "string | null",
      "antigravityPromptHint": "string",
      "estimatedImpact": "high|medium|low",
      "estimatedEffort": "hours|days|weeks"
    }
  ],
  "executiveSummary": "string (≤1500 chars, written for a C-level reader)",
  "healthScore": { "value": number, "ci": [number, number] }
}
\`\`\`

## When to use tools

- If a worksheet field looks suspicious or thin → \`read_worksheet_answer\` to see raw value
- If a swarm finding mentions a file → \`read_file\` to verify the code is as described
- If you suspect a competitor's recent move conflicts with your data → leave it; do NOT
  hallucinate; report the gap in "gaps"
- If you need to know what changed since last run → \`compare_to_history\` with field path

You have a budget of 12 tool calls. Use them wisely.

Begin.
`;
}
```

### 5.4 Health score con CI (intervalo de confianza)

`packages/agents/src/v3/synthesis/health-score.ts`

```typescript
export function computeHealthScoreWithCI(state: ProjectStateV3): { value: number; ci: [number, number] } {
  // Componentes:
  // - frontier.selfPosition: above=+30, on=+15, below=0
  // - imitabilityScore: contributes 0-25
  // - swarm critical findings: -8 each, capped at -40
  // - swarm high findings: -3 each, capped at -15
  // - WS06 currentLevel: L1=0, L2=10, L3=20, L4=30
  // - threeFits avg / 4 = +0..25

  const positionScore = state.frontier?.selfPosition === 'above' ? 30 : state.frontier?.selfPosition === 'on' ? 15 : 0;
  const imitabilityBonus = (state.competitive?.activitySystem?.imitabilityScore ?? 0) * 25;
  const criticalCount = state.swarm?.findings.filter(f => f.severity === 'critical').length ?? 0;
  const highCount = state.swarm?.findings.filter(f => f.severity === 'high').length ?? 0;
  const repeatBonus = ((state.wharton?.ws06?.currentLevel ?? 1) - 1) * 10;

  let score = 50 + positionScore + imitabilityBonus + repeatBonus
            - Math.min(40, criticalCount * 8)
            - Math.min(15, highCount * 3);
  score = Math.max(0, Math.min(100, score));

  // CI based on data completeness
  let uncertainty = 0;
  if (!state.competitive?.competitors || state.competitive.competitors.length < 3) uncertainty += 8;
  if (!state.frontier) uncertainty += 10;
  if (!state.competitive?.activitySystem) uncertainty += 6;
  if ((state.wharton?.ws08?.ideas?.length ?? 0) < 3) uncertainty += 4;

  return {
    value: Math.round(score),
    ci: [Math.max(0, Math.round(score - uncertainty)), Math.min(100, Math.round(score + uncertainty))],
  };
}
```

(El chief-strategist puede sobrescribir si quiere, pero esta función provee un baseline
auditable.)

### 5.5 Top-level chief-strategist agent

`packages/agents/src/v3/agents/chief-strategist.ts`

```typescript
export async function runChiefStrategist(
  input: { state: ProjectStateV3 },
  ctx: AgentV3Context
): Promise<AgentV3Result<ProjectStateV3['synthesis']>> {
  const start = Date.now();

  const prompt = buildChiefStrategistPrompt(input.state);

  let toolCallCount = 0;
  let iterations = 0;
  let parsedSynthesis: ProjectStateV3['synthesis'];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { finalText, toolCallCount: tc, iterations: it } = await runToolLoop(
      prompt + (attempt > 1 ? `\n\nPrevious attempt failed schema validation. Return strictly valid JSON.` : ''),
      { llm: ctx.llm, store: ctx.store, fileReader: ctx.fileReader, projectId: ctx.projectId, priorRunId: ctx.priorRunId, state: input.state },
      { maxIterations: 10, maxToolCalls: 12 }
    );
    toolCallCount += tc;
    iterations += it;

    const json = extractJSON(finalText);
    const parsed = synthesisSchema.safeParse(json);
    if (parsed.success) {
      parsedSynthesis = parsed.data;
      break;
    }
    if (attempt === 3) {
      return {
        success: false,
        error: `Synthesis schema validation failed: ${parsed.error.message}`,
        durationMs: Date.now() - start,
        tokensUsed: 0, llmCalls: iterations, filesRead: ctx.fileReader.readPaths,
      };
    }
  }

  // Fallback baseline en case healthScore omitted
  if (!parsedSynthesis!.healthScore) {
    parsedSynthesis!.healthScore = computeHealthScoreWithCI(input.state);
  }

  // Add activity-system mermaid if available
  parsedSynthesis!.activitySystemMermaid = input.state.competitive?.activitySystem?.mermaid ?? '';

  return { success: true, data: parsedSynthesis!, durationMs: Date.now() - start, ... };
}
```

### 5.6 Schema validation

En `packages/domain/src/v3/schemas.ts` agregar:

```typescript
export const synthesisSchema = z.object({
  strategyAuditAnswers: z.object({
    industryStateAndEvolution: z.string().min(50),
    wtpAndCostDrivers: z.string().min(50),
    competitorMovements: z.string().min(50),
    bestPracticesVsDifferentiation: z.string().min(50),
    synergies: z.string().nullable(),
  }),
  threeFits: z.object({
    internal: z.object({ score: z.number().min(0).max(100), justification: z.string(), gaps: z.array(z.string()) }),
    external: z.object({ score: z.number().min(0).max(100), justification: z.string(), gaps: z.array(z.string()) }),
    dynamic: z.object({ score: z.number().min(0).max(100), justification: z.string(), gaps: z.array(z.string()) }),
  }),
  topPriorities: z.array(z.object({
    priorityId: z.string(),
    title: z.string().max(100),
    summary: z.string(),
    wharton_basis: z.array(z.string()).min(1),
    frontierMoveId: z.string().nullable(),
    swarmFindingId: z.string().nullable(),
    antigravityPromptHint: z.string().min(20),
    estimatedImpact: z.enum(['high', 'medium', 'low']),
    estimatedEffort: z.enum(['hours', 'days', 'weeks']),
  })).min(3).max(10),
  executiveSummary: z.string().max(2000),
  healthScore: z.object({ value: z.number().min(0).max(100), ci: z.tuple([z.number(), z.number()]) }).optional(),
  activitySystemMermaid: z.string().optional(),
});
```

### 5.7 Tests

`packages/agents/src/v3/__tests__/chief-strategist.test.ts`

- Unit: `computeHealthScoreWithCI` con state vacío vs completo
- Unit: `buildChiefStrategistPrompt` con state mínimo no crashea, contiene
  todas las secciones
- Integration (con mock LLM): tool loop respeta budget, devuelve schema válido
- Integration: si LLM devuelve JSON inválido 3 veces, retorna `success: false`
  con errors detallados

---

## VERIFICACIÓN

```bash
pnpm --filter @cs/agents exec tsc --noEmit
pnpm --filter @cs/agents test -- chief-strategist
```

Smoke test con state fixture:
```bash
node -e "
const { runChiefStrategist } = require('./packages/agents/dist/v3/agents/chief-strategist.js');
const ctx = makeCtx({ mockLLM: true });
const state = loadFixture('sunking-full-state');
const out = await runChiefStrategist({ state }, ctx);
console.log(out.data.executiveSummary);
console.log('Tool calls:', out.toolCallCount);
"
```

---

## ENTREGABLES

- [x] `packages/agents/src/v3/synthesis/tools.ts`
- [x] `packages/agents/src/v3/synthesis/tool-loop.ts`
- [x] `packages/agents/src/v3/synthesis/prompt-builder.ts`
- [x] `packages/agents/src/v3/synthesis/health-score.ts`
- [x] `packages/agents/src/v3/agents/chief-strategist.ts`
- [x] `synthesisSchema` en `packages/domain/src/v3/schemas.ts`
- [x] Tests
- [x] V3_CHECKPOINT.md actualizado: PHASE-05 ✅
- [x] Commit: `feat(v3): phase 5 — chief strategist with tool-use loop`

---

## NOTAS

- El SDK de Gemini para tool-use puede llamarse diferente según versión.
  Verifica `@google/generative-ai` versión y adapta la llamada de `generateWithTools`.
  Si la versión instalada no soporta tool-use nativo, usa el patrón JSON-in-prompt
  con instrucciones tipo "responde con `{action: 'tool_call', tool: ..., input: ...}`
  o `{action: 'final', data: ...}`" — funciona pero es menos elegante.
- Si Gemini 2.5 Pro `thinkingConfig` no está disponible en el SDK actual, baja a
  `gemini-1.5-pro` con `temperature=0.2` y mismo prompt — pierdes thinking pero
  funciona.
- La calidad de output depende ENORMEMENTE de la calidad de los upstream agents.
  Si esos producen JSON pobre, este sintetizador hereda esa pobreza. Por eso
  PHASE-03 es la fase larga.
