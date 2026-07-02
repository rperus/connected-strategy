/**
 * @cs/domain — worksheets/ws03.ts
 * Canonical worksheet definition for WS03.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS03:Switching Costs / Moat ────────────────────────────────────────────
export const WS03_SWITCHING_COSTS: WorksheetDefinition = {
  id: 'ws03_switching_costs',
  title: 'WS03 — Switching Costs & Moat',
  description:
    'Evaluates data lock-in, habit formation, integration depth, and network effects. ' +
    'Source: Wharton WS03_Switching_Costs_Moat.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'switching_inputs',
      title: 'Switching Cost Inputs',
      questions: [
        { id: 'sci_data_lock', text: 'Data lock-in: how much user data is exclusively on this platform? (0=none, 100=all)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Repeat' },
        { id: 'sci_habit_formation', text: 'Habit formation: how deeply embedded is this in daily workflows? (0=none, 100=critical)', type: 'scale', required: true, weight: 1.0 },
        { id: 'sci_integration_depth', text: 'Integration depth: how many external systems connect through this platform? (0=none, 100=deeply integrated)', type: 'scale', required: true, weight: 1.0 },
        { id: 'sci_network_effect', text: 'Network effects: does more usage make it more valuable? (0=none, 100=strong)', type: 'scale', required: true, weight: 1.0 },
        { id: 'sci_narrative', text: 'Describe the primary switching cost story in your own words', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
