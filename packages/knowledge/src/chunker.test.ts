/**
 * @cs/knowledge — chunker.test.ts
 *
 * Unit tests for the deterministic text chunker.
 * Run: node --test src/chunker.test.ts  (Node.js 20+)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { chunkText } from './index.js';

describe('chunkText', () => {
  it('empty input → no chunks', () => {
    const chunks = chunkText('src_test', [], '');
    assert.equal(chunks.length, 0);
  });

  it('short text → single chunk', () => {
    const text = 'Connected Strategy is a framework for creating connected customer experiences.';
    const chunks = chunkText('src_short', ['ws02_connected_loop'], text, 2400);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].sourceId, 'src_short');
    assert.deepEqual(chunks[0].worksheetIds, ['ws02_connected_loop']);
  });

  it('chunk id includes source id and padded index', () => {
    const text = 'Para 1.\n\nPara 2.\n\nPara 3.';
    const chunks = chunkText('src_id_test', [], text, 2400);
    assert.ok(chunks[0].id.startsWith('src_id_test::chunk_'));
  });

  it('large text splits into multiple chunks at paragraph boundaries', () => {
    const paragraph = 'A'.repeat(500);
    // 6 paragraphs of 500 chars each, maxChars=1000 → should produce 3 chunks
    const text = Array(6).fill(paragraph).join('\n\n');
    const chunks = chunkText('src_large', ['ws01_problem_actors'], text, 1000);
    assert.ok(chunks.length >= 3, `expected >=3 chunks, got ${chunks.length}`);
    for (const chunk of chunks) {
      assert.ok(chunk.content.length <= 1100, 'chunk should not wildly exceed maxChars');
    }
  });

  it('all chunks carry worksheet IDs', () => {
    const wsIds = ['ws01_problem_actors', 'ws02_connected_loop'];
    const text = 'First para.\n\nSecond para.\n\nThird para.';
    const chunks = chunkText('src_ws', wsIds, text, 50);
    for (const chunk of chunks) {
      assert.deepEqual(chunk.worksheetIds, wsIds);
    }
  });

  it('chunk createdAt is an ISO string', () => {
    const chunks = chunkText('src_ts', [], 'Hello world.', 2400);
    assert.ok(chunks.length > 0);
    assert.ok(!isNaN(Date.parse(chunks[0].createdAt)));
  });
});
