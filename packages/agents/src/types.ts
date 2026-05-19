/**
 * @cs/agents — types.ts
 *
 * Core type contracts for the deterministic multiagent analysis system.
 * Agents are workflow functions, not chat. Each agent receives a typed
 * input and produces a typed output with evidence tracing.
 */

import type {
  Project,
  WorksheetAnswer,
  StrategicMetrics,
  ImprovementProposal,
  CompetitiveLandscape,
} from '@cs/domain';

// ─── Agent Identity ───────────────────────────────────────────────────────────

export type AgentId =
  | 'portfolio-scanner'
  | 'worksheet-synthesizer'
  | 'connected-strategy-analyst'
  | 'competitive-advantage-analyst'
  | 'business-model-analyst'
  | 'data-science-opportunity-analyst'
  | 'architecture-improvement-analyst'
  | 'ai-frontier-analyst'
  | 'proposal-composer'
  | 'competitive-intel-agent'
  | 'frontier-mapper-agent'
  | 'cost-estimator-agent'
  // ── Phase 1: Hierarchical Swarm ───────────────────────────────
  | 'strategist-supervisor'
  | 'recon-lead'
  | 'analysis-lead'
  | 'action-lead'
  | 'temporal-analyst'
  | 'validation-agent'
  | 'anomaly-detector'
  | 'causal-mapper'
  | 'autonomous-executor';

/**
 * Tier in the 3-level swarm hierarchy:
 * - supervisor: meta-agent that plans, delegates, and validates
 * - crew-lead: coordinates a team of specialists, routes work
 * - specialist: executes a single focused domain task
 */
export type AgentTier = 'supervisor' | 'crew-lead' | 'specialist';

/**
 * Crew grouping — which functional team the agent belongs to.
 * Crew leads own their crew's coordination.
 */
export type CrewId = 'recon' | 'analysis' | 'action' | 'cross-cutting' | 'none';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  version: string;
  inputContract: string[];
  outputContract: string[];
  /** Sense→Transmit→Analyze→React→Repeat phase this agent operates in */
  loopPhase: 'Sense' | 'Transmit' | 'Analyze' | 'React' | 'Repeat';
  /** Hierarchical tier in the swarm */
  tier: AgentTier;
  /** Which crew this agent belongs to */
  crew: CrewId;
  /** Can this agent delegate work to sub-agents? */
  canDelegate: boolean;
  /** Can this agent self-trigger on a schedule? */
  runsAutonomously: boolean;
}

// ─── Agent Context (shared across all agents) ─────────────────────────────────

export interface AgentContext {
  jobId: string;
  projectId: string;
  /** Timestamp when job started */
  startedAt: string;
  /** Optional LLM hint — agents are deterministic by default, LLM is optional enrichment */
  llmProvider?: 'gemini' | 'openai' | 'local';
}

// ─── Agent Result ─────────────────────────────────────────────────────────────

export interface AgentResult<T = unknown> {
  agentId: AgentId;
  jobId: string;
  success: boolean;
  data?: T;
  errorMessage?: string;
  durationMs: number;
  evidence: string[];   // file paths, worksheet IDs, metric refs
  completedAt: string;
}

// ─── Analysis Job ─────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface AnalysisJob {
  id: string;
  projectId: string;
  agentId: AgentId;
  status: JobStatus;
  /** Serialized input payload */
  input: Record<string, unknown>;
  result?: AgentResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

// ─── Specialist Output Types ──────────────────────────────────────────────────

export interface ScanEntry {
  path: string;
  name: string;
  stack: string[];
  maturity: 'nascent' | 'developing' | 'mature' | 'legacy';
  hasPackageJson: boolean;
  hasPyproject: boolean;
  hasGit: boolean;
  fileCount: number;
  tags: string[];
  detectedAt: string;
}

export interface PortfolioScanResult {
  scanPath: string;
  projects: ScanEntry[];
  scannedAt: string;
  totalFound: number;
}

export interface WorksheetSynthesisResult {
  worksheetId: string;
  projectId: string;
  autoFilledAnswers: Record<string, unknown>;
  confidence: Record<string, 'observed' | 'inferred' | 'confirmed'>;
  evidence: string[];
  synthesizedAt: string;
}

export interface AnalystFinding {
  category: string;
  title: string;
  detail: string;
  evidence: string[];
  impactOnWTP: 'positive' | 'negative' | 'neutral';
  impactOnCost: 'positive' | 'negative' | 'neutral';
  impactOnSwitchingCosts: 'positive' | 'negative' | 'neutral';
  loopPhase: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalystReport {
  projectId: string;
  agentId: AgentId;
  findings: AnalystFinding[];
  summaryNarrative: string;
  recommendedProposals: Array<{
    title: string;
    rationale: string;
    changeType: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  analyzedAt: string;
}

// ─── Agent Runner Contract ─────────────────────────────────────────────────────

/**
 * AgentRunner is a pure async function: input → output.
 * No side effects on other scopes. No chat.
 */
export type AgentRunner<TInput = Record<string, unknown>, TOutput = unknown> = (
  input: TInput,
  context: AgentContext,
) => Promise<AgentResult<TOutput>>;

// ─── Registered Agent (definition + runner bound together) ────────────────────

export interface RegisteredAgent<TInput = Record<string, unknown>, TOutput = unknown> {
  definition: AgentDefinition;
  run: AgentRunner<TInput, TOutput>;
}
