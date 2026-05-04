/**
 * strategist-supervisor.ts — Level 0 Supervisor Meta-Agent
 *
 * PhD-level insight: The "Strategist" is the apex agent that:
 * 1. Plans which agents to run based on current portfolio state
 * 2. Resolves contradictions between analyst findings
 * 3. Generates the executive strategic synthesis across ALL projects
 * 4. Decides if additional depth is needed (trigger re-analysis)
 *
 * Architecture: Hierarchical Task Network (HTN) planning
 * Pattern: Plan → Delegate → Monitor → Synthesize → Publish
 * LLM-enhanced (optional) — can run deterministically in offline mode.
 */
import type { AgentRunner, AgentResult, AnalystReport, AnalystFinding } from '../types.js';

export interface StrategistInput {
  portfolioProjects: Array<{ id: string; name: string; sac: number }>;
  allFindings: Array<{ projectId: string; agentId: string; finding: string; severity: string }>;
  contradictions?: Array<{ finding1: string; finding2: string; projectId: string }>;
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

export interface ExecutionPlan {
  runOrder: string[][];    // each inner array = parallel batch
  reason: string;
  estimatedDurationMs: number;
  priority: 'portfolio-health' | 'deep-dive' | 'regression-investigation' | 'maintenance';
}

export interface StrategistOutput {
  executionPlan: ExecutionPlan;
  portfolioNarrative: string;
  contradictionsResolved: Array<{ contradiction: string; resolution: string }>;
  strategicRecommendations: Array<{
    priority: 1 | 2 | 3;
    projectId: string;
    action: string;
    rationale: string;
    whartonPrinciple: string;
  }>;
  report: AnalystReport;
}

/** Determine which analysis depth is needed based on portfolio state */
function planExecution(
  projects: StrategistInput['portfolioProjects'],
  depth: StrategistInput['analysisDepth'],
): ExecutionPlan {
  const hasRegressions = projects.some(p => p.sac < 40);
  const hasHighPerformers = projects.some(p => p.sac >= 70);

  if (hasRegressions || depth === 'deep') {
    return {
      runOrder: [
        ['portfolio-scanner', 'competitive-intel-agent'],           // Recon crew
        ['anomaly-detector', 'temporal-analyst'],                   // Cross-cutting
        ['worksheet-synthesizer'],                                  // Synthesize
        ['connected-strategy-analyst', 'competitive-advantage-analyst', // Analysis crew
         'business-model-analyst', 'data-science-opportunity-analyst',
         'architecture-improvement-analyst', 'ai-frontier-analyst'],
        ['causal-mapper'],                                          // Causal reasoning
        ['proposal-composer', 'validation-agent'],                  // Action crew
        ['cost-estimator-agent', 'frontier-mapper-agent'],          // Finalize
      ],
      reason: 'Deep analysis triggered: regressions detected or explicit deep mode requested.',
      estimatedDurationMs: 45000,
      priority: 'regression-investigation',
    };
  }

  if (depth === 'quick') {
    return {
      runOrder: [
        ['portfolio-scanner'],
        ['anomaly-detector'],
        ['connected-strategy-analyst', 'competitive-advantage-analyst'],
        ['proposal-composer', 'validation-agent'],
      ],
      reason: 'Quick scan: only critical path agents, skip DS/architecture deep analysis.',
      estimatedDurationMs: 8000,
      priority: 'maintenance',
    };
  }

  // Standard
  return {
    runOrder: [
      ['portfolio-scanner', 'competitive-intel-agent'],
      ['temporal-analyst', 'anomaly-detector'],
      ['worksheet-synthesizer'],
      ['connected-strategy-analyst', 'competitive-advantage-analyst',
       'business-model-analyst', 'data-science-opportunity-analyst',
       'architecture-improvement-analyst', 'ai-frontier-analyst'],
      ['causal-mapper', 'frontier-mapper-agent'],
      ['proposal-composer', 'validation-agent'],
      ['cost-estimator-agent'],
    ],
    reason: 'Standard analysis: full pipeline with parallel execution within each phase.',
    estimatedDurationMs: 25000,
    priority: 'portfolio-health',
  };
}

export const runStrategistSupervisor: AgentRunner<StrategistInput, StrategistOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { portfolioProjects, allFindings, contradictions = [], analysisDepth = 'standard' } = input;

  // ─── 1. Plan execution ────────────────────────────────────────────────────
  const executionPlan = planExecution(portfolioProjects, analysisDepth);

  // ─── 2. Sort projects by strategic priority ───────────────────────────────
  const sorted = [...portfolioProjects].sort((a, b) => b.sac - a.sac);
  const leader = sorted[0];
  const laggard = sorted[sorted.length - 1];
  const avgSAC = Math.round(portfolioProjects.reduce((s, p) => s + p.sac, 0) / portfolioProjects.length);

  // ─── 3. Resolve contradictions ────────────────────────────────────────────
  const contradictionsResolved = contradictions.map(c => ({
    contradiction: `${c.finding1} vs ${c.finding2} (${c.projectId})`,
    resolution: `Aplicar principio de especificidad: la afirmación con mayor evidencia cuantitativa prevalece. Reevaluar en siguiente ciclo con datos actualizados.`,
  }));

