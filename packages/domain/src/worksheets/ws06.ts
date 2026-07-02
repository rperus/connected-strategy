/**
 * @cs/domain — worksheets/ws06.ts
 * Canonical worksheet definition for WS06.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS06:Closed Loop Orchestration ─────────────────────────────────────────
export const WS06_CLOSED_LOOP: WorksheetDefinition = {
  id: 'ws06_closed_loop',
  title: 'WS06 — Closed Loop Orchestration',
  description:
    'Maps Connected Strategy response types per journey and pain point. ' +
    'Source: Wharton WS06_Closed_Loop_Orchestration.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'response_types',
      title: 'Connected Experience Response Types',
      questions: [
        { id: 'ce_respond_to_desire', text: 'Respond-to-desire maturity: platform reacts to explicit user requests (0=none, 100=excellent)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Respond' },
        { id: 'ce_curated_offering', text: 'Curated offering maturity: platform proactively surfaces relevant options (0=none, 100=excellent)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Respond' },
        { id: 'ce_coach_behavior', text: 'Coach behavior maturity: platform guides users toward better outcomes (0=none, 100=excellent)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Respond' },
        { id: 'ce_automatic_execution', text: 'Automatic execution maturity: platform acts autonomously with approval gating (0=none, 100=excellent)', type: 'scale', required: true, weight: 1.0, loopPhase: 'React' },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
