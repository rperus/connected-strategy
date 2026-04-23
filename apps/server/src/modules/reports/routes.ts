/**
 * Report Routes — Express Router
 *
 * HTTP API surface for report generation and prompt packet creation.
 * Mount at: /api/reports (for reports) — see server index for prompt-packets mount
 *
 * Endpoints:
 *   GET  /api/reports/templates
 *   POST /api/reports/portfolio
 *   POST /api/reports/project/:id
 *   POST /api/reports/proposal/:id
 *   POST /api/prompt-packets/generate
 *
 * Worker: SET-06 / SLOT: Chat 3
 * Mount instruction in apps/server/src/index.ts:
 *   import reportRoutes from './modules/reports/routes.js';
 *   app.use('/api/reports', reportRoutes);
 */

import express from 'express';
import type { Request, Response, Router } from 'express';

import {
  getAvailableTemplates,
  generatePortfolioReport,
  generateProjectReport,
  generateProposalReport,
  exportToMarkdown,
  exportToHtml,
} from '@cs/reporting';

import { generatePacketFromProposal, toMarkdown } from '@cs/prompt-packets';

import type {
  Project,
  StrategicMetrics,
  WorksheetAnswer,
  ImprovementProposal,
  EvidenceLink,
} from '@cs/domain';

const router: Router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/templates
// List all available report templates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/reports/templates
 *
 * Returns all registered report templates with their metadata.
 * No auth required — this is a registry lookup.
 */
router.get('/templates', (_req: Request, res: Response) => {
  const templates = getAvailableTemplates();
  res.json({ ok: true, count: templates.length, data: templates });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/portfolio
// Generate a portfolio-level report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/reports/portfolio
 *
 * Body:
 * {
 *   projects: Project[],
 *   metricsMap: Record<string, StrategicMetrics>,
 *   format?: 'json' | 'markdown' | 'html'   (default: 'json')
 * }
 *
 * Returns a portfolio report in the requested format.
 */
router.post('/portfolio', (req: Request, res: Response) => {
  try {
    const { projects, metricsMap, format = 'json' } = req.body as {
      projects?: Project[];
      metricsMap?: Record<string, StrategicMetrics>;
      format?: 'json' | 'markdown' | 'html';
    };

    if (!Array.isArray(projects)) {
      res.status(400).json({ ok: false, error: 'projects must be an array' });
      return;
    }

    const map = new Map<string, StrategicMetrics>(
      Object.entries(metricsMap ?? {}),
    );

    const report = generatePortfolioReport(projects, map);

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(exportToMarkdown(report));
      return;
    }

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(exportToHtml(report));
      return;
    }

    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/project/:id
// Generate a project-level deep-dive report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/reports/project/:id
 *
 * Params: id — project ID (for logging/validation only; project data comes from body)
 *
 * Body:
 * {
 *   project: Project,
 *   metrics: StrategicMetrics,
 *   worksheetAnswers: WorksheetAnswer[],
 *   proposals: ImprovementProposal[],
 *   format?: 'json' | 'markdown' | 'html'
 * }
 */
router.post('/project/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      project,
      metrics,
      worksheetAnswers,
      proposals,
      format = 'json',
    } = req.body as {
      project?: Project;
      metrics?: StrategicMetrics;
      worksheetAnswers?: WorksheetAnswer[];
      proposals?: ImprovementProposal[];
      format?: 'json' | 'markdown' | 'html';
    };

    if (!project || !metrics) {
      res.status(400).json({ ok: false, error: 'project and metrics are required' });
      return;
    }

    if (project.id !== id) {
      res.status(400).json({
        ok: false,
        error: `Project ID mismatch: URL param=${id}, body project.id=${project.id}`,
      });
      return;
    }

    const report = generateProjectReport(
      project,
      metrics,
      worksheetAnswers ?? [],
      proposals ?? [],
    );

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(exportToMarkdown(report));
      return;
    }

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(exportToHtml(report));
      return;
    }

    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/proposal/:id
// Generate a proposal dossier report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/reports/proposal/:id
 *
 * Params: id — proposal ID (validated against body)
 *
 * Body:
 * {
 *   proposal: ImprovementProposal,
 *   evidence: EvidenceLink[],
 *   format?: 'json' | 'markdown' | 'html'
 * }
 */
router.post('/proposal/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { proposal, evidence, format = 'json' } = req.body as {
      proposal?: ImprovementProposal;
      evidence?: EvidenceLink[];
      format?: 'json' | 'markdown' | 'html';
    };

    if (!proposal) {
      res.status(400).json({ ok: false, error: 'proposal is required' });
      return;
    }

    if (proposal.id !== id) {
      res.status(400).json({
        ok: false,
        error: `Proposal ID mismatch: URL param=${id}, body proposal.id=${proposal.id}`,
      });
      return;
    }

    const report = generateProposalReport(proposal, evidence ?? []);

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(exportToMarkdown(report));
      return;
    }

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(exportToHtml(report));
      return;
    }

    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/prompt-packets/generate
// Generate a ready-to-paste prompt packet from a proposal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/prompt-packets/generate
 *
 * Body:
 * {
 *   proposal: ImprovementProposal,
 *   type: 'codex_plan' | 'antigravity_execution'
 * }
 *
 * Returns a PromptPacket with a ready-to-paste .markdown field.
 */
router.post('/prompt-packets/generate', (req: Request, res: Response) => {
  try {
    const { proposal, type } = req.body as {
      proposal?: ImprovementProposal;
      type?: 'codex_plan' | 'antigravity_execution';
    };

    if (!proposal) {
      res.status(400).json({ ok: false, error: 'proposal is required' });
      return;
    }

    if (type !== 'codex_plan' && type !== 'antigravity_execution') {
      res.status(400).json({
        ok: false,
        error: 'type must be "codex_plan" or "antigravity_execution"',
      });
      return;
    }

    const packet = generatePacketFromProposal(proposal, type);

    res.json({
      ok: true,
      data: {
        packet,
        markdown: toMarkdown(packet),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