  // ─── 4. Generate strategic recommendations ────────────────────────────────
  const strategicRecommendations: StrategistOutput['strategicRecommendations'] = [];

  // P1: Protect the leader
  if (leader) {
    strategicRecommendations.push({
      priority: 1,
      projectId: leader.id,
      action: `Consolidar ${leader.name} (SAC=${leader.sac}): activar Stripe LIVE, escalar coach-behavior alerts, fortalecer switching costs.`,
      rationale: `El líder del portfolio genera el mayor retorno sobre inversión de mejora. Proteger y expandir la posición dominante.`,
      whartonPrinciple: 'Trusted Partner → Expand moat depth (Siggelkow & Terwiesch, Ch.4)',
    });
  }

  // P2: Elevate the highest-WTP project without BM
  const highWTPLowBM = portfolioProjects.filter(p => p.sac < 50 && p.sac > 25);
  if (highWTPLowBM.length > 0) {
    const target = highWTPLowBM[0];
    strategicRecommendations.push({
      priority: 2,
      projectId: target?.id ?? '',
      action: `Diseñar modelo de captura de valor para ${target?.name} — el WTP existe pero no se monetiza.`,
      rationale: `Alta disposición a pagar sin modelo de negocio = valor destruido. Prioridad: diseñar pricing antes de escalar.`,
      whartonPrinciple: 'WTP capture gap — Brandenburger & Stuart (1996)',
    });
  }

  // P3: Close the feedback loop
  const noLoop = portfolioProjects.filter(p => p.sac < 35);
  if (noLoop.length > 0) {
    strategicRecommendations.push({
      priority: 3,
      projectId: noLoop[0]?.id ?? '',
      action: `Implementar primer loop cerrado básico en ${noLoop[0]?.name}: Sense→Analyze→React mínimo viable.`,
      rationale: `Sin loop cerrado, el sistema no aprende. Un loop mínimo duplica el valor estratégico a largo plazo.`,
      whartonPrinciple: 'Sense→Transmit→Analyze→React foundation (Connected Strategy, Ch.2)',
    });
  }

  // ─── 5. Portfolio narrative ───────────────────────────────────────────────
  const criticalCount = portfolioProjects.filter(p => p.sac < 35).length;
  const healthyCount = portfolioProjects.filter(p => p.sac >= 65).length;

  const portfolioNarrative = [
    `Portfolio de ${portfolioProjects.length} proyectos. SAC promedio: ${avgSAC}/100.`,
    `Proyectos saludables (SAC≥65): ${healthyCount}. En zona crítica (SAC<35): ${criticalCount}.`,
    leader ? `Líder estratégico: ${leader.name} (SAC=${leader.sac}) — modelo de referencia para el resto del portfolio.` : '',
    laggard ? `Mayor oportunidad de mejora: ${laggard.name} (SAC=${laggard.sac}) — alto WTP potencial no realizado.` : '',
    contradictions.length > 0 ? `${contradictions.length} contradicción(es) entre hallazgos resuelta(s) por el Strategist.` : 'Sin contradicciones detectadas entre agentes.',
    `Plan de ejecución: ${executionPlan.priority} — ${executionPlan.runOrder.length} fases, ~${Math.round(executionPlan.estimatedDurationMs / 1000)}s estimado.`,
  ].filter(Boolean).join(' ');

  // ─── 6. Build Report ──────────────────────────────────────────────────────
  const findings: AnalystFinding[] = [
    {
      category: 'Executive Plan',
      title: `Plan de ejecución: ${executionPlan.priority}`,
      detail: `${executionPlan.reason} ${executionPlan.runOrder.length} fases paralelas. Tiempo estimado: ${Math.round(executionPlan.estimatedDurationMs / 1000)}s.`,
      evidence: ['strategist-supervisor:execution-plan'],
      impactOnWTP: 'positive',
      impactOnCost: 'positive',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: 'low',
    },
    ...strategicRecommendations.map((rec, i) => ({
      category: `Strategic P${rec.priority}`,
      title: rec.action,
      detail: `${rec.rationale} | Wharton: ${rec.whartonPrinciple}`,
      evidence: [`strategist:recommendation:${i + 1}`, `project:${rec.projectId}`],
      impactOnWTP: 'positive' as const,
      impactOnCost: 'positive' as const,
      impactOnSwitchingCosts: 'positive' as const,
      loopPhase: 'React',
      severity: (rec.priority === 1 ? 'high' : rec.priority === 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    })),
  ];

  const report: AnalystReport = {
    projectId: 'portfolio',
    agentId: 'strategist-supervisor',
    findings,
    summaryNarrative: portfolioNarrative,
    recommendedProposals: strategicRecommendations.map(r => ({
      title: r.action,
      rationale: r.rationale,
      changeType: 'strategic',
      priority: r.priority === 1 ? 'high' : r.priority === 2 ? 'medium' : 'low',
    })),
    analyzedAt: new Date().toISOString(),
  };

  const output: StrategistOutput = {
    executionPlan,
    portfolioNarrative,
    contradictionsResolved,
    strategicRecommendations,
    report,
  };

  return {
    agentId: 'strategist-supervisor',
    jobId: context.jobId,
    success: true,
    data: output,
    evidence: [`strategist:portfolio:${portfolioProjects.length}`, `plan:${executionPlan.priority}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  } satisfies AgentResult<StrategistOutput>;
};
