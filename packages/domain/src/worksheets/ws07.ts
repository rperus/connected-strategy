/**
 * @cs/domain — worksheets/ws07.ts
 * Canonical worksheet definition for WS07.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS07:Agent Design Guardrails ───────────────────────────────────────────
export const WS07_AGENT_DESIGN: WorksheetDefinition = {
  id: 'ws07_agent_design',
  title: 'WS07 — Agent Design & Guardrails',
  description:
    'Defines agent roster, permission matrix, and loop prevention policies. ' +
    'Source: Wharton WS07_Agent_Design_Guardrails.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'agent_policy',
      title: 'Agent Operating Model',
      questions: [
        { id: 'ws07_agents', text: 'List active agents and their primary responsibilities', type: 'text', required: true },
        { id: 'ws07_permissions', text: 'What can each agent do autonomously vs. require approval for?', type: 'text', required: true },
        { id: 'ws07_loop_prevention', text: 'How does the system prevent agent feedback loops?', type: 'text', required: false },
        { id: 'ws07_audit_trail', text: 'How are agent actions logged and audited?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
