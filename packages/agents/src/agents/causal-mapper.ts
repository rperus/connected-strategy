/**
 * causal-mapper.ts — Causal Graph Agent
 *
 * PhD-level insight: Replaces the flat weighted-average SAC with a
 * Directed Acyclic Graph (DAG) that models actual causal dependencies
 * between strategic dimensions.
 *
 * Theory: Pearl (2000) "Causality", Judea Pearl's do-calculus.
 * Applied: Architecture → Data Science → Business Model (if arch strong,
 *           DS opportunities are accessible; if DS strong, BM has data moat)
 *
 * Key upgrade vs current system:
 * - Current: SAC = weighted_avg(CE, CLM, SCI, WTP, CR, CP, BM, DS, AR)
 * - New: SAC = f(causal_dag) where each dimension's effective score is
 *         conditioned on its causal parents
 *
 * Deterministic — no LLM.
 */
import type { AgentRunner, AgentResult, AnalystReport, AnalystFinding } from '../types.js';

export interface CausalInput {
  projectId: string;
  scores: Record<string, number>;
}

interface CausalEdge {
  from: string;
  to: string;
  weight: number;       // 0-1: how much 'from' amplifies 'to'
  type: 'enables' | 'amplifies' | 'constrains' | 'blocks';
  explanation: string;
}

export interface CausalDimension {
  dimension: string;
  rawScore: number;
  causalScore: number;    // adjusted by parent scores
  causalBoost: number;    // delta from raw (can be negative)
  causalParents: string[];
  explanation: string;
}

export interface CausalOutput {
  projectId: string;
  dag: CausalEdge[];
  dimensions: CausalDimension[];
  causalSAC: number;           // new SAC using causal model
  flatSAC: number;             // original weighted-average SAC
  sacDelta: number;            // causalSAC - flatSAC
  insight: string;
  report: AnalystReport;
}

// ─── The Causal DAG for Connected Strategy dimensions ──────────────────────────
//
// Based on Wharton Connected Strategy + Porter + Brandenburger:
//
// Architecture → Data Science  (strong infra unlocks DS instrumentation)
// Architecture → Closed Loop   (resilient infra enables sensing pipeline)
// Data Science → Business Model (DS assets create data moat → BM strength)
// Data Science → WTP            (better ML/analytics → higher WTP perception)
// Closed Loop  → WTP            (faster reaction → perceived higher value)
// Closed Loop  → Switching Cost (loop lock-in creates habit + data lock)
// WTP          → Competitive Pos (high WTP → better competitive positioning)
// Switching Cost → Business Model (lock-in → revenue predictability)
// Connected Exp → Switching Cost  (connected experience creates habits)
// Cost Reduction → Business Model (lower cost → higher margin → stronger BM)

const CAUSAL_DAG: CausalEdge[] = [
  { from: 'architectureResilience', to: 'dataScienceReadiness',       weight: 0.30, type: 'enables',    explanation: 'Sólida infraestructura (CI/CD, tests, observabilidad) hace posible instrumentar datos correctamente para análisis.' },
  { from: 'architectureResilience', to: 'closedLoopMaturity',         weight: 0.20, type: 'enables',    explanation: 'Arquitectura resiliente permite implementar pipelines de sensing sin riesgo de regresión.' },
  { from: 'dataScienceReadiness',   to: 'businessModelStrength',      weight: 0.25, type: 'amplifies',  explanation: 'Activos de datos propietarios (modelos ML, corpus vectorizado) crean moat defensible → BM más fuerte.' },
  { from: 'dataScienceReadiness',   to: 'wtpUpliftIndex',             weight: 0.20, type: 'amplifies',  explanation: 'Mejores modelos de matching/análisis → mayor valor percibido por el usuario → WTP más alto.' },
  { from: 'closedLoopMaturity',     to: 'wtpUpliftIndex',             weight: 0.15, type: 'amplifies',  explanation: 'Loop cerrado significa reacción más rápida y proactiva → experiencia superior → WTP sube.' },
  { from: 'closedLoopMaturity',     to: 'switchingCostIndex',         weight: 0.25, type: 'amplifies',  explanation: 'El loop cerrado acumula datos del usuario (historia, preferencias) creando data lock y habit formation.' },
  { from: 'wtpUpliftIndex',         to: 'competitivePositioningIndex',weight: 0.30, type: 'amplifies',  explanation: 'Mayor WTP = diferenciación percibida = mejor posicionamiento competitivo.' },
  { from: 'switchingCostIndex',     to: 'businessModelStrength',      weight: 0.20, type: 'amplifies',  explanation: 'Alto switching cost → retención predictable → ingresos recurrentes → BM fuerte.' },
  { from: 'connectedExperienceScore','to': 'switchingCostIndex',      weight: 0.15, type: 'amplifies',  explanation: 'Experiencia conectada crea hábitos (habit formation) y dependencia de datos acumulados.' },
  { from: 'costReductionPotential', to: 'businessModelStrength',      weight: 0.15, type: 'amplifies',  explanation: 'Reducción de costos operativos → mayor margen → modelo de negocio más sostenible.' },
];

