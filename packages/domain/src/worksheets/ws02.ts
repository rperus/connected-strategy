/**
 * @cs/domain — worksheets/ws02.ts
 * Canonical worksheet definition for WS02.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS02:Connected Loop / Flywheel ────────────────────────────────────────
export const WS02_CONNECTED_LOOP: WorksheetDefinition = {
  id: 'ws02_connected_loop',
  title: 'WS02 — Connected Loop & Flywheel',
  description:
    'Maps learning loops, personalization, and flywheel dynamics. ' +
    'Source: Wharton WS02_Connected_Loop_Flywheel.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'learning',
      title: 'Learning from Repeated Experiences',
      questions: [
        { id: 'clm_sense_quality', text: 'How well does the platform sense user signals? (0=blind, 100=full observability)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Sense' },
        { id: 'clm_transmit_coverage', text: 'How completely are signals normalized and transmitted? (0=none, 100=full pipeline)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Transmit' },
        { id: 'clm_analyze_depth', text: 'How deeply are patterns analyzed to generate insight? (0=none, 100=deep)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'clm_react_speed', text: 'How fast does the platform react to insights? (0=never, 100=real-time governed)', type: 'scale', required: true, weight: 1.0, loopPhase: 'React' },
      ],
    },
    {
      id: 'flywheel',
      title: 'Flywheel & Network Effects',
      questions: [
        { id: 'ws02_personalization', text: 'Does the platform personalize experience based on learned data?', type: 'boolean', required: true },
        { id: 'ws02_improvement_loop', text: 'Describe the core flywheel: how does more usage make the product better?', type: 'text', required: false },
        { id: 'ws02_new_needs', text: 'What new customer needs has the platform discovered from repeated interactions?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
