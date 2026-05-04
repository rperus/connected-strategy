/**
 * @cs/agents — index.ts
 *
 * Deterministic multiagent analysis system for Connected Strategy.
 * 
 * All agents are workflow functions (not chat).
 * LLM is opt-in enrichment via AgentContext.llmProvider.
 *
 * Worker: SET-03
 */

// ─── Type contracts ───────────────────────────────────────────────────────────
export type {
  AgentId,
  AgentDefinition,
  AgentContext,
  AgentResult,
  AgentRunner,
  RegisteredAgent,
  AnalysisJob,
  JobStatus,
  ScanEntry,
  PortfolioScanResult,
  WorksheetSynthesisResult,
  AnalystFinding,
  AnalystReport,
} from './types.js';

// ─── Registry ─────────────────────────────────────────────────────────────────
export {
  AGENT_REGISTRY,
  AGENT_DEFINITIONS,
  getRegisteredAgent,
  listAgentDefinitions,
} from './registry.js';

// ─── Job Queue ────────────────────────────────────────────────────────────────
export {
  createJob,
  getJob,
  listJobs,
  listJobsByStatus,
  markRunning,
  markDone,
  markFailed,
  clearJobs,
  getQueueStats,
} from './job-queue.js';

// ─── Specialist agents (direct export for testing / programmatic use) ─────────
export { runPortfolioScanner } from './agents/portfolio-scanner.js';
export { runWorksheetSynthesizer } from './agents/worksheet-synthesizer.js';
export { runConnectedStrategyAnalyst } from './agents/connected-strategy-analyst.js';
export { runCompetitiveAdvantageAnalyst } from './agents/competitive-advantage-analyst.js';
export { runBusinessModelAnalyst } from './agents/business-model-analyst.js';
export { runDataScienceOpportunityAnalyst } from './agents/data-science-opportunity-analyst.js';
export { runArchitectureImprovementAnalyst } from './agents/architecture-improvement-analyst.js';
export { runAIFrontierAnalyst } from './agents/ai-frontier-analyst.js';
export { runProposalComposer } from './agents/proposal-composer.js';

// ─── LLM Provider (opt-in enrichment) ─────────────────────────────────────────
export { createGeminiProvider, getGeminiProvider } from './llm-provider.js';
export type { LLMProvider } from './llm-provider.js';

// ─── Gemini Enrichment (opt-in narrative / proposal enhancement) ──────────────
export { enrichAnalystNarrative, enrichProposals, synthesizePortfolioInsight } from './gemini-enrichment.js';

// ─── V3 Pipeline ──────────────────────────────────────────────────────────────
export { ProjectStateStore } from './v3/state-store.js';
export type { ProjectStateV3, Priority } from './v3/state-store.js';
export { runV3Pipeline } from './v3/pipeline-orchestrator.js';
export type { RunV3Opts } from './v3/pipeline-orchestrator.js';
