/**
 * @cs/reporting — index.ts
 * Public API for the reporting package.
 * Worker: SET-06
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ReportType,
  ReportTemplate,
  ReportMeta,
  ReportSection,
  PortfolioSummaryRow,
  PortfolioReport,
  MetricRow,
  ProposalSummaryRow,
  WorksheetCompletionRow,
  ProjectReport,
  EvidenceSummaryRow,
  ProposalReport,
} from './types.js';

// ─── Templates ────────────────────────────────────────────────────────────────
export {
  PORTFOLIO_TEMPLATE,
  PROJECT_TEMPLATE,
  PROPOSAL_TEMPLATE,
  REPORT_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
} from './templates.js';

// ─── Generators ───────────────────────────────────────────────────────────────
export {
  generatePortfolioReport,
  generateProjectReport,
  generateProposalReport,
} from './generators.js';

// ─── Exporters ────────────────────────────────────────────────────────────────
export { exportToMarkdown, exportToHtml } from './exporters.js';

// ─── Convenience: replaces the original placeholder ──────────────────────────
import { REPORT_TEMPLATES } from './templates.js';
import type { ReportTemplate } from './types.js';

/**
 * List all available report templates.
 * Replaces the original placeholder that returned [].
 */
export function getAvailableTemplates(): ReportTemplate[] {
  return REPORT_TEMPLATES;
}
