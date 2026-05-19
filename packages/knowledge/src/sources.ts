/**
 * @cs/knowledge — sources.ts
 *
 * Canonical catalog of all Wharton and local knowledge sources.
 * These are the primary knowledge inputs for the Connected Strategy platform.
 *
 * Paths are resolved relative to the machine. Sources with missing files
 * degrade gracefully — the system marks them as not-indexed rather than crashing.
 */

import type { KnowledgeSource } from './types.js';

const KNOWLEDGE_ROOT = process.env.CS_KNOWLEDGE_DIR || 'D:\\GoogleDrive-SKLatam\\Mi unidad\\Plataforma_Master\\01_KB_Strategy_Wharton';
const WORKSPACE_ROOT = process.env.CS_WORKSPACE_ROOT || 'C:\\dev';

// ─── Wharton Source Catalog ───────────────────────────────────────────────────
export const WHARTON_SOURCES: KnowledgeSource[] = [
  {
    id: 'wharton_connected_strategy',
    path: `${KNOWLEDGE_ROOT}\\Connected_strategy.txt`,
    type: 'wharton_core',
    title: 'Connected Strategy — Core Framework',
    description:
      'Primary Wharton Connected Strategy framework text. Covers Sense/Transmit/Analyze/React/Repeat, ' +
      'the four experience archetypes, and the revenue model continuum.',
    indexed: false,
    worksheetIds: ['ws02_connected_loop', 'ws06_closed_loop', 'ws10_competitive'],
    priority: 1,
  },
  {
    id: 'wharton_worksheets_all',
    path: `${KNOWLEDGE_ROOT}\\WorkSheet_Todas.txt`,
    type: 'wharton_worksheet',
    title: 'All Wharton Worksheets — Combined',
    description: 'Combined text of all Wharton strategy worksheets WS01-WS11.',
    indexed: false,
    worksheetIds: [
      'ws01_problem_actors', 'ws02_connected_loop', 'ws03_switching_costs',
      'ws04_mvp', 'ws05_canonical_data', 'ws06_closed_loop',
      'ws07_agent_design', 'ws08_dashboards', 'ws09_compliance',
      'ws10_competitive', 'ws11_gtm',
    ],
    priority: 1,
  },
  {
    id: 'ws01_problem_actors_src',
    path: `${KNOWLEDGE_ROOT}\\WS1_Problem_Actors.md`,
    type: 'wharton_worksheet',
    title: 'WS01 — Problem & Actors',
    description: 'Customer journey, pain points, information flows, why-how ladder.',
    indexed: false,
    worksheetIds: ['ws01_problem_actors'],
    priority: 2,
  },
  {
    id: 'ws02_connected_loop_src',
    path: `${KNOWLEDGE_ROOT}\\WS02_Connected_Loop_Flywheel.md`,
    type: 'wharton_worksheet',
    title: 'WS02 — Connected Loop & Flywheel',
    description: 'Learning loops, personalization, flywheel dynamics.',
    indexed: false,
    worksheetIds: ['ws02_connected_loop'],
    priority: 2,
  },
  {
    id: 'ws03_switching_costs_src',
    path: `${KNOWLEDGE_ROOT}\\WS03_Switching_Costs_Moat.md`,
    type: 'wharton_worksheet',
    title: 'WS03 — Switching Costs & Moat',
    description: 'Data lock-in, habit formation, integration depth, network effects.',
    indexed: false,
    worksheetIds: ['ws03_switching_costs'],
    priority: 2,
  },
  {
    id: 'ws04_mvp_src',
    path: `${KNOWLEDGE_ROOT}\\WS04_MVP_12m_Integrate_vs_Build.md`,
    type: 'wharton_worksheet',
    title: 'WS04 — MVP & Integrate vs Build',
    description: '12-month MVP scoping and build vs. integrate decisions.',
    indexed: false,
    worksheetIds: ['ws04_mvp'],
    priority: 2,
  },
  {
    id: 'ws05_canonical_data_src',
    path: `${KNOWLEDGE_ROOT}\\WS05_Canonical_Data_Model.md`,
    type: 'wharton_worksheet',
    title: 'WS05 — Canonical Data Model',
    description: 'Canonical data entities, instrumentation gaps, MITx rigor standard.',
    indexed: false,
    worksheetIds: ['ws05_canonical_data'],
    priority: 2,
  },
  {
    id: 'ws06_closed_loop_src',
    path: `${KNOWLEDGE_ROOT}\\WS06_Closed_Loop_Orchestration.md`,
    type: 'wharton_worksheet',
    title: 'WS06 — Closed Loop Orchestration',
    description: 'Response type mapping per journey and pain point.',
    indexed: false,
    worksheetIds: ['ws06_closed_loop'],
    priority: 2,
  },
  {
    id: 'ws07_agent_design_src',
    path: `${KNOWLEDGE_ROOT}\\WS07_Agent_Design_Guardrails.md`,
    type: 'wharton_worksheet',
    title: 'WS07 — Agent Design & Guardrails',
    description: 'Agent roster, permission matrix, loop prevention, audit trail.',
    indexed: false,
    worksheetIds: ['ws07_agent_design'],
    priority: 2,
  },
  {
    id: 'ws08_dashboards_src',
    path: `${KNOWLEDGE_ROOT}\\WS08_Institutional_Dashboards_KPIs.md`,
    type: 'wharton_worksheet',
    title: 'WS08 — Institutional Dashboards & KPIs',
    description: 'KPI definitions, adoption metrics, health signals.',
    indexed: false,
    worksheetIds: ['ws08_dashboards'],
    priority: 2,
  },
  {
    id: 'ws09_compliance_src',
    path: `${KNOWLEDGE_ROOT}\\WS09_Compliance_Audit_Evidence.md`,
    type: 'wharton_worksheet',
    title: 'WS09 — Compliance, Audit & Evidence',
    description: 'Risk policy, approval matrix, audit trail coverage.',
    indexed: false,
    worksheetIds: ['ws09_compliance'],
    priority: 2,
  },
  {
    id: 'ws10_competitive_src',
    path: `${KNOWLEDGE_ROOT}\\WS10_Competitive_Positioning.md`,
    type: 'wharton_worksheet',
    title: 'WS10 — Competitive Positioning',
    description: 'Internal/external/dynamic fit, differentiation, convergence risks.',
    indexed: false,
    worksheetIds: ['ws10_competitive'],
    priority: 2,
  },
  {
    id: 'ws11_gtm_src',
    path: `${KNOWLEDGE_ROOT}\\WS11_GTM_Pricing_Packaging.md`,
    type: 'wharton_worksheet',
    title: 'WS11 — GTM, Pricing & Packaging',
    description: 'Revenue model, pricing strategy, packaging, GTM narrative.',
    indexed: false,
    worksheetIds: ['ws11_gtm'],
    priority: 2,
  },
];

