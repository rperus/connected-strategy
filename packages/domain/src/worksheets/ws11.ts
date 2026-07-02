/**
 * @cs/domain — worksheets/ws11.ts
 * Canonical worksheet definition for WS11.
 */

import type { WorksheetDefinition } from '../types.js';

// ─── WS11:GTM / Pricing / Packaging ─────────────────────────────────────────
export const WS11_GTM: WorksheetDefinition = {
  id: 'ws11_gtm',
  title: 'WS11 — GTM, Pricing & Packaging',
  description:
    'Revenue model, pricing strategy, packaging, and go-to-market narrative. ' +
    'Source: Wharton WS11_GTM_Pricing_Packaging.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'business_model_inputs',
      title: 'Business Model Inputs',
      questions: [
        { id: 'bms_revenue_model_clarity', text: 'Revenue model clarity: how clear and sustainable are revenue streams? (0=unclear, 100=crystal clear)', type: 'scale', required: true, weight: 1.0 },
        { id: 'bms_moat_depth', text: 'Moat depth: combined switching costs + network effects (0=none, 100=deep)', type: 'scale', required: true, weight: 1.0 },
        { id: 'bms_scalability', text: 'Scalability: can revenue grow without proportional cost increase? (0=linear cost, 100=highly scalable)', type: 'scale', required: true, weight: 1.0 },
        { id: 'bms_customer_relationship_depth', text: 'Customer relationship depth: how deep and sticky are customer relationships? (0=transactional, 100=embedded)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ws11_pricing_model', text: 'Describe the pricing model (subscription, usage, freemium, etc.)', type: 'text', required: false },
        { id: 'ws11_gtm_narrative', text: 'What is the core GTM narrative for the next 12 months?', type: 'text', required: false },
      ],
    },
    {
      id: 'wtp_cost',
      title: 'WTP vs Cost Inputs',
      questions: [
        { id: 'wtp_value_perception', text: 'WTP: how clearly do users perceive differentiated value? (0=none, 100=very clear)', type: 'scale', required: true, weight: 1.0 },
        { id: 'wtp_pain_resolution', text: 'WTP: how well does the platform resolve high-severity pain points? (0=none, 100=fully)', type: 'scale', required: true, weight: 1.0 },
        { id: 'wtp_convenience_delta', text: 'WTP: how much does the platform reduce effort vs. alternatives? (0=none, 100=massive)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cr_automation_coverage', text: 'Cost: what % of previously manual steps are automated? (0=none, 100=all)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cr_manual_ops_reduction', text: 'Cost: reduction in manual operations burden (0=none, 100=eliminated)', type: 'scale', required: true, weight: 1.0 },
        { id: 'cr_support_burden_reduction', text: 'Cost: reduction in support burden (0=none, 100=near-zero support needed)', type: 'scale', required: true, weight: 1.0 },
      ],
    },
    {
      id: 'architecture_inputs',
      title: 'Architecture Inputs',
      questions: [
        { id: 'ar_modularity', text: 'Modularity: bounded components with clear contracts? (0=monolith, 100=fully modular)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ar_test_coverage', text: 'Test coverage: % of critical paths covered by automated tests (0=none, 100=full)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ar_observability', text: 'Observability: logging, tracing, alerting completeness (0=blind, 100=full)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ar_recoverability', text: 'Recoverability: how fast does the system recover from failures? (0=slow/manual, 100=fast/automated)', type: 'scale', required: true, weight: 1.0 },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};
