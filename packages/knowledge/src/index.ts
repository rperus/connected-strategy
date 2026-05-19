/**
 * @cs/knowledge — index.ts  (SET-02 implemented)
 *
 * Knowledge ingestion, chunking, and indexing layer.
 * Owns: source mapping, Wharton worksheet ingestion, local file indexing.
 *
 * Design principles:
 * - Sources degrade gracefully if files don't exist yet.
 * - Chunk structure is ready for FTS (SQLite FTS5) without any LLM dependency.
 * - The LLM is a consumer of this index, not the producer of scores.
 */

import type {
  KnowledgeSourceType,
  KnowledgeSource,
  KnowledgeIndex,
  KnowledgeChunk,
  IngestionResult,
  BusinessPlanSource
} from './types.js';

export type {
  KnowledgeSourceType,
  KnowledgeSource,
  KnowledgeIndex,
  KnowledgeChunk,
  IngestionResult,
  BusinessPlanSource
};

export function createEmptyIndex(): KnowledgeIndex {
  return {
    version: '1.0.0',
    sources: [],
    lastFullScan: new Date().toISOString(),
    totalChunks: 0,
    readyForFts: false,
  };
}

// ─── Chunker (deterministic, no LLM) ─────────────────────────────────────────
/**
 * Splits a text file into chunks of approximately `maxChars` characters.
 * Preserves paragraph boundaries (double newline) where possible.
 * This is fully deterministic — no LLM involved.
 */
export function chunkText(
  sourceId: string,
  worksheetIds: string[],
  rawText: string,
  maxChars = 2400,
): KnowledgeChunk[] {
  const paragraphs = rawText.split(/\r?\n\r?\n/).filter((p) => p.trim().length > 0);
  const chunks: KnowledgeChunk[] = [];
  let buffer = '';
  let chunkIndex = 0;
  let startLine = 1;

  for (const paragraph of paragraphs) {
    if (buffer.length + paragraph.length > maxChars && buffer.length > 0) {
      chunks.push({
        id: `${sourceId}::chunk_${String(chunkIndex).padStart(3, '0')}`,
        sourceId,
        worksheetIds,
        content: buffer.trim(),
        startLine,
        createdAt: new Date().toISOString(),
      });
      chunkIndex++;
      startLine += buffer.split('\n').length;
      buffer = '';
    }
    buffer += (buffer ? '\n\n' : '') + paragraph;
  }

  if (buffer.trim().length > 0) {
    chunks.push({
      id: `${sourceId}::chunk_${String(chunkIndex).padStart(3, '0')}`,
      sourceId,
      worksheetIds,
      content: buffer.trim(),
      startLine,
      createdAt: new Date().toISOString(),
    });
  }

  return chunks;
}

// ─── Source Availability Check (sync, no I/O) ─────────────────────────────────
/**
 * Returns sources sorted by priority, with a readiness flag.
 * Actual file-exists check happens during ingestion (async, Node.js only).
 */
export function prioritizeSources(sources: KnowledgeSource[]): KnowledgeSource[] {
  return [...sources].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

// ─── Index Builder (in-memory, portable) ─────────────────────────────────────
/**
 * Builds a KnowledgeIndex from a list of sources and their ingestion results.
 * Persistence to SQLite or JSON is handled by the server layer (SET-03 / apps/server).
 */
export function buildIndex(
  sources: KnowledgeSource[],
  results: IngestionResult[],
): KnowledgeIndex {
  const resultMap = new Map(results.map((r) => [r.sourceId, r]));
  const updatedSources = sources.map((s) => {
    const result = resultMap.get(s.id);
    if (!result) return s;
    return {
      ...s,
      indexed: result.success,
      indexedAt: result.success ? result.indexedAt : s.indexedAt,
      chunkCount: result.chunksProduced,
    };
  });

  const totalChunks = updatedSources.reduce((sum, s) => sum + (s.chunkCount ?? 0), 0);
  const allIndexed = updatedSources.every((s) => s.indexed);

  return {
    version: '1.0.0',
    sources: updatedSources,
    lastFullScan: new Date().toISOString(),
    totalChunks,
    readyForFts: allIndexed && totalChunks > 0,
  };
}

// ─── Business Plan Slot ───────────────────────────────────────────────────────
/**
 * Placeholder structure for future business plan ingestion.
 * A business plan source can be added by the user or an agent at runtime.
 */

export function createBusinessPlanSource(
  projectId: string,
  title: string,
  path: string,
): BusinessPlanSource {
  return {
    id: `bp_${projectId}_${Date.now()}`,
    title,
    path,
    projectId,
    addedAt: new Date().toISOString(),
    indexed: false,
  };
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export {
  ALL_KNOWLEDGE_SOURCES,
  WHARTON_SOURCES,
  LOCAL_SOURCES,
  getSourceById,
  getSourcesByWorksheet,
} from './sources.js';
