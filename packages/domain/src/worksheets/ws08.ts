/**
 * @cs/domain — worksheets/ws08.ts
 * Canonical worksheet definition for WS08.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS08:Institutional Dashboards / KPIs ────────────────────────────────────
export const WS08_DASHBOARDS: WorksheetDefinition = {
  id: 'ws08_dashboards',
  title: 'WS08 — Institutional Dashboards & KPIs',
  description:
    'Defines KPIs, adoption metrics, and health signals for strategic oversight. ' +
    'Source: Wharton WS08_Institutional_Dashboards_KPIs.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'kpis',
      title: 'Key Performance Indicators',
      questions: [
        { id: 'ws08_adoption_kpis', text: 'List the primary feature adoption KPIs', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'ws08_funnel_kpis', text: 'What funnel completion rates are tracked?', type: 'text', required: true, loopPhase: 'Analyze' },
        { id: 'ws08_time_to_value', text: 'Average time to first value (minutes/days)?', type: 'number', required: false },
        { id: 'ws08_support_burden', text: 'Support tickets per 100 active users per month', type: 'number', required: false },
        { id: 'ws08_ai_cost_per_workflow', text: 'AI cost per automated workflow (USD)', type: 'number', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
