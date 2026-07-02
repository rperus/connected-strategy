/**
 * @cs/domain — worksheets/ws09.ts
 * Canonical worksheet definition for WS09.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS09:Compliance / Audit / Evidence ─────────────────────────────────────
export const WS09_COMPLIANCE: WorksheetDefinition = {
  id: 'ws09_compliance',
  title: 'WS09 — Compliance, Audit & Evidence',
  description:
    'Maps risk levels, approval requirements, and audit trail coverage. ' +
    'Source: Wharton WS09_Compliance_Audit_Evidence.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'risk_matrix',
      title: 'Risk & Approval Matrix',
      questions: [
        { id: 'ws09_low_risk_actions', text: 'Which actions are auto-permitted (low risk)?', type: 'text', required: true },
        { id: 'ws09_medium_risk_actions', text: 'Which actions require human approval (medium risk)?', type: 'text', required: true },
        { id: 'ws09_high_risk_blocks', text: 'Which actions are blocked without explicit approval (high risk)?', type: 'text', required: true },
        { id: 'ws09_audit_coverage', text: 'What % of sensitive actions are logged in audit trail? (0=none, 100=all)', type: 'scale', required: true, weight: 1.0 },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
