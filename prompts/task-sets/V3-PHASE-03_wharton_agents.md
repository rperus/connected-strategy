# V3 PHASE 03 — Wharton Agents (6) + Code Quality Swarm (7)

**Goal:** Construir los 13 agentes especializados que producen los outputs estructurados
de las 11 worksheets Wharton + el lado de competitive advantage + el swarm de calidad
de código. Cada uno con modelo Gemini correcto y validación zod.

**Modelo:** Opus 4.7
**Estimado:** 2-3 horas (es la fase más larga)
**Pre-requisitos:** PHASE-01 ✅, PHASE-02 ✅

---

## CONTEXTO

- `state/V3_MASTER_PLAN.md` §3 (mapeo Wharton) y §4 (competitive)
- `packages/agents/src/llm-provider.ts` — wrapper Gemini existente (úsalo, no reescribas)
- `packages/agents/src/agents/specialist-swarm.ts` — patrón v2 que vas a mejorar (no replicar fielmente)
- `packages/domain/src/v3/schemas.ts` — zod schemas creados en PHASE-01

---

## ARQUITECTURA COMÚN A TODOS LOS AGENTES V3

Cada agente vive en `packages/agents/src/v3/agents/<name>.ts` y exporta:

```typescript
export interface AgentV3Input { ... }      // específico al agente
export interface AgentV3Output { ... }      // específico al agente

export async function run<Name>(
  input: AgentV3Input,
  ctx: AgentV3Context
): Promise<AgentV3Result<AgentV3Output>>;
```

**AgentV3Context** (común a todos, en `packages/agents/src/v3/types.ts`):

```typescript
export interface AgentV3Context {
  runId: string;
  projectId: string;
  projectPath: string;
  startedAt: string;

  // tools the agent can use
  llm: LLMProvider;                  // existente
  store: ProjectStateStore;          // de PHASE-02
  fileReader: FileReader;            // wrapper que TRACKEA qué archivos lee

  // budget
  maxTokens: number;
  maxToolCalls: number;
  timeoutMs: number;

  // logging / events
  log: (msg: string, data?: unknown) => void;
}

export interface AgentV3Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  durationMs: number;
  llmCalls: number;
  filesRead: string[];
  validationErrors?: string[];
}
```

**Patrón LLM call con validación zod:**

```typescript
async function callLLMValidated<T>(
  provider: LLMProvider,
  prompt: string,
  schema: z.ZodType<T>,
  opts: { model: string; temperature: number; maxOutputTokens: number; tools?: any[] }
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await provider.generate({ prompt, ...opts });
    const json = extractJSON(raw);
    const parsed = schema.safeParse(json);
    if (parsed.success) return parsed.data;
    // retry: append diff of error to prompt
    prompt = `${prompt}\n\nPrevious attempt failed validation:\n${parsed.error.message}\nReturn ONLY valid JSON matching the schema this time.`;
  }
  throw new Error('LLM validation failed after 3 attempts');
}
```

---

## TAREAS

### 3.0 Tipos comunes y FileReader

Crear primero:
- `packages/agents/src/v3/types.ts` (interfaces arriba)
- `packages/agents/src/v3/file-reader.ts` (wrapper que registra qué archivos leyó)
- `packages/agents/src/v3/llm-validated.ts` (helper `callLLMValidated`)
- `packages/agents/src/v3/code-discovery.ts` (AST-driven file selection — usa `ts-morph`
  para TS/JS y heurísticas de path para otros lenguajes; reemplaza el sample-bias de v2)

**code-discovery.ts API:**

```typescript
export interface DiscoveredFile {
  path: string;
  relativePath: string;
  language: 'ts' | 'js' | 'py' | 'go' | 'rs' | 'java' | 'sql' | 'md' | 'yml' | 'json' | 'other';
  category: 'route' | 'model' | 'service' | 'controller' | 'middleware' |
            'config' | 'test' | 'migration' | 'component' | 'util' | 'unknown';
  loc: number;
}

export async function discoverProjectFiles(projectPath: string): Promise<{
  byCategory: Record<DiscoveredFile['category'], DiscoveredFile[]>;
  byLanguage: Record<DiscoveredFile['language'], DiscoveredFile[]>;
  total: number;
  hasMonorepo: boolean;
  packageJson: any;
  readme: string;
}>;
```

