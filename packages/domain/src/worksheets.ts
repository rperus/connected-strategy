/**
 * @cs/domain — worksheets.ts
 *
 * Canonical worksheet definitions for all 11 Connected Strategy worksheets
 * based on Wharton curriculum (WS01–WS11).
 *
 * Each worksheet is versioned, sectionized, and maps to loop phases.
 * Worksheets are the system's primary domain primitives — not just UI forms.
 */

import type { WorksheetDefinition } from './types.js';

// ─── WS01: Problem Actors ────────────────────────────────────────────────────
export const WS01_PROBLEM_ACTORS: WorksheetDefinition = {
  id: 'ws01_problem_actors',
  title: 'WS01 — Problem & Actors',
  description:
    'Maps the customer journey, pain points, actors, and information flows. ' +
    'Source: Wharton WS1_Problem_Actors.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'journey',
      title: 'Customer Journey Map',
      description: 'Define the key steps in the primary user journey.',
      questions: [
        { id: 'ws01_journey_steps', text: 'List the main steps a user takes to accomplish their core goal', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'ws01_actor_roles', text: 'Who are the primary actors in this journey? (end user, operator, partner)', type: 'text', required: true, loopPhase: 'Recognize' },
        { id: 'ws01_trigger', text: 'What triggers the user to start this journey?', type: 'text', required: true, loopPhase: 'Sense' },
      ],
    },
    {
      id: 'pain_points',
      title: 'WTP Drivers & Pain Points',
      questions: [
        { id: 'ws01_expected_value', text: 'What value does the user expect from this journey?', type: 'text', required: true },
        { id: 'ws01_pain_severity', text: 'Overall severity of pain points in the current journey (0=none, 10=critical)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'ws01_redundant_steps', text: 'Which steps are unnecessary or redundant?', type: 'text', required: false, loopPhase: 'Analyze' },
        { id: 'ws01_abandonment_points', text: 'Where do users drop off or give up?', type: 'text', required: false, loopPhase: 'Sense' },
      ],
    },
    {
      id: 'information_flows',
      title: 'Information Flows',
      questions: [
        { id: 'ws01_info_trigger', text: 'What information triggers each key step?', type: 'text', required: true, loopPhase: 'Transmit' },
        { id: 'ws01_info_richness', text: 'Rate the richness of information available at decision points (0=none, 10=full)', type: 'scale', required: true, weight: 0.8, loopPhase: 'Transmit' },
        { id: 'ws01_info_gaps', text: 'What information is missing that would improve decisions?', type: 'text', required: false, loopPhase: 'Analyze' },
      ],
    },
    {
      id: 'why_how',
      title: 'Why-How Ladder',
      questions: [
        { id: 'ws01_deep_why', text: 'What is the deeper reason (beyond the surface request) the user needs this?', type: 'text', required: true },
        { id: 'ws01_how_delivered', text: 'How does the platform currently deliver on that deeper why?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-22T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};

// ─── WS02: Connected Loop / Flywheel ────────────────────────────────────────
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

// ─── WS03: Switching Costs / Moat ────────────────────────────────────────────
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

// ─── WS04: MVP / Integrate vs Build ──────────────────────────────────────────
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

// ─── WS05: Canonical Data Model ───────────────────────────────────────────────
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

// ─── WS06: Closed Loop Orchestration ─────────────────────────────────────────
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

// ─── WS07: Agent Design Guardrails ───────────────────────────────────────────
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

// ─── WS08: Institutional Dashboards / KPIs ────────────────────────────────────
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

// ─── WS09: Compliance / Audit / Evidence ─────────────────────────────────────
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

// ─── WS10: Competitive Positioning ───────────────────────────────────────────
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

// ─── WS11: GTM / Pricing / Packaging ─────────────────────────────────────────
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

// ─── Registry ─────────────────────────────────────────────────────────────────
export const ALL_WORKSHEETS: WorksheetDefinition[] = [
  WS01_PROBLEM_ACTORS,
  WS02_CONNECTED_LOOP,
  WS03_SWITCHING_COSTS,
  WS04_MVP,
  WS05_CANONICAL_DATA,
  WS06_CLOSED_LOOP,
  WS07_AGENT_DESIGN,
  WS08_DASHBOARDS,
  WS09_COMPLIANCE,
  WS10_COMPETITIVE,
  WS11_GTM,
];

export function getWorksheetById(id: string): WorksheetDefinition | undefined {
  return ALL_WORKSHEETS.find((ws) => ws.id === id);
}

/** Return all question IDs across all worksheets */
export function getAllQuestionIds(): string[] {
  return ALL_WORKSHEETS.flatMap((ws) =>
    ws.sections.flatMap((s) => s.questions.map((q) => q.id)),
  );
}

/** Return scoring-relevant questions (those with a weight) */
export function getScoringQuestions(): Array<{ worksheetId: string; questionId: string; weight: number }> {
  const result: Array<{ worksheetId: string; questionId: string; weight: number }> = [];
  for (const ws of ALL_WORKSHEETS) {
    for (const section of ws.sections) {
      for (const q of section.questions) {
        if (q.weight !== undefined) {
          result.push({ worksheetId: ws.id, questionId: q.id, weight: q.weight });
        }
      }
    }
  }
  return result;
}
