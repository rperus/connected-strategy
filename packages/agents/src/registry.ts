/**
 * @cs/agents — registry.ts
 *
 * AGENT_REGISTRY: full AgentDefinition + AgentRunner bindings
 * for all specialist agents.
 *
 * AgentRunners are deterministic workflow functions.
 * LLM enrichment is opt-in via AgentContext.llmProvider.
 */

import type { AgentDefinition, RegisteredAgent } from './types.js';
import type { AgentId } from './types.js';
import { runPortfolioScanner } from './agents/portfolio-scanner.js';
import { runWorksheetSynthesizer } from './agents/worksheet-synthesizer.js';
import { runConnectedStrategyAnalyst } from './agents/connected-strategy-analyst.js';
import { runCompetitiveAdvantageAnalyst } from './agents/competitive-advantage-analyst.js';
import { runBusinessModelAnalyst } from './agents/business-model-analyst.js';
import { runDataScienceOpportunityAnalyst } from './agents/data-science-opportunity-analyst.js';
import { runArchitectureImprovementAnalyst } from './agents/architecture-improvement-analyst.js';
import { runAIFrontierAnalyst } from './agents/ai-frontier-analyst.js';
import { runProposalComposer } from './agents/proposal-composer.js';

// ─── Definitions ──────────────────────────────────────────────────────────────

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  'portfolio-scanner': {
    id: 'portfolio-scanner',
    name: 'Portfolio Scanner',
    description: 'Discovers and classifies all projects under a root directory (default: C:\\dev). Detects stack, maturity level, and tags. No LLM required.',
    version: '1.0.0',
    inputContract: ['scanPath?: string'],
    outputContract: ['PortfolioScanResult'],
    loopPhase: 'Sense',
  },
  'worksheet-synthesizer': {
    id: 'worksheet-synthesizer',
    name: 'Worksheet Synthesizer',
    description: 'Auto-fills WS01-WS11 worksheet answers from project filesystem analysis. Heuristic matching. LLM enrichment is optional.',
    version: '1.0.0',
    inputContract: ['projectId', 'projectPath', 'stack', 'worksheetId?'],
    outputContract: ['WorksheetSynthesisResult[]'],
    loopPhase: 'Analyze',
  },
  'connected-strategy-analyst': {
    id: 'connected-strategy-analyst',
    name: 'Connected Strategy Analyst',
    description: 'Evaluates connected experience loop depth and closed loop maturity. Scores against Wharton Connected Strategy framework.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
  },
  'competitive-advantage-analyst': {
    id: 'competitive-advantage-analyst',
    name: 'Competitive Advantage Analyst',
    description: 'Evaluates switching costs, WTP uplift, activity system fit, and differentiation choices.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
  },
  'business-model-analyst': {
    id: 'business-model-analyst',
    name: 'Business Model Analyst',
    description: 'Evaluates revenue model clarity, moat depth, scalability, and proprietary data assets.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
  },
  'data-science-opportunity-analyst': {
    id: 'data-science-opportunity-analyst',
    name: 'Data Science Opportunity Analyst',
    description: 'Evaluates data availability, instrumentation coverage, modeling capability, and statistical rigor. MITx MicroMasters standard.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
  },
  'architecture-improvement-analyst': {
    id: 'architecture-improvement-analyst',
    name: 'Architecture Improvement Analyst',
    description: 'Evaluates modularity, test coverage, observability, and compliance posture.',
    version: '1.0.0',
    inputContract: ['projectId', 'projectPath?', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
  },
  'ai-frontier-analyst': {
    id: 'ai-frontier-analyst',
    name: 'AI Frontier Analyst',
    description: 'Evaluates AI opportunities by real business value: agent guardrails, automation gaps, LLM integration value, and AI moat potential.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
  },
  'proposal-composer': {
    id: 'proposal-composer',
    name: 'Proposal Composer',
    description: 'Aggregates findings from all specialist analysts. Composes ImprovementProposal[] with context, evidence, impact, risk, and strategic mapping.',
    version: '1.0.0',
    inputContract: ['projectId', 'reports: AnalystReport[]'],
    outputContract: ['ImprovementProposal[]'],
    loopPhase: 'React',
  },
};

// ─── Registry (definition + runner bound) ────────────────────────────────────

export const AGENT_REGISTRY: RegisteredAgent[] = [
  {
    definition: AGENT_DEFINITIONS['portfolio-scanner'],
    run: runPortfolioScanner as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['worksheet-synthesizer'],
    run: runWorksheetSynthesizer as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['connected-strategy-analyst'],
    run: runConnectedStrategyAnalyst as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['competitive-advantage-analyst'],
    run: runCompetitiveAdvantageAnalyst as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['business-model-analyst'],
    run: runBusinessModelAnalyst as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['data-science-opportunity-analyst'],
    run: runDataScienceOpportunityAnalyst as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['architecture-improvement-analyst'],
    run: runArchitectureImprovementAnalyst as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['ai-frontier-analyst'],
    run: runAIFrontierAnalyst as RegisteredAgent['run'],
  },
  {
    definition: AGENT_DEFINITIONS['proposal-composer'],
    run: runProposalComposer as RegisteredAgent['run'],
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getRegisteredAgent(id: AgentId): RegisteredAgent | undefined {
  return AGENT_REGISTRY.find((a) => a.definition.id === id);
}

export function listAgentDefinitions(): AgentDefinition[] {
  return AGENT_REGISTRY.map((a) => a.definition);
}