Esta función es la que cada agente usa para **NO** caer en el bias regex de v2. Cada
agente consume `byCategory['route']` o `byCategory['model']` etc. según necesite.

### 3.1 Connected Strategy Agents (6 agentes)

#### 3.1.1 `customer-journey-mapper.ts` — produce WS01 + WS02

```
Input:  { projectPath, projectName, customerSegment, useCase, competitorNames[] }
Model:  gemini-2.5-pro, temperature 0.3, maxOutputTokens 12000
Tools:  [readFile, grepRepo]   ← agentic, puede hacer follow-ups
Output: { ws01: WS01_JourneyMap }   (ws02 va embebido en stages.wtpDrivers/painPoints)
Schema: ws01Schema
```

**System prompt (template):**

```
Eres un consultor estratégico Wharton experto en Connected Strategy.
Vas a mapear el customer journey del proyecto "{projectName}" para el segmento
"{customerSegment}" en el use case "{useCase}".

Las 8 stages SON, en orden:
1. latent_need (necesidad latente)
2. awareness (conciencia de la necesidad)
3. search (búsqueda de opciones)
4. decide (decisión)
5. order_pay (orden y pago)
6. receive (recepción)
7. experience (uso/experiencia)
8. post_purchase (post-compra)

Para CADA stage, debes producir:
- underlyingNeed (la necesidad subyacente)
- customerActions[] (qué hace el customer)
- decisionFactors[] (qué pesa en su decisión)
- touchpoints[] (qué interfaces tocan al producto/servicio)
- painPoints[] ← LO MÁS IMPORTANTE: los dolores actuales
- wtpDrivers[] ← los drivers de willingness-to-pay, con score relativo a competidores

Para WTP scoring usa la escala Wharton: ++/+/0/-/-- vs cada competidor.
Sé honesto: si el proyecto es peor que un competidor en algo, dilo.

Tienes acceso a leer archivos del repo en {projectPath}. Usa esas tools cuando
necesites verificar comportamiento concreto (ej: ¿cómo se hace el onboarding?
lee el archivo de signup).

Responde con JSON que matchee este schema:
{exact JSON schema for ws01Schema}
```

#### 3.1.2 `info-flow-analyzer.ts` — produce WS03

```
Input:  { ws01Output, projectPath }
Model:  gemini-2.5-flash, temperature 0.2, maxOutputTokens 8000
Tools:  [readFile]
Output: { ws03: WS03_InfoFlow }
Schema: ws03Schema
```

**Prompt clave:** Para cada stage del WS01 ya mapeado, identifica los 6 atributos del
flujo de información: description, trigger, frequency, richness, customerEffort,
inferenceParty, improvementIdea.

#### 3.1.3 `deeper-needs-laddering.ts` — produce WS04 + WS06

```
Input:  { ws01Output, projectPath, projectName }
Model:  gemini-2.5-pro, temperature 0.4, maxOutputTokens 6000
Tools:  [readFile, grepRepo]
Output: { ws04: WS04_WhyHowLadder, ws06: WS06_RepeatLearning }
Schema: ws04Schema, ws06Schema
```

**Prompt clave (WS04):** Construye el ladder why/how partiendo de "el cliente paga
por X" y subiendo hasta "el propósito profundo es Y." Mínimo 3 rungs, recomendado 5.

**Prompt clave (WS06):** Identifica el `currentLevel` (1-4) basado en evidencia
real del repo (¿hay personalización? ¿hay datos agregados? ¿hay deeper-purpose
en el messaging?). Provee `pathToNextLevel` con acción concreta.

