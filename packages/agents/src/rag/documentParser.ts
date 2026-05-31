/**
 * @cs/agents — rag/documentParser.ts
 *
 * Real document parser that reads files from disk, chunks them using
 * the @cs/knowledge chunker, and indexes them into the FTS5 store.
 *
 * Supports: .txt, .md files
 * Graceful degradation: if a file doesn't exist, logs a warning and skips.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { chunkText } from '@cs/knowledge';
import type { KnowledgeSource, KnowledgeChunk } from '@cs/knowledge';
import { indexChunksBatch, logIngestion } from './vectorStore.js';

export interface ParseResult {
  sourceId: string;
  success: boolean;
  chunksProduced: number;
  errorMessage?: string;
  durationMs: number;
}

/**
 * Parse and index a single document from a KnowledgeSource definition.
 */
export async function parseAndIndexDocument(
  filePath: string,
  sourceDomain: string,
): Promise<void> {
  const source: KnowledgeSource = {
    id: sourceDomain,
    path: filePath,
    type: 'custom',
    title: path.basename(filePath),
    indexed: false,
  };
  await parseAndIndexSource(source);
}

/**
 * Parse and index a document from a KnowledgeSource definition.
 * Reads the file, chunks it, and batch-indexes into SQLite FTS5.
 */
export async function parseAndIndexSource(source: KnowledgeSource): Promise<ParseResult> {
  const start = Date.now();

  // Resolve path (handle both absolute and relative)
  const resolvedPath = path.isAbsolute(source.path)
    ? source.path
    : path.resolve(process.cwd(), source.path);

  // Check file exists
  if (!fs.existsSync(resolvedPath)) {
    const msg = `File not found: ${resolvedPath}`;
    console.warn(`[RAG] ⚠️ ${msg} — skipping source "${source.title}"`);
    logIngestion(source.id, source.title, resolvedPath, 0, '', 'error');
    return {
      sourceId: source.id,
      success: false,
      chunksProduced: 0,
      errorMessage: msg,
      durationMs: Date.now() - start,
    };
  }

  try {
    // Read file content
    const rawText = fs.readFileSync(resolvedPath, 'utf-8');
    const fileHash = crypto.createHash('sha256').update(rawText).digest('hex');

    // Chunk using @cs/knowledge chunker
    const worksheetIds = source.worksheetIds || [];
    const knowledgeChunks: KnowledgeChunk[] = chunkText(
      source.id,
      worksheetIds,
      rawText,
      2400, // ~600 tokens per chunk
    );

    // Enrich chunks with section detection
    const enrichedChunks = knowledgeChunks.map((chunk) => ({
      id: chunk.id,
      sourceId: chunk.sourceId,
      sourceTitle: source.title,
      content: chunk.content,
      sectionTitle: detectSectionTitle(chunk.content),
      worksheetIds: chunk.worksheetIds,
      loopPhase: detectLoopPhase(chunk.content),
      keywords: extractKeywords(chunk.content),
      startLine: chunk.startLine,
    }));

    // Batch index into SQLite FTS5
    const { indexed, skipped } = indexChunksBatch(enrichedChunks);

    // Log ingestion
    logIngestion(source.id, source.title, resolvedPath, indexed, fileHash, 'success');

    console.log(
      `[RAG] ✅ Indexed "${source.title}": ${indexed} chunks (${skipped} skipped) in ${Date.now() - start}ms`,
    );

    return {
      sourceId: source.id,
      success: true,
      chunksProduced: indexed,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    const msg = err.message || String(err);
    console.error(`[RAG] ❌ Failed to index "${source.title}": ${msg}`);
    logIngestion(source.id, source.title, resolvedPath, 0, '', 'error');
    return {
      sourceId: source.id,
      success: false,
      chunksProduced: 0,
      errorMessage: msg,
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Parse and index a raw text string (for custom content like business plans).
 */
export async function parseAndIndexText(
  text: string,
  sourceId: string,
  sourceTitle: string,
  worksheetIds: string[] = [],
): Promise<ParseResult> {
  const start = Date.now();

  try {
    const chunks = chunkText(sourceId, worksheetIds, text, 2400);

    const enrichedChunks = chunks.map((chunk) => ({
      id: chunk.id,
      sourceId: chunk.sourceId,
      sourceTitle,
      content: chunk.content,
      sectionTitle: detectSectionTitle(chunk.content),
      worksheetIds: chunk.worksheetIds,
      loopPhase: detectLoopPhase(chunk.content),
      keywords: extractKeywords(chunk.content),
      startLine: chunk.startLine,
    }));

    const { indexed, skipped } = indexChunksBatch(enrichedChunks);
    const fileHash = crypto.createHash('sha256').update(text).digest('hex');
    logIngestion(sourceId, sourceTitle, '<inline-text>', indexed, fileHash, 'success');

    console.log(`[RAG] ✅ Indexed inline text "${sourceTitle}": ${indexed} chunks`);

    return {
      sourceId,
      success: true,
      chunksProduced: indexed,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      sourceId,
      success: false,
      chunksProduced: 0,
      errorMessage: err.message,
      durationMs: Date.now() - start,
    };
  }
}

// ─── Heuristic enrichment helpers ─────────────────────────────────────────────

/**
 * Detect section title from the first line if it looks like a heading.
 */
function detectSectionTitle(content: string): string | undefined {
  const firstLine = content.split('\n')[0].trim();
  // Markdown heading
  if (firstLine.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '');
  }
  // All-caps line (common in .txt files)
  if (firstLine.length > 3 && firstLine.length < 100 && firstLine === firstLine.toUpperCase()) {
    return firstLine;
  }
  return undefined;
}

/**
 * Detect which Connected Strategy loop phase the content relates to.
 */
function detectLoopPhase(content: string): string | undefined {
  const lower = content.toLowerCase();
  const phases: Array<[string, string[]]> = [
    ['Sense', ['sense', 'sensing', 'detect', 'data collection', 'observe', 'monitor']],
    ['Transmit', ['transmit', 'communication', 'channel', 'information flow', 'data pipeline']],
    ['Analyze', ['analyze', 'analysis', 'insight', 'pattern', 'segment', 'predict', 'model']],
    ['React', ['react', 'response', 'action', 'intervention', 'recommendation', 'personalize']],
    ['Repeat', ['repeat', 'learning loop', 'flywheel', 'feedback', 'continuous', 'iterate']],
  ];

  let bestPhase: string | undefined;
  let bestScore = 0;

  for (const [phase, keywords] of phases) {
    const score = keywords.reduce((sum, kw) => {
      const regex = new RegExp(kw, 'gi');
      return sum + (lower.match(regex)?.length || 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestPhase = phase;
    }
  }

  return bestScore >= 2 ? bestPhase : undefined;
}

/**
 * Extract domain-relevant keywords from content.
 */
function extractKeywords(content: string): string[] {
  const domainTerms = [
    'connected strategy', 'willingness to pay', 'wtp', 'cost driver',
    'switching cost', 'moat', 'flywheel', 'customer journey',
    'pain point', 'connected delivery', 'respond to desire',
    'curated offering', 'coach behavior', 'automatic execution',
    'five forces', 'activity system', 'efficiency frontier',
    'value chain', 'revenue model', 'closed loop',
    'sense', 'transmit', 'analyze', 'react', 'repeat',
    'competitive advantage', 'data science', 'architecture',
  ];

  const lower = content.toLowerCase();
  return domainTerms.filter((term) => lower.includes(term));
}
