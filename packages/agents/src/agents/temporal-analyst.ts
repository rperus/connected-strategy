/**
 * temporal-analyst.ts — Temporal Analysis Agent
 *
 * PhD-level insight: Detects score trends, regressions, and inflection points
 * by comparing current analysis against historical runs stored in SQLite.
 *
 * Pattern: Statistical time-series comparison + anomaly-based alert generation.
 * All deterministic — no LLM required.
 */
import type { AgentRunner, AgentResult, AnalystReport, AnalystFinding } from '../types.js';

export interface TemporalInput {
  projectId: string;
  currentScores: Record<string, number>;
  historicalRuns?: Array<{
    runAt: string;
    scores: Record<string, number>;
  }>;
}

export interface TemporalOutput {
  projectId: string;
  trends: Array<{
    dimension: string;
    direction: 'improving' | 'declining' | 'stable' | 'volatile';
    delta: number;
    deltaPercent: number;
    runsAnalyzed: number;
    insight: string;
  }>;
  regressions: string[];
  inflectionPoints: string[];
  report: AnalystReport;
}

const DIMENSION_LABELS: Record<string, string> = {
  connectedExperienceScore:     'Connected Experience',
  closedLoopMaturity:           'Closed Loop Maturity',
  switchingCostIndex:           'Switching Cost Index',
  wtpUpliftIndex:               'WTP Uplift',
  costReductionPotential:       'Cost Reduction',
  competitivePositioningIndex:  'Competitive Positioning',
  businessModelStrength:        'Business Model',
  dataScienceReadiness:         'Data Science Readiness',
  architectureResilience:       'Architecture Resilience',
  strategicAdvantageComposite:  'SAC (Composite)',
};