#### 3.1.4 `connected-experience-matrix.ts` — produce WS05 + WS07 + WS08

```
Input:  { ws01Output, ws04Output, competitorNames[], projectPath }
Model:  gemini-2.5-pro, temperature 0.4, maxOutputTokens 16000
Tools:  [readFile, grepRepo, webSearchOpt]
Output: { ws05, ws07, ws08 }
Schema: ws05Schema, ws07Schema, ws08Schema
```

**Crítico:** Las 5 architectures × 4 modes = 20 cells. Para WS07 marca
`isWhitespace: true` cuando NI el proyecto NI competidores tengan actividad ahí.
Para WS08, prioriza ideas EN cells whitespace (oportunidades inexploradas).

#### 3.1.5 `tech-stack-mapper.ts` — produce WS09 + WS10 + WS11

```
Input:  { projectPath, packageJson, fileDiscovery }
Model:  gemini-2.5-flash, temperature 0.2, maxOutputTokens 12000
Tools:  [readFile, grepRepo]
Output: { ws09, ws10, ws11 }
Schema: ws09Schema, ws10Schema, ws11Schema
```

**Crítico:** Los 4 STAR × 9 sub-functions = 36 cells. WS09 describe qué hace cada
cell hoy. WS10 lista la tech actual + scores ++/+/-/-- (convenience/safety/cost).
WS11 sugiere emerging tech (con readiness level NASA TRL 1-9).

#### 3.1.6 `revenue-model-architect.ts` — produce delivery model + revenue

```
Input:  { ws07Output, ws08Output, competitorPricing[] }
Model:  gemini-2.5-pro, temperature 0.5, maxOutputTokens 6000
Output: { connectionArchitecture, revenueModel: { what, when, who, why, currency }, alternatives[] }
```

Aplica los 5 levers de precision pricing (WHAT/WHEN/WHO/WHY/CURRENCY).

### 3.2 Competitive Advantage Agents (4 agentes)

#### 3.2.1 `industry-structure-analyst.ts` — 5 Forces + Scenarios

```
Input:  { projectName, sector, segment }
Model:  gemini-2.0-flash con Google Search grounding
Tools:  [googleSearch (built-in)]
Output: { fiveForces: FiveForcesAnalysis, scenarios: ScenarioAnalysis }
Schema: fiveForcesSchema, scenariosSchema
```

**Citation requirement:** Cada `evidence[]` item DEBE tener `sourceUrl`. Extrae
URLs de `groundingMetadata` de la respuesta Gemini. Si no hay URL, descarta esa
evidencia.

#### 3.2.2 `competitor-intelligence.ts` — competitor profiles

```
Input:  { projectName, sector, projectDescription, knownCompetitors? }
Model:  gemini-2.0-flash con Google Search
Tools:  [googleSearch]
Output: { competitors: CompetitorProfile[] }
Schema: competitorProfileSchema (array)
```

**Reglas:**
- Mínimo 3 competidores, máximo 7
- Cada `recentMoves[]` requiere `sourceUrl` + `date`
- Si Gemini falla en obtener URL → descarta ese move (no incluyas claims sin fuente)
- Append cada cita a `data/projects/<id>/citations.jsonl` via `store.appendCitation`

#### 3.2.3 `wtp-cost-driver-scorer.ts` — vectores cuantitativos

```
Input:  { ws01Output, ws02Output (en ws01.stages.wtpDrivers), competitors, projectPath }
Model:  gemini-2.5-pro, temperature 0.2 (queremos precisión)
Tools:  [readFile, grepRepo]
Output: { wtpDrivers: DriverScore[], costDrivers: DriverScore[] }
Schema: driverScoreSchema (array × 2)
```

**Crítico:** `selfScore` y `competitorScores[name]` DEBEN ser números numéricos
({-2,-1,0,1,2}), no strings. Estos vectores son el input de PHASE-04 (frontier math).

Pesos por driver:
- Si el usuario dio segmento, usar pesos del segmento
- Default: distribuir uniformemente 1/N

