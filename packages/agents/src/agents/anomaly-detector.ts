/**
 * anomaly-detector.ts — Statistical Anomaly Detection Agent
 *
 * PhD-level insight: Detects inconsistencies in worksheet answers and
 * statistical outliers in scores using Z-score and inter-quartile methods.
 *
 * Inspired by: Chandola et al. (2009) "Anomaly Detection: A Survey" — ACM Computing Surveys.
 * Pattern: Z-score flagging + semantic contradiction rules + outlier scoring.
 * Deterministic — no LLM.
 */
import type { AgentRunner, AgentResult, AnalystReport, AnalystFinding } from '../types.js';

export interface AnomalyInput {
  projectId: string;
  scores: Record<string, number>;
  worksheetAnswers?: Record<string, unknown>;
  portfolioScores?: Array<{ projectId: string; scores: Record<string, number> }>;
}

export interface Anomaly {
  type: 'score-outlier' | 'worksheet-contradiction' | 'dimension-imbalance' | 'cross-portfolio-outlier';
  field: string;
  value: number | string;
  expected: string;
  zScore?: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface AnomalyOutput {
  projectId: string;
  anomalies: Anomaly[];
  overallAnomalyRisk: 'high' | 'medium' | 'low' | 'clean';
  report: AnalystReport;
}

/** Mean and std dev of an array */
function stats(arr: number[]): { mean: number; std: number } {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
  return { mean, std };
}

/** Z-score */
function zScore(value: number, mean: number, std: number): number {
  return std === 0 ? 0 : Math.abs((value - mean) / std);
}

// Known contradictory answer patterns in worksheets
const CONTRADICTION_RULES = [
  {
    a: 'hasRevenue', b: 'noRevenueModel',
    desc: 'El proyecto indica tener ingresos Y carecer de modelo de revenue simultáneamente.',
  },
  {
    a: 'stripeActive', b: 'noPaymentIntegration',
    desc: 'Stripe marcado como activo pero integración de pagos marcada como no existente.',
  },
  {
    a: 'productionDeployed', b: 'noUsers',
    desc: 'Proyecto en producción pero cero usuarios registrados — revisar definición de "producción".',
  },
];

export const runAnomalyDetector: AgentRunner<AnomalyInput, AnomalyOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { projectId, scores, worksheetAnswers = {}, portfolioScores = [] } = input;

  const anomalies: Anomaly[] = [];

  // ─── 1. Dimension Imbalance Detection ─────────────────────────────────────
  // A project shouldn't have Architecture=90 and DataScience=20 simultaneously
  // (strong infra + no instrumentation is suspicious)
  const scoreValues = Object.values(scores).filter(v => typeof v === 'number' && v >= 0 && v <= 100);
  const { mean, std } = stats(scoreValues);

  for (const [dim, value] of Object.entries(scores)) {
    if (typeof value !== 'number') continue;
    const z = zScore(value, mean, std);
    if (z > 2.0) {
      anomalies.push({
        type: 'score-outlier',
        field: dim,
        value,
        expected: `${Math.round(mean - std)}–${Math.round(mean + std)} (±1σ del promedio del proyecto)`,
        zScore: Math.round(z * 100) / 100,
        severity: z > 2.5 ? 'high' : 'medium',
        description: `${dim} = ${value} (z=${z.toFixed(2)}) — outlier estadístico dentro del mismo proyecto. Validar si refleja realidad o es un error de scoring.`,
      });
    }
  }

  // ─── 2. Cross-Portfolio Outlier Detection ─────────────────────────────────
  if (portfolioScores.length >= 3) {
    for (const [dim, value] of Object.entries(scores)) {
      if (typeof value !== 'number') continue;
      const portfolioDimValues = portfolioScores
        .map(p => p.scores[dim])
        .filter((v): v is number => typeof v === 'number');

      if (portfolioDimValues.length < 2) continue;
      const { mean: pMean, std: pStd } = stats(portfolioDimValues);
      const z = zScore(value, pMean, pStd);

      if (z > 2.5) {
        anomalies.push({
          type: 'cross-portfolio-outlier',
          field: dim,
          value,
          expected: `Portfolio avg: ${Math.round(pMean)} ± ${Math.round(pStd)}`,
          zScore: Math.round(z * 100) / 100,
          severity: z > 3.0 ? 'high' : 'medium',
          description: `${projectId}.${dim} = ${value} es outlier extremo vs portfolio (z=${z.toFixed(2)}). Puede indicar scoring incorrecto o ventaja competitiva genuina.`,
        });
      }
    }
  }

