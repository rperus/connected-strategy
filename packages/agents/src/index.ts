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

// Legacy V2 endpoints removed

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
export { getHistoricalRuns } from './v3/db/index.js';
export * from './v3/types.js';

// V3 Pipeline
export * from './v3/pipeline-orchestrator.js';
export * from './v3/state-store.js';
export * from './v3/shared-findings.js';

// New Agents
export * from './agents/batch-reporter.js';
export * from './agents/synthetic-consultant.js';
export * from './agents/market-intel-agent.js';

// ─── RAG (Retrieval-Augmented Generation) ─────────────────────────────────────
export {
  vectorSearch,
  indexDocument,
  indexChunksBatch,
  getIndexStats,
  clearSource,
  clearAllChunks,
  closeKnowledgeDb,
} from './rag/vectorStore.js';
export type { DocumentChunk } from './rag/vectorStore.js';

export {
  parseAndIndexDocument,
  parseAndIndexSource,
  parseAndIndexText,
} from './rag/documentParser.js';
export type { ParseResult } from './rag/documentParser.js';

export {
  ingestAllSources,
  ingestSources,
  ingestCustomFile,
  ingestCustomText,
  getIngestionStatus,
  reindexSource,
  reindexAll,
} from './rag/ingestion.js';
export type { IngestionReport } from './rag/ingestion.js';
