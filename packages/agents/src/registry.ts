/**
 * @cs/agents — registry.ts
 *
 * AGENT_REGISTRY: full AgentDefinition + AgentRunner bindings
 * for all 20 agents in the 3-tier hierarchical swarm.
 *
 * Architecture:
 *   Level 0: Supervisor (Strategist)
 *   Level 1: Crew Leads (Recon, Analysis, Action)
 *   Level 2: Specialists (12 original + 4 new)
 *
 * AgentRunners are deterministic workflow functions.
 * LLM enrichment is opt-in via AgentContext.llmProvider.
 */

import type { AgentDefinition, RegisteredAgent } from './types.js';
import type { AgentId } from './types.js';

// ── Level 2: Original Specialists ──────────────────────────────────────────────
import { runPortfolioScanner } from './agents/portfolio-scanner.js';
import { runWorksheetSynthesizer } from './agents/worksheet-synthesizer.js';
import { runConnectedStrategyAnalyst } from './agents/connected-strategy-analyst.js';
import { runCompetitiveAdvantageAnalyst } from './agents/competitive-advantage-analyst.js';
import { runBusinessModelAnalyst } from './agents/business-model-analyst.js';
import { runDataScienceOpportunityAnalyst } from './agents/data-science-opportunity-analyst.js';
import { runArchitectureImprovementAnalyst } from './agents/architecture-improvement-analyst.js';
import { runAIFrontierAnalyst } from './agents/ai-frontier-analyst.js';
import { runProposalComposer } from './agents/proposal-composer.js';
import { runCompetitiveIntelAgent } from './agents/competitive-intel-agent.js';
import { runFrontierMapperAgent } from './agents/frontier-mapper-agent.js';
import { runCostEstimatorAgent } from './agents/cost-estimator-agent.js';

// ── Level 2: New Specialists (Phase 1 Swarm) ───────────────────────────────────
import { runTemporalAnalyst } from './agents/temporal-analyst.js';
import { runValidationAgent } from './agents/validation-agent.js';
import { runAnomalyDetector } from './agents/anomaly-detector.js';
import { runCausalMapper } from './agents/causal-mapper.js';
import { runAutonomousExecutor } from './agents/autonomous-executor.js';

// ── Level 1: Crew Leads ────────────────────────────────────────────────────────
import { runReconLead } from './agents/recon-lead.js';
import { runAnalysisLead } from './agents/analysis-lead.js';
import { runActionLead } from './agents/action-lead.js';

// ── Level 0: Supervisor ────────────────────────────────────────────────────────
import { runStrategistSupervisor } from './agents/strategist-supervisor.js';

