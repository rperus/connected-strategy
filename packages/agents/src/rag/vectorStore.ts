/**
 * @cs/agents — rag/vectorStore.ts
 *
 * Real vector store implementation using SQLite FTS5 for full-text search.
 * Replaces the mock implementation with BM25-ranked keyword search.
 *
 * Design decisions:
 * - SQLite FTS5 instead of embeddings: no external API needed, deterministic,
 *   and ideal for structured Wharton content where terminology is specific.
 * - BM25 ranking gives good relevance for domain-specific queries.
 * - Stores chunks with source metadata for citation support.
 * - Thread-safe via better-sqlite3's synchronous API.
 */

import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
  /** BM25 relevance score from FTS5 (lower = more relevant) */
  score?: number;
}

// ─── Database singleton ───────────────────────────────────────────────────────

let _db: Database.Database | null = null;

function getKnowledgeDb(): Database.Database {
  if (_db) return _db;

  const dataDir = process.env.CS_DATA_DIR || path.resolve(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'knowledge.db');

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Create tables if they don't exist
  _db.exec(`
    -- Chunk storage table
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source_title TEXT,
      content TEXT NOT NULL,
      section_title TEXT,
      worksheet_ids TEXT,          -- JSON array of worksheet IDs
      loop_phase TEXT,
      keywords TEXT,               -- JSON array
      start_line INTEGER,
      created_at TEXT NOT NULL,
      content_hash TEXT NOT NULL
    );

    -- FTS5 virtual table for full-text search
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      id,
      content,
      source_title,
      section_title,
      worksheet_ids,
      content='chunks',
      content_rowid='rowid',
      tokenize='unicode61 remove_diacritics 2'
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, id, content, source_title, section_title, worksheet_ids)
      VALUES (new.rowid, new.id, new.content, new.source_title, new.section_title, new.worksheet_ids);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, id, content, source_title, section_title, worksheet_ids)
      VALUES ('delete', old.rowid, old.id, old.content, old.source_title, old.section_title, old.worksheet_ids);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, id, content, source_title, section_title, worksheet_ids)
      VALUES ('delete', old.rowid, old.id, old.content, old.source_title, old.section_title, old.worksheet_ids);
      INSERT INTO chunks_fts(rowid, id, content, source_title, section_title, worksheet_ids)
      VALUES (new.rowid, new.id, new.content, new.source_title, new.section_title, new.worksheet_ids);
    END;

    -- Ingestion tracking table
    CREATE TABLE IF NOT EXISTS ingestion_log (
      source_id TEXT PRIMARY KEY,
      source_title TEXT,
      file_path TEXT,
      chunks_produced INTEGER DEFAULT 0,
      indexed_at TEXT NOT NULL,
      file_hash TEXT,
      status TEXT DEFAULT 'success'
    );

    -- Create index for fast source lookups
    CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
  `);

  return _db;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Index a document chunk into the FTS5 store.
 * Skips duplicates based on content hash.
 */
export async function indexDocument(
  fileBuffer: Buffer,
  metadata: Record<string, any>,
): Promise<void> {
  const db = getKnowledgeDb();
  const content = fileBuffer.toString('utf-8');
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  const id = metadata.id || `chunk_${contentHash.substring(0, 12)}`;

  const existing = db.prepare('SELECT id FROM chunks WHERE content_hash = ?').get(contentHash);
  if (existing) return; // Skip duplicates

  db.prepare(`
    INSERT OR REPLACE INTO chunks (id, source_id, source_title, content, section_title, worksheet_ids, loop_phase, keywords, start_line, created_at, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    metadata.sourceId || 'unknown',
    metadata.sourceTitle || null,
    content,
    metadata.sectionTitle || null,
    JSON.stringify(metadata.worksheetIds || []),
    metadata.loopPhase || null,
    JSON.stringify(metadata.keywords || []),
    metadata.startLine || null,
    new Date().toISOString(),
    contentHash,
  );
}

/**
 * Batch index multiple chunks efficiently within a transaction.
 */
export function indexChunksBatch(
  chunks: Array<{
    id: string;
    sourceId: string;
    sourceTitle?: string;
    content: string;
    sectionTitle?: string;
    worksheetIds?: string[];
    loopPhase?: string;
    keywords?: string[];
    startLine?: number;
  }>,
): { indexed: number; skipped: number } {
  const db = getKnowledgeDb();
  let indexed = 0;
  let skipped = 0;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO chunks (id, source_id, source_title, content, section_title, worksheet_ids, loop_phase, keywords, start_line, created_at, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkStmt = db.prepare('SELECT id FROM chunks WHERE content_hash = ?');

  const insertMany = db.transaction(() => {
    for (const chunk of chunks) {
      const contentHash = crypto.createHash('sha256').update(chunk.content).digest('hex');
      const existing = checkStmt.get(contentHash);
      if (existing) {
        skipped++;
        continue;
      }

      insertStmt.run(
        chunk.id,
        chunk.sourceId,
        chunk.sourceTitle || null,
        chunk.content,
        chunk.sectionTitle || null,
        JSON.stringify(chunk.worksheetIds || []),
        chunk.loopPhase || null,
        JSON.stringify(chunk.keywords || []),
        chunk.startLine || null,
        new Date().toISOString(),
        contentHash,
      );
      indexed++;
    }
  });

  insertMany();
  return { indexed, skipped };
}

/**
 * Search for relevant chunks using FTS5 with BM25 ranking.
 *
 * @param query - Natural language query
 * @param topK - Maximum number of results (default: 5)
 * @param worksheetFilter - Optional: only return chunks from specific worksheets
 * @returns Ranked chunks with relevance scores
 */
export async function vectorSearch(
  query: string,
  topK: number = 5,
  worksheetFilter?: string,
): Promise<{ chunks: DocumentChunk[]; totalMatches: number }> {
  const db = getKnowledgeDb();

  // Sanitize query for FTS5 (escape special chars, add proximity)
  const sanitized = sanitizeFtsQuery(query);

  if (!sanitized) {
    return { chunks: [], totalMatches: 0 };
  }

  try {
    let rows: any[];

    if (worksheetFilter) {
      rows = db.prepare(`
        SELECT c.id, c.content, c.source_id, c.source_title, c.section_title,
               c.worksheet_ids, c.loop_phase, c.keywords,
               bm25(chunks_fts, 0, 1.0, 0.5, 0.5, 0.3) AS score
        FROM chunks_fts fts
        JOIN chunks c ON c.id = fts.id
        WHERE chunks_fts MATCH ?
          AND c.worksheet_ids LIKE ?
        ORDER BY score ASC
        LIMIT ?
      `).all(sanitized, `%${worksheetFilter}%`, topK);
    } else {
      rows = db.prepare(`
        SELECT c.id, c.content, c.source_id, c.source_title, c.section_title,
               c.worksheet_ids, c.loop_phase, c.keywords,
               bm25(chunks_fts, 0, 1.0, 0.5, 0.5, 0.3) AS score
        FROM chunks_fts fts
        JOIN chunks c ON c.id = fts.id
        WHERE chunks_fts MATCH ?
        ORDER BY score ASC
        LIMIT ?
      `).all(sanitized, topK);
    }

    const chunks: DocumentChunk[] = rows.map((row) => ({
      id: row.id,
      text: row.content,
      metadata: {
        sourceId: row.source_id,
        sourceTitle: row.source_title,
        sectionTitle: row.section_title,
        worksheetIds: safeJsonParse(row.worksheet_ids, []),
        loopPhase: row.loop_phase,
        keywords: safeJsonParse(row.keywords, []),
      },
      score: row.score,
    }));

    return { chunks, totalMatches: chunks.length };
  } catch (err: any) {
    // FTS5 query syntax error — retry with simplified query before falling back to LIKE
    console.warn(`[RAG] FTS5 query failed, retrying with simplified terms: ${err.message}`);

    // Stage 1: Try a simpler FTS5 query (strip all non-alpha, use individual OR terms)
    const simpleWords = query
      .replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5)
      .map((w) => `"${w}"`);

    if (simpleWords.length > 0) {
      try {
        const simpleQuery = simpleWords.join(' OR ');
        const rows = db.prepare(`
          SELECT c.id, c.content, c.source_id, c.source_title, c.section_title,
                 c.worksheet_ids, c.loop_phase, c.keywords,
                 bm25(chunks_fts, 0, 1.0, 0.5, 0.5, 0.3) AS score
          FROM chunks_fts fts
          JOIN chunks c ON c.id = fts.id
          WHERE chunks_fts MATCH ?
          ORDER BY score ASC
          LIMIT ?
        `).all(simpleQuery, topK);

        const chunks: DocumentChunk[] = (rows as any[]).map((row: any) => ({
          id: row.id,
          text: row.content,
          metadata: {
            sourceId: row.source_id,
            sourceTitle: row.source_title,
            worksheetIds: safeJsonParse(row.worksheet_ids, []),
            loopPhase: row.loop_phase,
            keywords: safeJsonParse(row.keywords, []),
          },
          score: row.score,
        }));

        return { chunks, totalMatches: chunks.length };
      } catch {
        // Simplified FTS5 also failed — fall through to LIKE
      }
    }

    // Stage 2: Last-resort LIKE fallback (sequential scan, but bounded by LIMIT)
    console.warn(`[RAG] Simplified FTS5 also failed, falling back to LIKE scan`);
    const likeQuery = `%${query.split(/\s+/).join('%')}%`;
    const rows = db.prepare(`
      SELECT id, content, source_id, source_title, section_title,
             worksheet_ids, loop_phase, keywords
      FROM chunks
      WHERE content LIKE ?
      LIMIT ?
    `).all(likeQuery, topK);

    const chunks: DocumentChunk[] = (rows as any[]).map((row: any) => ({
      id: row.id,
      text: row.content,
      metadata: {
        sourceId: row.source_id,
        sourceTitle: row.source_title,
        worksheetIds: safeJsonParse(row.worksheet_ids, []),
      },
    }));

    return { chunks, totalMatches: chunks.length };
  }
}

/**
 * Get statistics about the knowledge index.
 */
export function getIndexStats(): {
  totalChunks: number;
  sourceCount: number;
  sources: Array<{ sourceId: string; title: string; chunkCount: number; indexedAt: string }>;
} {
  const db = getKnowledgeDb();

  const totalChunks = (db.prepare('SELECT COUNT(*) as count FROM chunks').get() as any)?.count || 0;

  const sources = db.prepare(`
    SELECT source_id, source_title, chunks_produced, indexed_at
    FROM ingestion_log
    ORDER BY indexed_at DESC
  `).all() as any[];

  return {
    totalChunks,
    sourceCount: sources.length,
    sources: sources.map((s) => ({
      sourceId: s.source_id,
      title: s.source_title || s.source_id,
      chunkCount: s.chunks_produced,
      indexedAt: s.indexed_at,
    })),
  };
}

/**
 * Log an ingestion event.
 */
export function logIngestion(
  sourceId: string,
  sourceTitle: string,
  filePath: string,
  chunksProduced: number,
  fileHash: string,
  status: 'success' | 'error' = 'success',
): void {
  const db = getKnowledgeDb();
  db.prepare(`
    INSERT OR REPLACE INTO ingestion_log (source_id, source_title, file_path, chunks_produced, indexed_at, file_hash, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(sourceId, sourceTitle, filePath, chunksProduced, new Date().toISOString(), fileHash, status);
}

/**
 * Clear all chunks for a given source (for re-indexing).
 */
export function clearSource(sourceId: string): number {
  const db = getKnowledgeDb();
  const result = db.prepare('DELETE FROM chunks WHERE source_id = ?').run(sourceId);
  return result.changes;
}

/**
 * Clear the entire knowledge index.
 */
export function clearAllChunks(): number {
  const db = getKnowledgeDb();
  const result = db.prepare('DELETE FROM chunks').run();
  db.prepare('DELETE FROM ingestion_log').run();
  return result.changes;
}

/**
 * Close the knowledge database connection.
 */
export function closeKnowledgeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Sanitize a natural language query for FTS5 MATCH syntax.
 * Converts "customer journey pain points" → "customer OR journey OR pain OR points"
 * for broad recall, or uses NEAR for proximity matching.
 */
function sanitizeFtsQuery(query: string): string {
  // Remove FTS5 special characters
  const cleaned = query.replace(/[*"(){}[\]:^~!@#$%&\\]/g, ' ').trim();
  if (!cleaned) return '';

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 1) // Skip single chars
    .map((w) => `"${w}"`)        // Quote each word for exact term matching
    .slice(0, 10);               // Limit terms

  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  // Use OR for broad recall
  return words.join(' OR ');
}

function safeJsonParse(str: string | null, fallback: any): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
