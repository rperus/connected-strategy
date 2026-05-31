/**
 * @cs/agents — rag/ingestion.ts
 *
 * Orchestrates batch ingestion of all knowledge sources into the FTS5 store.
 * Reads from the @cs/knowledge source catalog and indexes each file.
 *
 * Usage:
 *   import { ingestAllSources, getIngestionStatus } from './rag/ingestion.js';
 *   await ingestAllSources(); // Index all Wharton + local sources
 */

import { ALL_KNOWLEDGE_SOURCES } from '@cs/knowledge';
import type { KnowledgeSource } from '@cs/knowledge';
import { parseAndIndexSource, parseAndIndexText } from './documentParser.js';
import type { ParseResult } from './documentParser.js';
import { getIndexStats, clearSource, clearAllChunks } from './vectorStore.js';

export interface IngestionReport {
  startedAt: string;
  completedAt: string;
  totalSources: number;
  successful: number;
  failed: number;
  totalChunksIndexed: number;
  results: ParseResult[];
  durationMs: number;
}

/**
 * Ingest all knowledge sources from the @cs/knowledge catalog.
 * Skips sources whose files don't exist on disk (graceful degradation).
 */
export async function ingestAllSources(): Promise<IngestionReport> {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const results: ParseResult[] = [];

  console.log(`[RAG] 📚 Starting ingestion of ${ALL_KNOWLEDGE_SOURCES.length} knowledge sources...`);

  for (const source of ALL_KNOWLEDGE_SOURCES) {
    const result = await parseAndIndexSource(source);
    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalChunksIndexed = results.reduce((sum, r) => sum + r.chunksProduced, 0);

  const report: IngestionReport = {
    startedAt,
    completedAt: new Date().toISOString(),
    totalSources: ALL_KNOWLEDGE_SOURCES.length,
    successful,
    failed,
    totalChunksIndexed,
    results,
    durationMs: Date.now() - start,
  };

  console.log(
    `[RAG] 📚 Ingestion complete: ${successful}/${ALL_KNOWLEDGE_SOURCES.length} sources, ${totalChunksIndexed} chunks in ${report.durationMs}ms`,
  );

  return report;
}

/**
 * Ingest a specific set of sources by their IDs.
 */
export async function ingestSources(sourceIds: string[]): Promise<IngestionReport> {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const results: ParseResult[] = [];

  const sources = ALL_KNOWLEDGE_SOURCES.filter((s) => sourceIds.includes(s.id));

  for (const source of sources) {
    const result = await parseAndIndexSource(source);
    results.push(result);
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    totalSources: sources.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    totalChunksIndexed: results.reduce((sum, r) => sum + r.chunksProduced, 0),
    results,
    durationMs: Date.now() - start,
  };
}

/**
 * Ingest a custom file (e.g., a business plan uploaded by the user).
 */
export async function ingestCustomFile(
  filePath: string,
  title: string,
  worksheetIds: string[] = [],
): Promise<ParseResult> {
  const customSource: KnowledgeSource = {
    id: `custom_${Date.now()}`,
    path: filePath,
    type: 'custom',
    title,
    indexed: false,
    worksheetIds,
    priority: 5,
  };
  return parseAndIndexSource(customSource);
}

/**
 * Ingest custom text content (e.g., pasted content from the UI).
 */
export async function ingestCustomText(
  text: string,
  title: string,
  worksheetIds: string[] = [],
): Promise<ParseResult> {
  const sourceId = `custom_text_${Date.now()}`;
  return parseAndIndexText(text, sourceId, title, worksheetIds);
}

/**
 * Get the current status of the knowledge index.
 */
export function getIngestionStatus(): {
  totalChunks: number;
  sourceCount: number;
  sources: Array<{ sourceId: string; title: string; chunkCount: number; indexedAt: string }>;
  catalogSources: Array<{ id: string; title: string; type: string; indexed: boolean }>;
} {
  const stats = getIndexStats();

  // Map indexed status from the DB back to the catalog
  const indexedIds = new Set(stats.sources.map((s) => s.sourceId));
  const catalogSources = ALL_KNOWLEDGE_SOURCES.map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    indexed: indexedIds.has(s.id),
  }));

  return {
    ...stats,
    catalogSources,
  };
}

/**
 * Re-index a specific source (clears old chunks first).
 */
export async function reindexSource(sourceId: string): Promise<ParseResult> {
  clearSource(sourceId);
  const source = ALL_KNOWLEDGE_SOURCES.find((s) => s.id === sourceId);
  if (!source) {
    return {
      sourceId,
      success: false,
      chunksProduced: 0,
      errorMessage: `Source "${sourceId}" not found in catalog`,
      durationMs: 0,
    };
  }
  return parseAndIndexSource(source);
}

/**
 * Re-index all sources (clears entire index first).
 */
export async function reindexAll(): Promise<IngestionReport> {
  clearAllChunks();
  return ingestAllSources();
}
