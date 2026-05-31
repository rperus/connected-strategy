/**
 * @cs/agents — rag/index.ts
 *
 * Barrel export for the RAG (Retrieval-Augmented Generation) module.
 * Re-exports all public APIs for vector search, document parsing, and ingestion.
 */

export {
  vectorSearch,
  indexDocument,
  indexChunksBatch,
  getIndexStats,
  logIngestion,
  clearSource,
  clearAllChunks,
  closeKnowledgeDb,
} from './vectorStore.js';
export type { DocumentChunk } from './vectorStore.js';

export {
  parseAndIndexDocument,
  parseAndIndexSource,
  parseAndIndexText,
} from './documentParser.js';
export type { ParseResult } from './documentParser.js';

export {
  ingestAllSources,
  ingestSources,
  ingestCustomFile,
  ingestCustomText,
  getIngestionStatus,
  reindexSource,
  reindexAll,
} from './ingestion.js';
export type { IngestionReport } from './ingestion.js';