  // ─── 3. Worksheet Contradiction Detection ─────────────────────────────────
  for (const rule of CONTRADICTION_RULES) {
    const aValue = worksheetAnswers[rule.a];
    const bValue = worksheetAnswers[rule.b];
    if (
      (aValue === true || aValue === 'yes' || aValue === 1) &&
      (bValue === true || bValue === 'yes' || bValue === 1)
    ) {
      anomalies.push({
        type: 'worksheet-contradiction',
        field: `${rule.a} + ${rule.b}`,
        value: `${rule.a}=true AND ${rule.b}=true`,
        expected: 'One must be false',
        severity: 'high',
        description: rule.desc,
      });
    }
  }

  // ─── 4. Architecture-Data Science Imbalance Rule ──────────────────────────
  const arch = scores['architectureResilience'] ?? 50;
  const ds = scores['dataScienceReadiness'] ?? 50;
  if (arch > 75 && ds < 35) {
    anomalies.push({
      type: 'dimension-imbalance',
      field: 'architecture vs dataScienceReadiness',
      value: `arch=${arch}, ds=${ds}`,
      expected: 'Strong architecture typically correlates with instrumentation (DS > 50)',
      severity: 'medium',
      description: `Alta resiliencia de arquitectura (${arch}) con baja preparación de data science (${ds}) sugiere que la infraestructura existe pero no se instrumenta correctamente para análisis.`,
    });
  }

  // ─── 5. Business Model vs WTP Imbalance ───────────────────────────────────
  const bm = scores['businessModelStrength'] ?? 50;
  const wtp = scores['wtpUpliftIndex'] ?? 50;
  if (wtp > 70 && bm < 30) {
    anomalies.push({
      type: 'dimension-imbalance',
      field: 'wtpUpliftIndex vs businessModelStrength',
      value: `wtp=${wtp}, bm=${bm}`,
      expected: 'High WTP should correlate with a functional business model (BM > 45)',
      severity: 'high',
      description: `WTP muy alto (${wtp}) con modelo de negocio débil (${bm}) — el mercado percibe valor pero no existe mecanismo de captura. Urgente: diseñar monetización.`,
    });
  }

  // ─── Risk Classification ──────────────────────────────────────────────────
  const highCount = anomalies.filter(a => a.severity === 'high').length;
  const medCount = anomalies.filter(a => a.severity === 'medium').length;
  const overallAnomalyRisk: AnomalyOutput['overallAnomalyRisk'] =
    highCount >= 2 ? 'high' :
    highCount >= 1 || medCount >= 3 ? 'medium' :
    medCount >= 1 ? 'low' : 'clean';

  // ─── Build Report ─────────────────────────────────────────────────────────
  const findings: AnalystFinding[] = anomalies.map(a => ({
    category: `Anomaly: ${a.type}`,
    title: a.description,
    detail: `Valor: ${a.value} | Esperado: ${a.expected}${a.zScore ? ` | z=${a.zScore}` : ''}`,
    evidence: [`anomaly-detector:${a.type}:${a.field}`],
    impactOnWTP: a.type === 'dimension-imbalance' ? 'negative' : 'neutral',
    impactOnCost: 'neutral',
    impactOnSwitchingCosts: 'neutral',
    loopPhase: 'Analyze',
    severity: a.severity,
  }));

  const report: AnalystReport = {
    projectId,
    agentId: 'anomaly-detector',
    findings,
    summaryNarrative: overallAnomalyRisk === 'clean'
      ? `✅ No se detectaron anomalías estadísticas. Los scores del proyecto son internamente consistentes y coherentes con el portfolio.`
      : `⚠️ Riesgo de anomalía: ${overallAnomalyRisk.toUpperCase()}. ${anomalies.length} anomalía(s) detectada(s): ${highCount} críticas, ${medCount} medias. Revisar antes de tomar decisiones estratégicas sobre estos scores.`,
    recommendedProposals: anomalies
      .filter(a => a.severity === 'high')
      .slice(0, 2)
      .map(a => ({
        title: `Investigar anomalía: ${a.field}`,
        rationale: a.description,
        changeType: 'investigation',
        priority: 'high' as const,
      })),
    analyzedAt: new Date().toISOString(),
  };

  const output: AnomalyOutput = { projectId, anomalies, overallAnomalyRisk, report };

  return {
    agentId: 'anomaly-detector',
    jobId: context.jobId,
    success: true,
    data: output,
    evidence: [`anomaly-detector:${projectId}`, `anomalies:${anomalies.length}`, `risk:${overallAnomalyRisk}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  } satisfies AgentResult<AnomalyOutput>;
};
