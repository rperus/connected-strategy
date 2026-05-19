/**
 * @cs/knowledge — chunker.test.ts
 *
 * Unit tests for the deterministic text chunker.
 * Run: pnpm test
 */

import { describe, it, expect } from 'vitest';

import { chunkText } from './index.js';

describe('chunkText', () => {
  it('empty input → no chunks', () => {
    const chunks = chunkText('src_test', [], '');
    expect(chunks.length).toBe(0);
  });

  it('short text → single chunk', () => {
    const text = 'Connected Strategy is a framework for creating connected customer experiences.';
    const chunks = chunkText('src_short', ['ws02_connected_loop'], text, 2400);
    expect(chunks.length).toBe(1);
    expect(chunks[0].sourceId).toBe('src_short');
    expect(chunks[0].worksheetIds).toEqual(['ws02_connected_loop']);
  });

  it('chunk id includes source id and padded index', () => {
    const text = 'Para 1.\n\nPara 2.\n\nPara 3.';
    const chunks = chunkText('src_id_test', [], text, 2400);
    expect(chunks[0].id.startsWith('src_id_test::chunk_')).toBe(true);
  });

  it('large text splits into multiple chunks at paragraph boundaries', () => {
    const paragraph = 'A'.repeat(500);
    // 6 paragraphs of 500 chars each, maxChars=1000 → should produce 3 chunks
    const text = Array(6).fill(paragraph).join('\n\n');
    const chunks = chunkText('src_large', ['ws01_problem_actors'], text, 1000);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(1100);
    }
  });

  it('all chunks carry worksheet IDs', () => {
    const wsIds = ['ws01_problem_actors', 'ws02_connected_loop'];
    const text = 'First para.\n\nSecond para.\n\nThird para.';
    const chunks = chunkText('src_ws', wsIds, text, 50);
    for (const chunk of chunks) {
      expect(chunk.worksheetIds).toEqual(wsIds);
    }
  });

  it('chunk createdAt is an ISO string', () => {
    const chunks = chunkText('src_ts', [], 'Hello world.', 2400);
    expect(chunks.length).toBeGreaterThan(0);
    expect(isNaN(Date.parse(chunks[0].createdAt))).toBe(false);
  });
});