export const runTemporalAnalyst: AgentRunner<TemporalInput, TemporalOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { projectId, currentScores, historicalRuns = [] } = input;

  const findings: AnalystFinding[] = [];
  const trends: TemporalOutput['trends'] = [];
  const regressions: string[] = [];
  const inflectionPoints: string[] = [];

  if (historicalRuns.length === 0) {
    // First run — establish baseline
    findings.push({
      category: 'Temporal Baseline',
      title: 'Primera ejecución registrada',
      detail: `Baseline establecido para ${projectId}. Las próximas ejecuciones compararán contra este snapshot. SAC actual: ${currentScores['strategicAdvantageComposite'] ?? 'N/A'}.`,
      evidence: ['temporal-analyst: first-run-baseline'],
      impactOnWTP: 'neutral',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'low',
    });
  } else {
    const lastRun = historicalRuns[historicalRuns.length - 1];
    const prevScores = lastRun?.scores ?? {};

    for (const [dim, current] of Object.entries(currentScores)) {
      const prev = prevScores[dim];
      if (prev === undefined) continue;

      const delta = current - prev;
      const deltaPercent = prev > 0 ? (delta / prev) * 100 : 0;
      const label = DIMENSION_LABELS[dim] ?? dim;

      let direction: TemporalOutput['trends'][0]['direction'] = 'stable';
      if (Math.abs(delta) < 2) direction = 'stable';
      else if (delta > 0) direction = 'improving';
      else direction = 'declining';

      // Detect inflection: large swing
      if (Math.abs(delta) >= 10) {
        inflectionPoints.push(`${label}: ${delta > 0 ? '+' : ''}${delta.toFixed(0)} pts`);
      }

      // Detect regression
      if (delta <= -5) {
        regressions.push(label);
        findings.push({
          category: 'Score Regression',
          title: `Regresión detectada: ${label}`,
          detail: `${label} bajó ${Math.abs(delta).toFixed(1)} pts (de ${prev} → ${current}, ${deltaPercent.toFixed(1)}%). Investigar causa raíz antes de continuar.`,
          evidence: [`temporal-analyst: regression:${dim}`, `prev:${prev}`, `current:${current}`],
          impactOnWTP: dim === 'wtpUpliftIndex' ? 'negative' : 'neutral',
          impactOnCost: dim === 'costReductionPotential' ? 'negative' : 'neutral',
          impactOnSwitchingCosts: dim === 'switchingCostIndex' ? 'negative' : 'neutral',
          loopPhase: 'Analyze',
          severity: Math.abs(delta) >= 10 ? 'high' : 'medium',
        });
      }

      if (direction === 'improving' && delta >= 5) {
        findings.push({
          category: 'Score Improvement',
          title: `Mejora confirmada: ${label}`,
          detail: `${label} mejoró +${delta.toFixed(1)} pts (${prev} → ${current}). Identificar qué cambio lo causó y replicarlo en otros proyectos.`,
          evidence: [`temporal-analyst: improvement:${dim}`],
          impactOnWTP: 'positive',
          impactOnCost: 'positive',
          impactOnSwitchingCosts: 'positive',
          loopPhase: 'React',
          severity: 'low',
        });
      }

      trends.push({
        dimension: label,
        direction,
        delta,
        deltaPercent,
        runsAnalyzed: historicalRuns.length,
        insight: direction === 'stable'
          ? `${label} estable (±${Math.abs(delta).toFixed(1)} pts). Sin cambio significativo.`
          : direction === 'improving'
          ? `${label} mejorando +${delta.toFixed(1)} pts vs última ejecución.`
          : `${label} en declive −${Math.abs(delta).toFixed(1)} pts. Atención requerida.`,
      });
    }

    // SAC trend summary
    const sacCurrent = currentScores['strategicAdvantageComposite'] ?? 0;
    const sacPrev = prevScores['strategicAdvantageComposite'] ?? 0;
    const sacDelta = sacCurrent - sacPrev;
    findings.unshift({
      category: 'Executive Trend',
      title: `SAC ${sacDelta >= 0 ? '▲' : '▼'} ${Math.abs(sacDelta).toFixed(1)} vs última ejecución`,
      detail: `Strategic Advantage Composite: ${sacPrev} → ${sacCurrent} (${sacDelta >= 0 ? '+' : ''}${sacDelta.toFixed(1)} pts). Tendencia general: ${regressions.length === 0 ? '✅ Sin regresiones' : `⚠️ ${regressions.length} dimensiones en declive`}.`,
      evidence: ['temporal-analyst: sac-trend'],
      impactOnWTP: sacDelta > 0 ? 'positive' : 'negative',
      impactOnCost: sacDelta > 0 ? 'positive' : 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: regressions.length > 0 ? 'high' : 'low',
    });
  }

  const report: AnalystReport = {
    projectId,
    agentId: 'temporal-analyst',
    findings,
    summaryNarrative: historicalRuns.length === 0
      ? `Baseline establecido. Ejecuta el pipeline regularmente para detectar tendencias a partir de la segunda ejecución.`
      : `Análisis temporal sobre ${historicalRuns.length} ejecución(es) histórica(s). ${regressions.length > 0 ? `ALERTA: ${regressions.join(', ')} en declive.` : 'Sin regresiones detectadas.'} ${inflectionPoints.length > 0 ? `Puntos de inflexión: ${inflectionPoints.join(', ')}.` : ''}`,
    recommendedProposals: regressions.map(dim => ({
      title: `Investigar regresión en: ${dim}`,
      rationale: `Score declined since last run — needs causal root analysis before next implementation cycle.`,
      changeType: 'investigation',
      priority: 'high' as const,
    })),
    analyzedAt: new Date().toISOString(),
  };

  const output: TemporalOutput = { projectId, trends, regressions, inflectionPoints, report };

  return {
    agentId: 'temporal-analyst',
    jobId: context.jobId,
    success: true,
    data: output,
    evidence: [`temporal-analyst:${projectId}`, `runs-analyzed:${historicalRuns.length}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  } satisfies AgentResult<TemporalOutput>;
};
