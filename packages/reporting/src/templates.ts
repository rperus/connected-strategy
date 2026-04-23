/**
 * @cs/reporting — templates.ts
 * Canonical report template definitions for portfolio, project, and proposal.
 * Worker: SET-06
 */

import type { ReportTemplate } from './types.js';

// ─── Portfolio Template ───────────────────────────────────────────────────────

export const PORTFOLIO_TEMPLATE: ReportTemplate = {
  id: 'portfolio-v1',
  type: 'portfolio',
  title: 'Portfolio Strategic Report',
  description:
    'Comparative view of all projects. Ranks by strategic advantage composite score. ' +
    'Highlights leaders and laggards, average metrics, and improvement opportunities.',
  sections: [
    'executive-summary',
    'portfolio-overview',
    'project-rankings',
    'metric-heatmap',
    'recommendations',
  ],
  printable: true,
  version: '1.0.0',
};

// ─── Project Template ─────────────────────────────────────────────────────────

export const PROJECT_TEMPLATE: ReportTemplate = {
  id: 'project-v1',
  type: 'project',
  title: 'Project Strategic Report',
  description:
    'Deep-dive for a single project. Covers all 10 scoring dimensions, worksheet completion, ' +
    'improvement proposals, and strategic loop mapping.',
  sections: [
    'executive-summary',
    'project-profile',
    'scoring-breakdown',
    'worksheet-completion',
    'improvement-proposals',
    'strategic-mapping',
    'next-actions',
  ],
  printable: true,
  version: '1.0.0',
};

// ─── Proposal Template ────────────────────────────────────────────────────────

export const PROPOSAL_TEMPLATE: ReportTemplate = {
  id: 'proposal-v1',
  type: 'proposal',
  title: 'Improvement Proposal Report',
  description:
    'Single-proposal dossier with context, evidence, strategic mapping, acceptance criteria, ' +
    'risk analysis, and validation plan. Ready to hand off to Codex or Antigravity.',
  sections: [
    'proposal-header',
    'strategic-context',
    'evidence-summary',
    'acceptance-criteria',
    'risk-analysis',
    'implementation-notes',
    'validation-plan',
  ],
  printable: true,
  version: '1.0.0',
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const REPORT_TEMPLATES: ReportTemplate[] = [
  PORTFOLIO_TEMPLATE,
  PROJECT_TEMPLATE,
  PROPOSAL_TEMPLATE,
];

export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByType(type: ReportTemplate['type']): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.type === type);
}
