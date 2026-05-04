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

// ─── WS12: Efficiency Frontier ────────────────────────────────────────────────
export const WS12_EFFICIENCY_FRONTIER: WorksheetDefinition = {
  id: 'ws12_efficiency_frontier',
  title: 'WS12 — Frontera de Eficiencia',
  description:
    'Gráfica interactiva donde posicionas tu empresa y competidores en ejes WTP (Willingness-to-Pay) vs Costo de Cumplimiento. ' +
    'Muestra quién está en la frontera eficiente y quién está dominado (Pareto). ' +
    'La Ventaja Competitiva se calcula como: CA = (WTP - Cost)_Tú - (WTP - Cost)_Competidor. ' +
    'Fuente: Workshop 1 Step 4 del libro Connected Strategy (Siggelkow & Terwiesch).',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'own_position',
      title: 'Tu Posición',
      description: 'Define los valores de tu empresa. WTP = qué tanto están dispuestos a pagar tus clientes. Cost = cuánto te cuesta cumplir.',
      questions: [
        { id: 'ef_own_name', text: 'Nombre de tu empresa o plataforma', type: 'text', required: true },
        { id: 'ef_own_wtp', text: 'Willingness-to-Pay de tus clientes (0=nada, 100=máximo del mercado)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
        { id: 'ef_own_cost', text: 'Costo de cumplimiento (0=casi gratis, 100=muy caro)', type: 'scale', required: true, weight: 1.0, loopPhase: 'Analyze' },
      ],
    },
    {
      id: 'competitors',
      title: 'Competidores',
      description: 'Agrega hasta 8 competidores con sus valores de WTP y Cost estimados.',
      questions: [
        { id: 'ef_comp_1_name', text: 'Competidor 1: Nombre', type: 'text', required: false },
        { id: 'ef_comp_1_wtp', text: 'Competidor 1: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_1_cost', text: 'Competidor 1: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_2_name', text: 'Competidor 2: Nombre', type: 'text', required: false },
        { id: 'ef_comp_2_wtp', text: 'Competidor 2: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_2_cost', text: 'Competidor 2: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_3_name', text: 'Competidor 3: Nombre', type: 'text', required: false },
        { id: 'ef_comp_3_wtp', text: 'Competidor 3: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_3_cost', text: 'Competidor 3: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_4_name', text: 'Competidor 4: Nombre', type: 'text', required: false },
        { id: 'ef_comp_4_wtp', text: 'Competidor 4: WTP (0-100)', type: 'scale', required: false, weight: 0.5 },
        { id: 'ef_comp_4_cost', text: 'Competidor 4: Costo (0-100)', type: 'scale', required: false, weight: 0.5 },
      ],
    },
    {
      id: 'frontier_analysis',
      title: 'Análisis de Frontera',
      description: '¿Estás en la frontera eficiente o estás dominado? ¿Hacia dónde debes moverte?',
      questions: [
        { id: 'ef_direction', text: '¿Deberías subir WTP (diferenciación) o bajar Costo (eficiencia)?', type: 'choice', options: ['Subir WTP', 'Bajar Costo', 'Ambos'], required: false },
        { id: 'ef_strategy_notes', text: '¿Qué acciones concretas tomarías para mejorar tu posición en la frontera?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-23T00:00:00Z',
  updatedAt: '2026-04-23T00:00:00Z',
};

// ─── WS13: Connected Strategy Matrix 5×4 ─────────────────────────────────────
export const WS13_STRATEGY_MATRIX: WorksheetDefinition = {
  id: 'ws13_strategy_matrix',
  title: 'WS13 — Matriz de Estrategia Conectada (5×4)',
  description:
    'Matriz que cruza 4 Experiencias Conectadas (Responder al Deseo, Oferta Curada, Coach de Comportamiento, Ejecución Automática) ' +
    'con 5 Arquitecturas de Conexión (Productor, Retailer, Market Maker, Crowd Orchestrator, Red P2P). ' +
    'Las celdas vacías son oportunidades de innovación. ' +
    'Fuente: Workshop 3 Steps 1-2, Capítulo 7 Fig. 7-6.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'current_position',
      title: 'Posición Actual',
      description: 'Marca en qué celdas de la matriz operas tú y tus competidores.',
      questions: [
        { id: 'sm_own_experiences', text: '¿Qué experiencias conectadas ofreces? (selecciona todas)', type: 'multi-choice', options: ['Respond-to-Desire', 'Curated Offering', 'Coach Behavior', 'Automatic Execution'], required: true },
        { id: 'sm_own_architectures', text: '¿Qué arquitecturas de conexión usas?', type: 'multi-choice', options: ['Connected Producer', 'Connected Retailer', 'Connected Market Maker', 'Crowd Orchestrator', 'P2P Network Creator'], required: true },
        { id: 'sm_competitor_positions', text: 'Describe dónde están tus competidores en la matriz (ej: "Uber = Respond-to-Desire + Crowd Orchestrator")', type: 'text', required: false },
      ],
    },
    {
      id: 'innovation_opportunities',
      title: 'Oportunidades de Innovación',
      description: 'Para cada celda vacía pregúntate: ¿Qué pasaría si operáramos aquí?',
      questions: [
        { id: 'sm_empty_cells', text: '¿Qué celdas están vacías en tu industria? (oportunidades)', type: 'text', required: false },
        { id: 'sm_what_if', text: 'Si entraras en una celda nueva, ¿qué servicio ofrecerías?', type: 'text', required: false },
        { id: 'sm_required_connections', text: '¿Qué nuevas conexiones necesitarías crear?', type: 'text', required: false },
        { id: 'sm_revenue_implications', text: '¿Cómo cambiaría tu modelo de ingresos?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-23T00:00:00Z',
  updatedAt: '2026-04-23T00:00:00Z',
};

// ─── WS14: STAR Deconstruction ────────────────────────────────────────────────
export const WS14_STAR_DECONSTRUCTION: WorksheetDefinition = {
  id: 'ws14_star_deconstruction',
  title: 'WS14 — Deconstrucción STAR',
  description:
    'Descompone cada subfunción tecnológica en Sense (detectar) / Transmit (enviar) / Analyze (procesar) / React (actuar), ' +
    'cruzado con las 4 fases del viaje del cliente: Recognize / Request / Respond / Repeat. ' +
    'Cada celda identifica la solución actual y oportunidades de mejora tecnológica. ' +
    'Fuente: Workshop 3 Steps 4-5, Capítulo 9 Tabla 9-1.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'sense_phase',
      title: 'SENSE — Detectar',
      description: 'Tecnologías que detectan las necesidades o eventos del cliente (sensores IoT, wearables, reconocimiento de voz, AR).',
      questions: [
        { id: 'star_sense_recognize', text: 'SENSE × RECOGNIZE: ¿Cómo detectas que el cliente tiene una necesidad?', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'star_sense_request', text: 'SENSE × REQUEST: ¿Cómo el cliente expresa lo que quiere?', type: 'text', required: true, loopPhase: 'Sense' },
        { id: 'star_sense_respond', text: 'SENSE × RESPOND: ¿Cómo detectas que la entrega fue exitosa?', type: 'text', required: false, loopPhase: 'Sense' },
        { id: 'star_sense_repeat', text: 'SENSE × REPEAT: ¿Cómo mides la satisfacción para mejorar?', type: 'text', required: false, loopPhase: 'Sense' },
      ],
    },
    {
      id: 'transmit_phase',
      title: 'TRANSMIT — Enviar',
      description: 'Cómo se envían los datos al sistema (WiFi, 5G, Bluetooth, blockchain).',
      questions: [
        { id: 'star_transmit_recognize', text: 'TRANSMIT × RECOGNIZE: ¿Cómo llegan las señales del cliente a tu sistema?', type: 'text', required: true, loopPhase: 'Transmit' },
        { id: 'star_transmit_request', text: 'TRANSMIT × REQUEST: ¿Cómo se transmite el pedido al proveedor?', type: 'text', required: true, loopPhase: 'Transmit' },
        { id: 'star_transmit_respond', text: 'TRANSMIT × RESPOND: ¿Cómo envías confirmación/resultado al cliente?', type: 'text', required: false, loopPhase: 'Transmit' },
        { id: 'star_transmit_repeat', text: 'TRANSMIT × REPEAT: ¿Cómo compartes datos con socios/ecosistema?', type: 'text', required: false, loopPhase: 'Transmit' },
      ],
    },
    {
      id: 'analyze_phase',
      title: 'ANALYZE — Procesar',
      description: 'Cómo se procesan los datos para generar insights (ML, cloud, analytics).',
      questions: [
        { id: 'star_analyze_recognize', text: 'ANALYZE × RECOGNIZE: ¿Cómo interpretas las señales para identificar la necesidad real?', type: 'text', required: true, loopPhase: 'Analyze' },
        { id: 'star_analyze_request', text: 'ANALYZE × REQUEST: ¿Cómo evalúas las opciones disponibles para el cliente?', type: 'text', required: true, loopPhase: 'Analyze' },
        { id: 'star_analyze_respond', text: 'ANALYZE × RESPOND: ¿Cómo verificas que la respuesta fue correcta?', type: 'text', required: false, loopPhase: 'Analyze' },
        { id: 'star_analyze_repeat', text: 'ANALYZE × REPEAT: ¿Cómo optimizas a nivel de población (no solo individual)?', type: 'text', required: false, loopPhase: 'Analyze' },
      ],
    },
    {
      id: 'react_phase',
      title: 'REACT — Actuar',
      description: 'Cómo se reacciona (IA, automatización, drones, robótica, AR).',
      questions: [
        { id: 'star_react_recognize', text: 'REACT × RECOGNIZE: ¿Cómo alertas al cliente de su necesidad?', type: 'text', required: true, loopPhase: 'React' },
        { id: 'star_react_request', text: 'REACT × REQUEST: ¿Cómo ejecutas el pedido?', type: 'text', required: true, loopPhase: 'React' },
        { id: 'star_react_respond', text: 'REACT × RESPOND: ¿Cómo entregas el producto/servicio?', type: 'text', required: false, loopPhase: 'React' },
        { id: 'star_react_repeat', text: 'REACT × REPEAT: ¿Cómo mejoras el sistema con lo aprendido?', type: 'text', required: false, loopPhase: 'React' },
      ],
    },
  ],
  createdAt: '2026-04-23T00:00:00Z',
  updatedAt: '2026-04-23T00:00:00Z',
};

// ─── WS15: Five Forces (Porter) ───────────────────────────────────────────────
export const WS15_FIVE_FORCES: WorksheetDefinition = {
  id: 'ws15_five_forces',
  title: 'WS15 — 5 Fuerzas de Porter',
  description:
    'Análisis de estructura de la industria: rivalidad, amenaza de entrantes, sustitutos, poder de compradores y proveedores. ' +
    'Fuente: Wharton Competitive Advantage Module 2, Michael Porter.',
  version: 1,
  status: 'active',
  sections: [
    {
      id: 'forces',
      title: 'Las 5 Fuerzas',
      description: 'Evalúa la intensidad de cada fuerza competitiva en tu industria (0=baja presión, 100=alta presión).',
      questions: [
        { id: 'ff_rivalry', text: 'Rivalidad entre competidores existentes (0=baja, 100=guerra de precios)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_new_entrants', text: 'Amenaza de nuevos entrantes (0=barreras altas, 100=fácil entrar)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_substitutes', text: 'Amenaza de productos sustitutos (0=sin sustitutos, 100=muchos sustitutos)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_buyer_power', text: 'Poder de negociación de compradores (0=fragmentados, 100=concentrados/poderosos)', type: 'scale', required: true, weight: 1.0 },
        { id: 'ff_supplier_power', text: 'Poder de negociación de proveedores (0=fragmentados, 100=concentrados/poderosos)', type: 'scale', required: true, weight: 1.0 },
      ],
    },
    {
      id: 'analysis',
      title: 'Análisis Estratégico',
      questions: [
        { id: 'ff_attractiveness', text: '¿Qué tan atractiva es tu industria para generar beneficios sostenidos?', type: 'text', required: false },
        { id: 'ff_connected_defense', text: '¿Cómo puede una estrategia conectada reducir la presión de estas fuerzas?', type: 'text', required: false },
        { id: 'ff_key_barrier', text: '¿Cuál es la barrera de entrada más importante en tu industria?', type: 'text', required: false },
      ],
    },
  ],
  createdAt: '2026-04-26T00:00:00Z',
  updatedAt: '2026-04-26T00:00:00Z',
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
  WS12_EFFICIENCY_FRONTIER,
  WS13_STRATEGY_MATRIX,
  WS14_STAR_DECONSTRUCTION,
  WS15_FIVE_FORCES,
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