#### 3.2.4 `activity-system-mapper.ts` — Activity System diagram

```
Input:  { ws01Output, ws07Output, ws08Output, projectPath }
Model:  gemini-2.5-pro, temperature 0.3, maxOutputTokens 10000
Tools:  [readFile]
Output: ActivitySystemMap (incluye mermaid string + imitabilityScore)
Schema: activitySystemSchema
```

**Cálculo de imitabilityScore (post-LLM, en código):**

```typescript
function computeImitability(map: ActivitySystemMap): number {
  // imitability = sum(reinforcements² ) / (n_activities²)
  // intuición: más conexiones cuadradas = más sistema interdependiente = más difícil copiar
  const n = map.coreChoices.length + map.supportingActivities.length;
  let conn = 0;
  for (const [_, refs] of Object.entries(map.reinforcementMatrix)) {
    conn += refs.length;
  }
  const density = conn / (n * (n - 1));   // edges / max possible
  // OE penaliza: si la mayoría son OE no hay strategic positioning
  const spRatio = Object.values(map.oeVsSp).filter(v => v === 'SP').length / n;
  return Math.min(1, density * 0.6 + spRatio * 0.4);
}
```

### 3.3 Code Quality Swarm (7 agentes)

Cada uno en `packages/agents/src/v3/agents/swarm/<name>.ts`:

| Agent | Model | Files consumed (via discovery) | Schema validated |
|-------|-------|--------------------------------|------------------|
| `db-architect.ts` | gemini-2.5-pro | `byCategory.migration`, `byCategory.model` (filtrado SQL/Prisma/Drizzle) | `dbFindingSchema[]` |
| `security-auditor.ts` | gemini-2.5-pro | `byCategory.route`, `byCategory.middleware`, .env templates | `securityFindingSchema[]` |
| `api-design-critic.ts` | gemini-2.5-flash | `byCategory.route` | `apiFindingSchema[]` |
| `performance-engineer.ts` | gemini-2.5-flash | `byCategory.service`, `byCategory.controller` | `perfFindingSchema[]` |
| `ml-readiness.ts` | gemini-2.5-flash | grep('model'|'embedding'|'transformer'|'.pkl'|'.onnx') | `mlFindingSchema[]` |
| `frontend-perf.ts` | gemini-2.5-flash | `byCategory.component` (.tsx, .vue, .svelte) | `frontendFindingSchema[]` |
| `observability.ts` | gemini-2.5-flash | grep('logger'|'metric'|'trace'|'sentry') | `obsFindingSchema[]` |

**Patrón común swarm finding:**

```typescript
export const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  severityRubric: z.string(),     // ← LLM debe justificar por qué este severity
  category: z.string(),
  title: z.string().max(120),
  description: z.string(),
  file: z.string().optional(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  evidence: z.string(),
  remediation: z.string(),
  whartonImpact: z.object({
    raisesWtp: z.boolean(),
    reducesCost: z.boolean(),
    affectsSwitchingCost: z.enum(['raises', 'lowers', 'neutral']),
    threatensSustainability: z.boolean(),
  }),
  estimatedEffort: z.enum(['hours', 'days', 'weeks']),
});
```

**Calibración severity (en system prompt de cada specialist):**

```
Usa estas rúbricas estrictas:
- critical: explotable/visible al usuario en <1 día con tooling público; pérdida de datos posible
- high: incidentes recurrentes esperados en <1 mes; requiere mitigación urgente
- medium: degradación medible pero sostenible; planificar en próximo sprint
- low: mejora de calidad, no urgente

Justifica el severity en `severityRubric` (1-2 oraciones).
```

### 3.4 Discovery Agent (Phase A del pipeline)

`packages/agents/src/v3/agents/code-cartographer.ts`

```
Input:  { projectPath }
Model:  ninguno (determinístico, usa code-discovery + git)
Output: DiscoveryResult { fileDiscovery, gitStats, dependencyGraph, monorepoStructure }
```

