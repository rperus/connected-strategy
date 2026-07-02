/**
 * @cs/domain — worksheets/ws10.ts
 * Canonical worksheet definition for WS10.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS10:Competitive Positioning ───────────────────────────────────────────
export const WS10_COMPETITIVE: WorksheetDefinition = {
  id: 'ws10_competitive',
  title: 'WS10 — Competitive Positioning',
  description:
    'Evaluates internal fit, external fit, dynamic fit, and differentiation choices. ' +
    'Source: Wharton WS10_Competitive_Positioning.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'positioning_inputs',
      title: 'Competitive Positioning Inputs',
      questions: [
        { id: 'cp_internal_fit', text: 'Internal fit: how well do activities reinforce each other? (0=fragmented, 100=tightly coupled)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cp_external_fit', text: 'External fit: how well do activities deliver on customer WTP? (0=misaligned, 100=perfect)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cp_dynamic_fit', text: 'Dynamic fit: can the platform evolve without losing position? (0=brittle, 100=highly adaptive)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cp_differentiation_clarity', text: 'Differentiation clarity: are strategic trade-offs explicit? (0=none, 100=very clear)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cp_what_not_to_do', text: 'What does the platform explicitly NOT do to protect differentiation?', type: 'text', required: false },
        { id: 'cp_convergence_risks', text: 'Where is the platform converging with competitors (eroding uniqueness)?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