// ─── Definitions ──────────────────────────────────────────────────────────────

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {

  // ══════════════════════════════════════════════════════════════
  // LEVEL 0: SUPERVISOR
  // ══════════════════════════════════════════════════════════════

  'strategist-supervisor': {
    id: 'strategist-supervisor',
    name: 'Strategist Supervisor',
    description: 'Apex meta-agent. Plans execution order (HTN planning), resolves analyst contradictions, generates portfolio-level executive synthesis. LLM-enhanced for narrative generation.',
    version: '1.0.0',
    inputContract: ['portfolioProjects', 'allFindings', 'contradictions?', 'analysisDepth?'],
    outputContract: ['ExecutionPlan', 'StrategistOutput'],
    loopPhase: 'React',
    tier: 'supervisor',
    crew: 'none',
    canDelegate: true,
    runsAutonomously: false,
  },

  // ══════════════════════════════════════════════════════════════
  // LEVEL 1: CREW LEADS
  // ══════════════════════════════════════════════════════════════

  'recon-lead': {
    id: 'recon-lead',
    name: 'Recon Lead',
    description: 'Coordinates Recon crew (Portfolio Scanner + Competitive Intel). Manages cache invalidation, data quality gate, and portal health checks.',
    version: '1.0.0',
    inputContract: ['projectId', 'lastScanAt?', 'staleThresholdHours?'],
    outputContract: ['ReconLeadOutput'],
    loopPhase: 'Sense',
    tier: 'crew-lead',
    crew: 'recon',
    canDelegate: true,
    runsAutonomously: false,
  },

  'analysis-lead': {
    id: 'analysis-lead',
    name: 'Analysis Lead',
    description: 'Coordinates Analysis crew (8 specialists). Dependency-aware scheduling, cross-agent finding propagation, early stopping when SAC > threshold.',
    version: '1.0.0',
    inputContract: ['projectId', 'currentSAC?', 'availableAnalysts', 'priorityDimensions?'],
    outputContract: ['AnalysisSchedule', 'crossAgentInsights'],
    loopPhase: 'Analyze',
    tier: 'crew-lead',
    crew: 'analysis',
    canDelegate: true,
    runsAutonomously: false,
  },

  'action-lead': {
    id: 'action-lead',
    name: 'Action Lead',
    description: 'Coordinates Action crew (Proposal Composer, Validation, Cost Estimator). Final gate before publishing. Escalates to Strategist if pass rate < 50%.',
    version: '1.0.0',
    inputContract: ['projectId', 'proposalCount?', 'validationPassRate?', 'estimatedCostUSD?'],
    outputContract: ['ActionPackage'],
    loopPhase: 'React',
    tier: 'crew-lead',
    crew: 'action',
    canDelegate: true,
    runsAutonomously: false,
  },

  // ══════════════════════════════════════════════════════════════
  // LEVEL 2: ORIGINAL SPECIALISTS (augmented with tier/crew)
  // ══════════════════════════════════════════════════════════════

  'portfolio-scanner': {
    id: 'portfolio-scanner',
    name: 'Portfolio Scanner',
    description: 'Discovers and classifies all projects under a root directory (default: C:\\dev). Detects stack, maturity level, and tags. No LLM required.',
    version: '1.0.0',
    inputContract: ['scanPath?: string'],
    outputContract: ['PortfolioScanResult'],
    loopPhase: 'Sense',
    tier: 'specialist',
    crew: 'recon',
    canDelegate: false,
    runsAutonomously: false,
  },

  'competitive-intel-agent': {
    id: 'competitive-intel-agent',
    name: 'Competitive Intel',
    description: 'Extrae y estructura datos de competidores desde worksheets (WS12, WS10) para el cálculo de la frontera de eficiencia.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['CompetitiveIntelResult'],
    loopPhase: 'Sense',
    tier: 'specialist',
    crew: 'recon',
    canDelegate: false,
    runsAutonomously: false,
  },

  'worksheet-synthesizer': {
    id: 'worksheet-synthesizer',
    name: 'Worksheet Synthesizer',
    description: 'Auto-fills WS01-WS11 worksheet answers from project filesystem analysis. Heuristic matching. LLM enrichment is optional.',
    version: '1.0.0',
    inputContract: ['projectId', 'projectPath', 'stack', 'worksheetId?'],
    outputContract: ['WorksheetSynthesisResult[]'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'connected-strategy-analyst': {
    id: 'connected-strategy-analyst',
    name: 'Connected Strategy Analyst',
    description: 'Evaluates connected experience loop depth and closed loop maturity. Scores against Wharton Connected Strategy framework.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'competitive-advantage-analyst': {
    id: 'competitive-advantage-analyst',
    name: 'Competitive Advantage Analyst',
    description: 'Evaluates switching costs, WTP uplift, activity system fit, and differentiation choices.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'business-model-analyst': {
    id: 'business-model-analyst',
    name: 'Business Model Analyst',
    description: 'Evaluates revenue model clarity, moat depth, scalability, and proprietary data assets.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'data-science-opportunity-analyst': {
    id: 'data-science-opportunity-analyst',
    name: 'Data Science Opportunity Analyst',
    description: 'Evaluates data availability, instrumentation coverage, modeling capability, and statistical rigor. MITx MicroMasters standard.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'architecture-improvement-analyst': {
    id: 'architecture-improvement-analyst',
    name: 'Architecture Improvement Analyst',
    description: 'Evaluates modularity, test coverage, observability, and compliance posture.',
    version: '1.0.0',
    inputContract: ['projectId', 'projectPath?', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'ai-frontier-analyst': {
    id: 'ai-frontier-analyst',
    name: 'AI Frontier Analyst',
    description: 'Evaluates AI opportunities by real business value: agent guardrails, automation gaps, LLM integration value, and AI moat potential.',
    version: '1.0.0',
    inputContract: ['projectId', 'answers: Record<string, unknown>'],
    outputContract: ['AnalystReport'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'frontier-mapper-agent': {
    id: 'frontier-mapper-agent',
    name: 'Frontier Mapper',
    description: 'Calcula la frontera de Pareto y ventaja competitiva (CA = Value_Own − Value_Comp). 100% determinista, sin LLM.',
    version: '1.0.0',
    inputContract: ['projectId', 'entities: FrontierEntity[]'],
    outputContract: ['FrontierMapperResult'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'proposal-composer': {
    id: 'proposal-composer',
    name: 'Proposal Composer',
    description: 'Aggregates findings from all specialist analysts. Composes ImprovementProposal[] with context, evidence, impact, risk, and strategic mapping.',
    version: '1.0.0',
    inputContract: ['projectId', 'reports: AnalystReport[]'],
    outputContract: ['ImprovementProposal[]'],
    loopPhase: 'React',
    tier: 'specialist',
    crew: 'action',
    canDelegate: false,
    runsAutonomously: false,
  },

  'cost-estimator-agent': {
    id: 'cost-estimator-agent',
    name: 'Cost Estimator',
    description: 'Calcula el costo en USD de cada workflow de IA usando precios de Gemini Flash/Pro por token.',
    version: '1.0.0',
    inputContract: ['projectId', 'agentRuns: AgentRunEntry[]'],
    outputContract: ['CostEstimatorResult'],
    loopPhase: 'React',
    tier: 'specialist',
    crew: 'action',
    canDelegate: false,
    runsAutonomously: false,
  },

  // ══════════════════════════════════════════════════════════════
  // LEVEL 2: NEW SPECIALISTS (Phase 1 Swarm)
  // ══════════════════════════════════════════════════════════════

  'temporal-analyst': {
    id: 'temporal-analyst',
    name: 'Temporal Analyst',
    description: 'Detects score trends, regressions, and inflection points by comparing current run vs historical SQLite data. Z-score based significance testing.',
    version: '1.0.0',
    inputContract: ['projectId', 'currentScores', 'historicalRuns?'],
    outputContract: ['TemporalOutput'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'cross-cutting',
    canDelegate: false,
    runsAutonomously: true,  // Can self-trigger on schedule
  },

  'validation-agent': {
    id: 'validation-agent',
    name: 'Validation Agent',
    description: 'Checks all proposals for contradictions (Jaccard similarity), missing evidence, vague criteria, and high-risk gaps. Constraint satisfaction engine.',
    version: '1.0.0',
    inputContract: ['projectId', 'proposals: ImprovementProposal[]'],
    outputContract: ['ValidationOutput'],
    loopPhase: 'React',
    tier: 'specialist',
    crew: 'action',
    canDelegate: false,
    runsAutonomously: false,
  },

  'anomaly-detector': {
    id: 'anomaly-detector',
    name: 'Anomaly Detector',
    description: 'Z-score based outlier detection on dimension scores. Cross-portfolio statistical comparison. Worksheet contradiction rules. Imbalance detection (arch vs DS, WTP vs BM).',
    version: '1.0.0',
    inputContract: ['projectId', 'scores', 'worksheetAnswers?', 'portfolioScores?'],
    outputContract: ['AnomalyOutput'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'cross-cutting',
    canDelegate: false,
    runsAutonomously: false,
  },

  'causal-mapper': {
    id: 'causal-mapper',
    name: 'Causal Mapper',
    description: 'Replaces flat weighted-average SAC with a DAG-based causal model (Pearl 2000). Architecture→DataScience→BusinessModel chains. Computes causal score adjustments and causal SAC.',
    version: '1.0.0',
    inputContract: ['projectId', 'scores: Record<string, number>'],
    outputContract: ['CausalOutput'],
    loopPhase: 'Analyze',
    tier: 'specialist',
    crew: 'analysis',
    canDelegate: false,
    runsAutonomously: false,
  },

  'autonomous-executor': {
    id: 'autonomous-executor',
    name: 'Autonomous Executor',
    description: 'Reads generated manifest and prompt packets, clones the target repository, uses LLM to implement changes autonomously, and commits them via Git.',
    version: '1.0.0',
    inputContract: ['projectId', 'projectPath', 'moveId'],
    outputContract: ['success', 'branch', 'tmpDir'],
    loopPhase: 'React',
    tier: 'specialist',
    crew: 'action',
    canDelegate: false,
    runsAutonomously: true,
  },
};

// ─── Registry (definition + runner bound) ────────────────────────────────────

export const AGENT_REGISTRY: RegisteredAgent[] = [
  // Level 0
  { definition: AGENT_DEFINITIONS['strategist-supervisor'], run: runStrategistSupervisor as unknown as RegisteredAgent['run'] },
  // Level 1
  { definition: AGENT_DEFINITIONS['recon-lead'],    run: runReconLead    as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['analysis-lead'], run: runAnalysisLead as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['action-lead'],   run: runActionLead   as unknown as RegisteredAgent['run'] },
  // Level 2: Original
  { definition: AGENT_DEFINITIONS['portfolio-scanner'],              run: runPortfolioScanner              as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['worksheet-synthesizer'],          run: runWorksheetSynthesizer          as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['connected-strategy-analyst'],     run: runConnectedStrategyAnalyst      as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['competitive-advantage-analyst'],  run: runCompetitiveAdvantageAnalyst   as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['business-model-analyst'],         run: runBusinessModelAnalyst          as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['data-science-opportunity-analyst'],run: runDataScienceOpportunityAnalyst as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['architecture-improvement-analyst'],run: runArchitectureImprovementAnalyst as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['ai-frontier-analyst'],            run: runAIFrontierAnalyst             as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['proposal-composer'],              run: runProposalComposer              as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['competitive-intel-agent'],        run: runCompetitiveIntelAgent         as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['frontier-mapper-agent'],          run: runFrontierMapperAgent           as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['cost-estimator-agent'],           run: runCostEstimatorAgent            as unknown as RegisteredAgent['run'] },
  // Level 2: New Specialists
  { definition: AGENT_DEFINITIONS['temporal-analyst'],  run: runTemporalAnalyst  as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['validation-agent'],  run: runValidationAgent  as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['anomaly-detector'],  run: runAnomalyDetector  as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['causal-mapper'],     run: runCausalMapper     as unknown as RegisteredAgent['run'] },
  { definition: AGENT_DEFINITIONS['autonomous-executor'], run: runAutonomousExecutor as unknown as RegisteredAgent['run'] },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getRegisteredAgent(id: AgentId): RegisteredAgent | undefined {
  return AGENT_REGISTRY.find((a) => a.definition.id === id);
}

export function listAgentDefinitions(): AgentDefinition[] {
  return AGENT_REGISTRY.map((a) => a.definition);
}

/** Get all agents in a specific tier */
export function getAgentsByTier(tier: AgentDefinition['tier']): AgentDefinition[] {
  return AGENT_REGISTRY.map(a => a.definition).filter(d => d.tier === tier);
}

/** Get all agents in a specific crew */
export function getAgentsByCrew(crew: AgentDefinition['crew']): AgentDefinition[] {
  return AGENT_REGISTRY.map(a => a.definition).filter(d => d.crew === crew);
}
