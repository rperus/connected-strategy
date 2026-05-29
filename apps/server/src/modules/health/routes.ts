/**
 * Health Dashboard Routes — Express Router
 * Mount at: /api/health-dashboard
 *
 * GET /api/health-dashboard
 *   Returns comprehensive health data for all projects:
 *   - Project scores and status
 *   - Findings by severity
 *   - Worksheets completion
 *   - Pipeline run history
 *   - Overall portfolio health
 */

import express from 'express';
import type { Request, Response, Router } from 'express';
import { listProjects } from '../../db/repositories/projects.js';
import { listAnswers, listAllAnswers } from '../../db/repositories/worksheets.js';
import { computeStrategicMetrics, defaultScoringWeights, ALL_WORKSHEETS } from '@cs/domain';
import type { WorksheetAnswer, StrategicMetrics } from '@cs/domain';
import type { AgentContext, AnalystReport, AnalystFinding } from '@cs/agents';

const router: Router = express.Router();


interface ProjectHealth {
  projectId: string;
  projectName: string;
  path: string;
  maturity: string;
  stack: string[];
  tags: string[];
  metrics: StrategicMetrics | null;
  sacScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  worksheetsTotal: number;
  worksheetsFilled: number;
  worksheetsCompletion: number; // 0-100%
  findingsBySeverity: { high: number; medium: number; low: number };
  totalFindings: number;
  totalProposals: number;
  weakestMetrics: Array<{ name: string; score: number }>;
  strongestMetrics: Array<{ name: string; score: number }>;
  lastAnalyzed: string | null;
}

function sacToGrade(sac: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (sac >= 70) return 'A';
  if (sac >= 50) return 'B';
  if (sac >= 30) return 'C';
  if (sac >= 15) return 'D';
  return 'F';
}

function getMetricScores(m: StrategicMetrics): Array<{ name: string; score: number }> {
  return [
    { name: 'Connected Experience', score: m.connectedExperienceScore },
    { name: 'Closed Loop', score: m.closedLoopMaturity },
    { name: 'Switching Costs', score: m.switchingCostIndex },
    { name: 'WTP Uplift', score: m.wtpUpliftIndex },
    { name: 'Cost Reduction', score: m.costReductionPotential },
    { name: 'Competitive Pos.', score: m.competitivePositioningIndex },
    { name: 'Business Model', score: m.businessModelStrength },
    { name: 'Data Science', score: m.dataScienceReadiness },
    { name: 'Architecture', score: m.architectureResilience },
  ];
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = listProjects();
    const totalWorksheets = ALL_WORKSHEETS.length;
    const projectHealths: ProjectHealth[] = [];

    // Run analysis for each project to get findings
    const analystIds = [
      'connected-strategy-analyst',
      'competitive-advantage-analyst',
      'business-model-analyst',
      'data-science-opportunity-analyst',
      'architecture-improvement-analyst',
      'ai-frontier-analyst',
    ] as const;

    // W1-3: Batch load ALL worksheet answers in a single query (was N+1: one query per project)
    const allProjectIds = projects.map((p: { id: string }) => p.id);
    let answersByProject: Record<string, ReturnType<typeof listAnswers>> = {};
    if (allProjectIds.length > 0) {
      const allAnswers = listAllAnswers();
      for (const answer of allAnswers) {
        if (!answersByProject[answer.projectId]) {
          answersByProject[answer.projectId] = [];
        }
        answersByProject[answer.projectId].push(answer);
      }
    }

    for (const project of projects) {
      // W1-3: Use pre-loaded answers from batch map (no per-project DB query)
      const answers = answersByProject[project.id] ?? [];
      const mergedAnswers: Record<string, unknown> = {};
      for (const a of answers) {
        Object.assign(mergedAnswers, a.answers);
      }

      // Compute metrics
      let metrics: StrategicMetrics | null = null;
      try {
        const syntheticAnswer: WorksheetAnswer = {
          id: 'health-check',
          worksheetId: 'all',
          projectId: project.id,
          version: 1,
          answers: mergedAnswers,
          confidence: {},
          updatedAt: new Date().toISOString(),
        };
        metrics = computeStrategicMetrics(project.id, syntheticAnswer, defaultScoringWeights(project.id));
      } catch (e) { console.warn('[CS-Health] Agent run failed:', e); }

      // Count worksheet completion
      const filledWorksheetIds = new Set(answers.map((a: any) => a.worksheetId));
      const worksheetsFilled = filledWorksheetIds.size;

      // Run analysts to get findings (lightweight — no jobs, no DB writes)
      const allFindings: AnalystFinding[] = [];
      let totalProposals = 0;

      // Inline analysts execution removed: Health route now only computes scores
      // Findings and proposals should be loaded from the DB instead

      // Count by severity
      const findingsBySeverity = {
        high: allFindings.filter(f => f.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length,
        low: allFindings.filter(f => f.severity === 'low').length,
      };

      const sac = metrics?.strategicAdvantageComposite ?? 0;
      const metricScores = metrics ? getMetricScores(metrics) : [];
      const sorted = [...metricScores].sort((a, b) => a.score - b.score);

      projectHealths.push({
        projectId: project.id,
        projectName: project.name,
        path: project.path,
        maturity: project.maturity,
        stack: project.stack,
        tags: project.tags,
        metrics,
        sacScore: Math.round(sac),
        healthGrade: sacToGrade(sac),
        worksheetsTotal: totalWorksheets,
        worksheetsFilled,
        worksheetsCompletion: Math.min(100, Math.round((worksheetsFilled / totalWorksheets) * 100)),
        findingsBySeverity,
        totalFindings: allFindings.length,
        totalProposals,
        weakestMetrics: sorted.slice(0, 3).map(s => ({ name: s.name, score: Math.round(s.score) })),
        strongestMetrics: sorted.slice(-3).reverse().map(s => ({ name: s.name, score: Math.round(s.score) })),
        lastAnalyzed: project.updatedAt,
      });
    }


    // Sort by SAC descending
    projectHealths.sort((a, b) => b.sacScore - a.sacScore);

    // Portfolio summary
    const avgSAC = projectHealths.length > 0
      ? Math.round(projectHealths.reduce((sum, p) => sum + p.sacScore, 0) / projectHealths.length)
      : 0;
    const totalFindings = projectHealths.reduce((sum, p) => sum + p.totalFindings, 0);
    const totalProposals = projectHealths.reduce((sum, p) => sum + p.totalProposals, 0);
    const gradeDistribution = {
      A: projectHealths.filter(p => p.healthGrade === 'A').length,
      B: projectHealths.filter(p => p.healthGrade === 'B').length,
      C: projectHealths.filter(p => p.healthGrade === 'C').length,
      D: projectHealths.filter(p => p.healthGrade === 'D').length,
      F: projectHealths.filter(p => p.healthGrade === 'F').length,
    };

    res.json({
      ok: true,
      data: {
        portfolio: {
          totalProjects: projectHealths.length,
          averageSAC: avgSAC,
          portfolioGrade: sacToGrade(avgSAC),
          totalFindings,
          totalProposals,
          gradeDistribution,
          queueStats: { pending: 0, running: 0, completed: 0, failed: 0 },
        },
        projects: projectHealths,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
