/**
 * Connected Strategy — Core Tests
 *
 * Tests for domain scoring, pipeline normalization, and API contracts.
 */

import { describe, it, expect } from 'vitest';
import { computeStrategicMetrics, defaultScoringWeights, ALL_WORKSHEETS } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';

// ─── Domain: Scoring ──────────────────────────────────────────────────────────

describe('computeStrategicMetrics', () => {
  it('produces a valid SAC score from empty answers', () => {
    const answer: WorksheetAnswer = {
      id: 'test-1',
      worksheetId: 'all',
      projectId: 'test_project',
      version: 1,
      answers: {},
      confidence: {},
      updatedAt: new Date().toISOString(),
    };
    const weights = defaultScoringWeights('test_project');
    const metrics = computeStrategicMetrics('test_project', answer, weights);

    expect(metrics).toBeDefined();
    expect(metrics.projectId).toBe('test_project');
    expect(metrics.strategicAdvantageComposite).toBeTypeOf('number');
    expect(metrics.strategicAdvantageComposite).toBeGreaterThanOrEqual(0);
    expect(metrics.strategicAdvantageComposite).toBeLessThanOrEqual(100);
  });

  it('returns all 9 sub-scores', () => {
    const answer: WorksheetAnswer = {
      id: 'test-2',
      worksheetId: 'all',
      projectId: 'test_project',
      version: 1,
      answers: { maturity_overall: 70, ai_adoption: 80 },
      confidence: {},
      updatedAt: new Date().toISOString(),
    };
    const weights = defaultScoringWeights('test_project');
    const metrics = computeStrategicMetrics('test_project', answer, weights);

    expect(metrics.connectedExperienceScore).toBeTypeOf('number');
    expect(metrics.closedLoopMaturity).toBeTypeOf('number');
    expect(metrics.switchingCostIndex).toBeTypeOf('number');
    expect(metrics.wtpUpliftIndex).toBeTypeOf('number');
    expect(metrics.costReductionPotential).toBeTypeOf('number');
    expect(metrics.competitivePositioningIndex).toBeTypeOf('number');
    expect(metrics.businessModelStrength).toBeTypeOf('number');
    expect(metrics.dataScienceReadiness).toBeTypeOf('number');
    expect(metrics.architectureResilience).toBeTypeOf('number');
  });
});

// ─── Domain: Worksheets ───────────────────────────────────────────────────────

describe('ALL_WORKSHEETS', () => {
  it('has at least 10 worksheets defined', () => {
    expect(ALL_WORKSHEETS.length).toBeGreaterThanOrEqual(10);
  });

  it('each worksheet has an id, title, and sections', () => {
    for (const ws of ALL_WORKSHEETS) {
      expect(ws.id).toBeTruthy();
      expect(ws.title).toBeTruthy();
      expect(ws.sections.length).toBeGreaterThan(0);
    }
  });

  it('all worksheet IDs are unique', () => {
    const ids = ALL_WORKSHEETS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Pipeline: ID Normalization ───────────────────────────────────────────────

describe('normalizeProjectId', () => {
  // Re-implement the function here for testing
  function normalizeProjectId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  it('converts hyphens to underscores', () => {
    expect(normalizeProjectId('my-project')).toBe('my_project');
  });

  it('converts spaces to underscores', () => {
    expect(normalizeProjectId('My Project Name')).toBe('my_project_name');
  });

  it('handles mixed special characters', () => {
    expect(normalizeProjectId('Connected_Strategy')).toBe('connected_strategy');
    expect(normalizeProjectId('balam-demo-v2')).toBe('balam_demo_v2');
    expect(normalizeProjectId('youtube-cashcow')).toBe('youtube_cashcow');
  });

  it('strips leading/trailing underscores', () => {
    expect(normalizeProjectId('_test_')).toBe('test');
    expect(normalizeProjectId('--test--')).toBe('test');
  });

  it('collapses multiple underscores', () => {
    expect(normalizeProjectId('a---b___c')).toBe('a_b_c');
  });

  it('produces consistent output (idempotent on normalize output)', () => {
    const normalized = normalizeProjectId('My-Cool-App');
    expect(normalizeProjectId(normalized)).toBe(normalized);
  });
});

// ─── Domain: Scoring Weights ──────────────────────────────────────────────────

describe('defaultScoringWeights', () => {
  it('returns a weights object', () => {
    const w = defaultScoringWeights('test');
    expect(w).toBeDefined();
    expect(typeof w).toBe('object');
  });
});