// Dimension weights for final SAC calculation
const DIM_WEIGHTS: Record<string, number> = {
  connectedExperienceScore:     0.15,
  closedLoopMaturity:           0.15,
  switchingCostIndex:           0.10,
  wtpUpliftIndex:               0.15,
  costReductionPotential:       0.10,
  competitivePositioningIndex:  0.10,
  businessModelStrength:        0.10,
  dataScienceReadiness:         0.10,
  architectureResilience:       0.05,
};

export const runCausalMapper: AgentRunner<CausalInput, CausalOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { projectId, scores } = input;

  // Compute causal score adjustments
  // For each dimension, find edges where it is the 'to' node
  // causal_boost = sum(weight_i * max(0, parent_i_score - 50) / 50) for all parents
  // i.e., each parent that scores above 50 provides a proportional boost

  const causalScores: Record<string, number> = { ...scores };

  // Process in topological order (approximated by fixed order)
  const topoOrder = [
    'architectureResilience',
    'dataScienceReadiness',
    'closedLoopMaturity',
    'connectedExperienceScore',
    'costReductionPotential',
    'wtpUpliftIndex',
    'switchingCostIndex',
    'competitivePositioningIndex',
    'businessModelStrength',
  ];

  const dimensions: CausalDimension[] = [];

  for (const dim of topoOrder) {
    const rawScore = scores[dim] ?? 50;
    const parentEdges = CAUSAL_DAG.filter(e => e.to === dim);

    let causalBoost = 0;
    const causalParents: string[] = [];

    for (const edge of parentEdges) {
      const parentScore = causalScores[edge.from] ?? scores[edge.from] ?? 50;
      // Boost = edge.weight * (parentScore - 50) / 50
      // Positive if parent > 50, negative if parent < 50
      const rawBoost = edge.weight * ((parentScore - 50) / 50) * 15; // max ±15 pts
      causalBoost += rawBoost;
      causalParents.push(edge.from);
    }

    // Apply boost (clamp to 0-100)
    const causalScore = Math.max(0, Math.min(100, rawScore + causalBoost));
    causalScores[dim] = causalScore;

    const primaryEdge = parentEdges[0];
    dimensions.push({
      dimension: dim,
      rawScore,
      causalScore: Math.round(causalScore * 10) / 10,
      causalBoost: Math.round(causalBoost * 10) / 10,
      causalParents,
      explanation: primaryEdge
        ? primaryEdge.explanation
        : 'Dimensión raíz — sin padres causales en el DAG.',
    });
  }

  // Compute flat SAC (weighted average of raw scores)
  const flatSAC = Math.round(
    Object.entries(DIM_WEIGHTS).reduce((sum, [dim, w]) => sum + (scores[dim] ?? 50) * w, 0)
  );

  // Compute causal SAC (weighted average of causal scores)
  const causalSAC = Math.round(
    Object.entries(DIM_WEIGHTS).reduce((sum, [dim, w]) => sum + (causalScores[dim] ?? scores[dim] ?? 50) * w, 0)
  );

  const sacDelta = causalSAC - flatSAC;

  // ─── Find top causal insight ───────────────────────────────────────────────
  const biggestBoost = [...dimensions].sort((a, b) => Math.abs(b.causalBoost) - Math.abs(a.causalBoost))[0];
  const strongestEdge = [...CAUSAL_DAG].sort((a, b) => {
    const scoreA = causalScores[a.from] ?? 50;
    const scoreB = causalScores[b.from] ?? 50;
    return scoreB - scoreA;
  })[0];

  const insight = sacDelta > 3
    ? `El modelo causal eleva el SAC de ${flatSAC} a ${causalSAC} (+${sacDelta}) — el proyecto tiene ventajas causales latentes. Mayor impacto: ${biggestBoost?.dimension} (+${biggestBoost?.causalBoost?.toFixed(1)} pts vía ${biggestBoost?.causalParents?.join(', ')}).`
    : sacDelta < -3
    ? `El modelo causal reduce el SAC de ${flatSAC} a ${causalSAC} (${sacDelta}) — hay constrains causales activos. Dimensiones débiles deprimen a sus hijos en el DAG.`
    : `El modelo causal produce SAC similar al plano (${causalSAC} vs ${flatSAC}). Estructura causal en equilibrio.`;

  // ─── Build Report ─────────────────────────────────────────────────────────
  const findings: AnalystFinding[] = dimensions
    .filter(d => Math.abs(d.causalBoost) >= 3)
    .map(d => ({
      category: d.causalBoost > 0 ? 'Causal Boost' : 'Causal Drag',
      title: `${d.dimension}: ${d.causalBoost > 0 ? '+' : ''}${d.causalBoost.toFixed(1)} pts (causal adj.)`,
      detail: d.explanation,
      evidence: d.causalParents.map(p => `causal-edge:${p}→${d.dimension}`),
      impactOnWTP: d.dimension === 'wtpUpliftIndex' && d.causalBoost > 0 ? 'positive' : 'neutral',
      impactOnCost: d.dimension === 'costReductionPotential' && d.causalBoost > 0 ? 'positive' : 'neutral',
      impactOnSwitchingCosts: d.dimension === 'switchingCostIndex' && d.causalBoost > 0 ? 'positive' : 'neutral',
      loopPhase: 'Analyze',
      severity: Math.abs(d.causalBoost) >= 8 ? 'high' : 'medium',
    }));

  // Add SAC comparison finding
  findings.unshift({
    category: 'Causal SAC',
    title: `SAC Causal: ${causalSAC} vs SAC Plano: ${flatSAC} (Δ${sacDelta >= 0 ? '+' : ''}${sacDelta})`,
    detail: insight,
    evidence: ['causal-mapper:dag-computed', `dag-edges:${CAUSAL_DAG.length}`],
    impactOnWTP: sacDelta > 0 ? 'positive' : sacDelta < 0 ? 'negative' : 'neutral',
    impactOnCost: 'neutral',
    impactOnSwitchingCosts: 'neutral',
    loopPhase: 'Analyze',
    severity: Math.abs(sacDelta) >= 10 ? 'high' : 'medium',
  });

  const report: AnalystReport = {
    projectId,
    agentId: 'causal-mapper',
    findings,
    summaryNarrative: insight,
    recommendedProposals: [
      ...(strongestEdge ? [{
        title: `Maximizar ${strongestEdge.from} para amplificar ${strongestEdge.to}`,
        rationale: `La arista causal más fuerte del DAG. ${strongestEdge.explanation}`,
        changeType: 'strategic-leverage',
        priority: 'high' as const,
      }] : []),
    ],
    analyzedAt: new Date().toISOString(),
  };

  const output: CausalOutput = {
    projectId, dag: CAUSAL_DAG, dimensions, causalSAC, flatSAC, sacDelta, insight, report,
  };

  return {
    agentId: 'causal-mapper',
    jobId: context.jobId,
    success: true,
    data: output,
    evidence: [`causal-mapper:${projectId}`, `dag-edges:${CAUSAL_DAG.length}`, `causal-sac:${causalSAC}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  } satisfies AgentResult<CausalOutput>;
};
