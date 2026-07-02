/**
 * @cs/domain — worksheets/ws05.ts
 * Canonical worksheet definition for WS05.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS05:Canonical Data Model ───────────────────────────────────────────────
export const WS05_CANONICAL_DATA: WorksheetDefinition = {
  id: 'ws05_canonical_data',
  title: 'WS05 — Canonical Data Model',
  description:
    'Defines the single source of truth for data entities. ' +
    'Source: Wharton WS05_Canonical_Data_Model.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'data_readiness',
      title: 'Data Readiness Inputs',
      questions: [
        { id: 'dsr_data_availability', text: 'How available and clean is structured data for analysis? (0=none, 100=rich)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Sense' },
        { id: 'dsr_instrumentation_coverage', text: 'What % of key user events are tracked? (0=blind, 100=full)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Transmit' },
        { id: 'dsr_modeling_capability', text: 'Is any data science currently applied (even basic stats)? (0=none, 100=advanced)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'dsr_rigor_level', text: 'Is causal reasoning applied? (0=pure correlation assumed, 100=rigorous causal design)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'ws05_canonical_entities', text: 'List the canonical data entities (e.g., User, Tender, Pipeline)', type: 'text', required: true },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
