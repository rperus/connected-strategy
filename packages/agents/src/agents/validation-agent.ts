/**
 * validation-agent.ts — Proposal Validation Agent
 *
 * PhD-level insight: Cross-references all proposals for logical contradictions,
 * redundancy, and feasibility. Applies formal constraint-checking.
 *
 * This is the "sanity gate" before proposals reach the user.
 * Pattern: Constraint satisfaction + semantic overlap detection.
 * Deterministic — no LLM.
 */
import type { AgentRunner, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { ImprovementProposal } from '@cs/domain';

export interface ValidationInput {
  projectId: string;
  proposals: ImprovementProposal[];
}

export interface ValidationIssue {
  type: 'contradiction' | 'redundancy' | 'infeasible' | 'missing-evidence' | 'vague-criteria';
  severity: 'high' | 'medium' | 'low';
  proposalIds: string[];
  description: string;
  suggestion: string;
}

export interface ValidationOutput {
  projectId: string;
  validProposals: ImprovementProposal[];
  flaggedProposals: Array<{ proposal: ImprovementProposal; issues: ValidationIssue[] }>;
  issues: ValidationIssue[];
  passRate: number;
  report: AnalystReport;
}

/** Detect semantic overlap between two strings (simple token-based Jaccard) */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export const runValidationAgent: AgentRunner<ValidationInput, ValidationOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { projectId, proposals } = input;

  const allIssues: ValidationIssue[] = [];
  const flagMap: Map<string, ValidationIssue[]> = new Map();

  const flag = (propIds: string[], issue: ValidationIssue) => {
    allIssues.push(issue);
    for (const id of propIds) {
      const existing = flagMap.get(id) ?? [];
      flagMap.set(id, [...existing, issue]);
    }
  };

  // ─── Check 1: Missing evidence ────────────────────────────────────────────
  for (const p of proposals) {
    if (!p.evidence || p.evidence.length === 0) {
      flag([p.id], {
        type: 'missing-evidence',
        severity: 'medium',
        proposalIds: [p.id],
        description: `"${p.title}" tiene 0 items de evidencia. Las propuestas sin evidencia no pueden priorizarse correctamente.`,
        suggestion: 'Agregar al menos 2 data points como evidencia (métricas, observaciones de código, feedback de usuarios).',
      });
    }
  }

  // ─── Check 2: Vague acceptance criteria ───────────────────────────────────
  for (const p of proposals) {
    const hasMeasurable = p.acceptanceCriteria?.some(c => /\d/.test(c));
    if (!hasMeasurable) {
      flag([p.id], {
        type: 'vague-criteria',
        severity: 'medium',
        proposalIds: [p.id],
        description: `"${p.title}": los criterios de aceptación no tienen métricas numéricas.`,
        suggestion: 'Reescribir con criterios medibles: "Recall@10 > 0.85", "< $0.02/búsqueda", "tiempo_respuesta < 200ms".',
      });
    }
  }

  // ─── Check 3: Semantic redundancy ─────────────────────────────────────────
  for (let i = 0; i < proposals.length; i++) {
    for (let j = i + 1; j < proposals.length; j++) {
      const a = proposals[i];
      const b = proposals[j];
      const sim = jaccardSimilarity(a.title + ' ' + a.context, b.title + ' ' + b.context);
      if (sim > 0.45) {
        flag([a.id, b.id], {
          type: 'redundancy',
          severity: 'high',
          proposalIds: [a.id, b.id],
          description: `"${a.title}" y "${b.title}" tienen ${Math.round(sim * 100)}% de solapamiento semántico. Posible duplicado.`,
          suggestion: 'Consolidar en una sola propuesta o diferenciar claramente el alcance de cada una.',
        });
      }
    }
  }

  // ─── Check 4: Strategic contradictions ────────────────────────────────────
  for (let i = 0; i < proposals.length; i++) {
    for (let j = i + 1; j < proposals.length; j++) {
      const a = proposals[i];
      const b = proposals[j];
      // Same affected component, contradictory strategic mapping
      const sharedComponents = a.affectedComponents.filter(c =>
        b.affectedComponents.includes(c)
      );
      if (
        sharedComponents.length > 0 &&
        a.strategicMapping.raisesWTP !== b.strategicMapping.raisesWTP &&
        a.strategicMapping.reducesCost !== b.strategicMapping.reducesCost
      ) {
        flag([a.id, b.id], {
          type: 'contradiction',
          severity: 'high',
          proposalIds: [a.id, b.id],
          description: `"${a.title}" y "${b.title}" afectan ${sharedComponents.join(', ')} con mappings estratégicos opuestos. Riesgo de cancelación mutua.`,
          suggestion: 'Secuenciar: implementar una propuesta completamente y re-medir antes de ejecutar la otra.',
        });
      }
    }
  }

  // ─── Check 5: High-risk without pilot plan ────────────────────────────────
  for (const p of proposals) {
    if (p.riskLevel === 'high' && !p.context.toLowerCase().includes('pilot')) {
      flag([p.id], {
        type: 'infeasible',
        severity: 'medium',
        proposalIds: [p.id],
        description: `"${p.title}" tiene riesgo ALTO pero no menciona piloto o plan de reversión.`,
        suggestion: 'Agregar fase piloto con rollback plan antes de implementación completa.',
      });
    }
  }

  // ─── Categorize ───────────────────────────────────────────────────────────
  const flaggedIds = new Set(flagMap.keys());
  const validProposals = proposals.filter(p => !flaggedIds.has(p.id));
  const flaggedProposals = proposals
    .filter(p => flaggedIds.has(p.id))
    .map(p => ({ proposal: p, issues: flagMap.get(p.id) ?? [] }));

  const passRate = proposals.length > 0
    ? Math.round((validProposals.length / proposals.length) * 100)
    : 100;

  // ─── Build Report ─────────────────────────────────────────────────────────
  const findings: AnalystFinding[] = allIssues.map(issue => ({
    category: `Validation: ${issue.type}`,
    title: issue.description,
    detail: issue.suggestion,
    evidence: issue.proposalIds.map(id => `proposal:${id}`),
    impactOnWTP: issue.type === 'contradiction' ? 'negative' : 'neutral',
    impactOnCost: issue.type === 'infeasible' ? 'negative' : 'neutral',
    impactOnSwitchingCosts: 'neutral',
    loopPhase: 'React',
    severity: issue.severity,
  }));

  const report: AnalystReport = {
    projectId,
    agentId: 'validation-agent',
    findings,
    summaryNarrative: `Validación de ${proposals.length} propuestas. Pass rate: ${passRate}%. ${allIssues.filter(i => i.severity === 'high').length} issues críticos, ${allIssues.filter(i => i.severity === 'medium').length} medios. ${validProposals.length} propuestas aprobadas sin issues.`,
    recommendedProposals: allIssues
      .filter(i => i.severity === 'high')
      .slice(0, 3)
      .map(issue => ({
        title: `Resolver: ${issue.type} en propuestas ${issue.proposalIds.join(', ')}`,
        rationale: issue.suggestion,
        changeType: 'process',
        priority: 'high' as const,
      })),
    analyzedAt: new Date().toISOString(),
  };

  const output: ValidationOutput = {
    projectId, validProposals, flaggedProposals, issues: allIssues, passRate, report,
  };

  return {
    agentId: 'validation-agent',
    jobId: context.jobId,
    success: true,
    data: output,
    evidence: [`validation-agent:${projectId}`, `proposals-checked:${proposals.length}`, `pass-rate:${passRate}%`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  } satisfies AgentResult<ValidationOutput>;
};