// ─── Local Sources ────────────────────────────────────────────────────────────
export const LOCAL_SOURCES: KnowledgeSource[] = [
  {
    id: 'local_module_design',
    path: `${WORKSPACE_ROOT}\\Connected_Strategy\\Connected Strategy Module Design_primer acercamiento.txt`,
    type: 'module_design',
    title: 'Connected Strategy Module Design — Primer',
    description:
      'First local approach document defining the architecture, agent roster, ' +
      'data model, proposal contract, risk policy, and execution phases for the Connected Strategy platform.',
    indexed: false,
    worksheetIds: [
      'ws01_problem_actors', 'ws07_agent_design', 'ws09_compliance', 'ws10_competitive',
    ],
    priority: 1,
  },
];

// ─── Combined registry ────────────────────────────────────────────────────────
export const ALL_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  ...LOCAL_SOURCES,
  ...WHARTON_SOURCES,
];

export function getSourceById(id: string): KnowledgeSource | undefined {
  return ALL_KNOWLEDGE_SOURCES.find((s) => s.id === id);
}

export function getSourcesByWorksheet(worksheetId: string): KnowledgeSource[] {
  return ALL_KNOWLEDGE_SOURCES.filter(
    (s) => s.worksheetIds?.includes(worksheetId),
  );
}
