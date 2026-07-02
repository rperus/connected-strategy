/**
 * @cs/domain — worksheets/ws04.ts
 * Canonical worksheet definition for WS04.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS04:MVP / Integrate vs Build ──────────────────────────────────────────
export const WS04_MVP: WorksheetDefinition = {
  id: 'ws04_mvp',
  title: 'WS04 — MVP & Integrate vs Build',
  description:
    'Guides build-vs-integrate decisions for the 12-month roadmap. ' +
    'Source: Wharton WS04_MVP_12m_Integrate_vs_Build.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'mvp_scope',
      title: 'MVP Scope Definition',
      questions: [
        { id: 'ws04_core_bets', text: 'What are the 3 core bets in the 12-month MVP?', type: 'text', required: true },
        { id: 'ws04_integrate_candidates', text: 'Which capabilities are better served by integrating a third-party tool?', type: 'text', required: false },
        { id: 'ws04_build_candidates', text: 'Which capabilities must be built in-house for strategic differentiation?', type: 'text', required: false },
        { id: 'ws04_validation_criteria', text: 'How will you know the MVP succeeded?', type: 'text', required: true },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