Esta info es input para todos los agentes posteriores y se guarda en `state.discovery`.

### 3.5 Registry V3

`packages/agents/src/v3/registry-v3.ts`

```typescript
export const V3_AGENTS = {
  // discovery
  'code-cartographer': runCodeCartographer,
  // wharton
  'customer-journey-mapper': runCustomerJourneyMapper,
  'info-flow-analyzer': runInfoFlowAnalyzer,
  'deeper-needs-laddering': runDeeperNeedsLaddering,
  'connected-experience-matrix': runConnectedExperienceMatrix,
  'tech-stack-mapper': runTechStackMapper,
  'revenue-model-architect': runRevenueModelArchitect,
  // competitive
  'industry-structure-analyst': runIndustryStructureAnalyst,
  'competitor-intelligence': runCompetitorIntelligence,
  'wtp-cost-driver-scorer': runWtpCostDriverScorer,
  'activity-system-mapper': runActivitySystemMapper,
  // swarm
  'db-architect': runDbArchitect,
  'security-auditor': runSecurityAuditor,
  'api-design-critic': runApiDesignCritic,
  'performance-engineer': runPerformanceEngineer,
  'ml-readiness': runMlReadiness,
  'frontend-perf': runFrontendPerf,
  'observability': runObservability,
} as const;
```

---

## VERIFICACIÓN

```bash
pnpm --filter @cs/agents exec tsc --noEmit
pnpm --filter @cs/agents test -- v3
```

Test smoke por cada agente: corre con un fixture mínimo y verifica que devuelve
JSON que pasa schema. Si Gemini no está disponible en el entorno de CI, mockea
provider con respuestas estructuradas.

```bash
# Smoke test integral
node -e "
const { runCustomerJourneyMapper } = require('./packages/agents/dist/v3/agents/customer-journey-mapper.js');
const ctx = makeMockCtx();
const out = await runCustomerJourneyMapper(
  { projectPath: process.cwd(), projectName: 'CS Analyzer', customerSegment: 'product manager', useCase: 'analyze own platform', competitorNames: ['Lenny\\'s Newsletter Tools'] },
  ctx
);
console.log(out.success ? 'OK' : out.error);
"
```

---

## ENTREGABLES

- [x] `packages/agents/src/v3/types.ts`
- [x] `packages/agents/src/v3/file-reader.ts`
- [x] `packages/agents/src/v3/llm-validated.ts`
- [x] `packages/agents/src/v3/code-discovery.ts`
- [x] 6 Wharton agents en `packages/agents/src/v3/agents/`
- [x] 4 Competitive Advantage agents en mismo dir
- [x] 7 Code Quality Swarm agents en `packages/agents/src/v3/agents/swarm/`
- [x] 1 Discovery agent (`code-cartographer`)
- [x] `packages/agents/src/v3/registry-v3.ts`
- [x] Tests por agente (mínimo: smoke con mock LLM provider)
- [x] V3_CHECKPOINT.md actualizado: PHASE-03 ✅
- [x] Commit: `feat(v3): phase 3 — 13 specialized agents (6 wharton + 4 ca + 7 swarm)`

---

## NOTAS PARA FASES SIGUIENTES

Anota en V3_CHECKPOINT.md:
- Si algún agente falló su smoke por SDK Gemini: documentar workaround
- Token estimate por agente (lo necesita PHASE-07 para cost dashboard)
- Cualquier zod schema que tuviste que relajar: documentar exactamente cuál

---

## TIPS PARA NO PERDERSE

- **Empieza por code-discovery + types + helpers** (3.0). Sin eso ningún agente compila.
- **Después un agente completo end-to-end** (sugerido: `info-flow-analyzer` — es el más
  simple). Ese te valida toda la infraestructura.
- **Después los demás en paralelo** — comparten el patrón.
- **NO copies el código de v2 swarm** — su file selection está rota; reescribe usando
  `code-discovery.byCategory`.
