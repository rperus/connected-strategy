/**
 * @cs/domain — scoring.test.ts
 *
 * Unit tests for all 10 scoring contracts.
 * Tests cover: correct formula execution, clamp behavior, zero inputs,
 * full inputs, and that breakdowns expose formula & rationale.
 *
 * Run: pnpm test
 */

import { describe, it, expect } from 'vitest';

import {
  scoreConnectedExperience,
  scoreClosedLoopMaturity,
  scoreSwitchingCostIndex,
  scoreWtpUpliftIndex,
  scoreCostReductionPotential,
  scoreCompetitivePositioningIndex,
  scoreBusinessModelStrength,
  scoreDataScienceReadiness,
  scoreArchitectureResilience,
  scoreStrategicAdvantageComposite,
  computeStrategicMetrics,
} from './scoring.js';

import { defaultScoringWeights } from './types.js';

// ─── Score 1: Connected Experience ───────────────────────────────────────────
describe('scoreConnectedExperience', () => {
  it('all-zero inputs → score 0', () => {
    const w = { respondToDesire: 0.25, curatedOffering: 0.25, coachBehavior: 0.25, automaticExecution: 0.25 };
    const bd = scoreConnectedExperience({ respondToDesire: 0, curatedOffering: 0, coachBehavior: 0, automaticExecution: 0 }, w);
    expect(bd.score).toBe(0);
  });

  it('all-100 inputs → score 100', () => {
    const w = { respondToDesire: 0.25, curatedOffering: 0.25, coachBehavior: 0.25, automaticExecution: 0.25 };
    const bd = scoreConnectedExperience({ respondToDesire: 100, curatedOffering: 100, coachBehavior: 100, automaticExecution: 100 }, w);
    expect(bd.score).toBe(100);
  });

  it('partial inputs → weighted average', () => {
    const w = { respondToDesire: 0.5, curatedOffering: 0.5, coachBehavior: 0, automaticExecution: 0 };
    const bd = scoreConnectedExperience({ respondToDesire: 80, curatedOffering: 40, coachBehavior: 0, automaticExecution: 0 }, w);
    expect(bd.score).toBe(60); // (80*0.5 + 40*0.5) / 1.0
  });

  it('breakdown has formula and rationale', () => {
    const w = { respondToDesire: 0.25, curatedOffering: 0.25, coachBehavior: 0.25, automaticExecution: 0.25 };
    const bd = scoreConnectedExperience({ respondToDesire: 50, curatedOffering: 50, coachBehavior: 50, automaticExecution: 50 }, w);
    expect(bd.formula.length).toBeGreaterThan(0);
    expect(bd.rationale.length).toBeGreaterThan(0);
  });
});

// ─── Score 2: Closed Loop Maturity ───────────────────────────────────────────
describe('scoreClosedLoopMaturity', () => {
  it('all-zero → 0', () => {
    const w = { senseQuality: 0.25, transmitCoverage: 0.25, analyzeDepth: 0.25, reactSpeed: 0.25 };
    const bd = scoreClosedLoopMaturity({ senseQuality: 0, transmitCoverage: 0, analyzeDepth: 0, reactSpeed: 0 }, w);
    expect(bd.score).toBe(0);
  });

  it('all-100 → 100', () => {
    const w = { senseQuality: 0.25, transmitCoverage: 0.25, analyzeDepth: 0.25, reactSpeed: 0.25 };
    const bd = scoreClosedLoopMaturity({ senseQuality: 100, transmitCoverage: 100, analyzeDepth: 100, reactSpeed: 100 }, w);
    expect(bd.score).toBe(100);
  });

  it('inputs map matches output breakdown inputs', () => {
    const w = { senseQuality: 0.3, transmitCoverage: 0.2, analyzeDepth: 0.3, reactSpeed: 0.2 };
    const inputs = { senseQuality: 70, transmitCoverage: 50, analyzeDepth: 60, reactSpeed: 40 };
    const bd = scoreClosedLoopMaturity(inputs, w);
    expect(bd.inputs).toEqual(inputs);
  });
});

// ─── Score 3: Switching Cost Index ───────────────────────────────────────────
describe('scoreSwitchingCostIndex', () => {
  it('returns score between 0 and 100', () => {
    const w = { dataLock: 0.3, habitFormation: 0.3, integrationDepth: 0.25, networkEffect: 0.15 };
    const bd = scoreSwitchingCostIndex({ dataLock: 60, habitFormation: 80, integrationDepth: 40, networkEffect: 20 }, w);
    expect(bd.score).toBeGreaterThanOrEqual(0);
    expect(bd.score).toBeLessThanOrEqual(100);
  });

  it('no network effect does not crash', () => {
    const w = { dataLock: 0.4, habitFormation: 0.4, integrationDepth: 0.2, networkEffect: 0 };
    const bd = scoreSwitchingCostIndex({ dataLock: 50, habitFormation: 50, integrationDepth: 50, networkEffect: 0 }, w);
    expect(bd.score).toBeGreaterThanOrEqual(0);
  });
});

// ─── Score 4: WTP Uplift ──────────────────────────────────────────────────────
describe('scoreWtpUpliftIndex', () => {
  it('high pain resolution drives score', () => {
    const w = { valuePerception: 0.4, painResolution: 0.35, convenienceDelta: 0.25 };
    const bd = scoreWtpUpliftIndex({ valuePerception: 100, painResolution: 100, convenienceDelta: 100 }, w);
    expect(bd.score).toBe(100);
  });

  it('zero convenience delta does not zero the score', () => {
    const w = { valuePerception: 0.5, painResolution: 0.5, convenienceDelta: 0 };
    const bd = scoreWtpUpliftIndex({ valuePerception: 80, painResolution: 80, convenienceDelta: 0 }, w);
    expect(bd.score).toBeGreaterThan(0);
  });
});

// ─── Score 5: Cost Reduction ──────────────────────────────────────────────────
describe('scoreCostReductionPotential', () => {
  it('all-zero → 0', () => {
    const w = { automationCoverage: 0.4, manualOpsReduction: 0.35, supportBurdenReduction: 0.25 };
    const bd = scoreCostReductionPotential({ automationCoverage: 0, manualOpsReduction: 0, supportBurdenReduction: 0 }, w);
    expect(bd.score).toBe(0);
  });

  it('all-100 → 100', () => {
    const w = { automationCoverage: 0.4, manualOpsReduction: 0.35, supportBurdenReduction: 0.25 };
    const bd = scoreCostReductionPotential({ automationCoverage: 100, manualOpsReduction: 100, supportBurdenReduction: 100 }, w);
    expect(bd.score).toBe(100);
  });
});

// ─── Score 6: Competitive Positioning ─────────────────────────────────────────
describe('scoreCompetitivePositioningIndex', () => {
  it('returns 0 for all-zero', () => {
    const w = { internalFit: 0.3, externalFit: 0.3, dynamicFit: 0.2, differentiationClarity: 0.2 };
    const bd = scoreCompetitivePositioningIndex({ internalFit: 0, externalFit: 0, dynamicFit: 0, differentiationClarity: 0 }, w);
    expect(bd.score).toBe(0);
  });

  it('uneven weights still produce clamped result', () => {
    const w = { internalFit: 0.6, externalFit: 0.4, dynamicFit: 0, differentiationClarity: 0 };
    const bd = scoreCompetitivePositioningIndex({ internalFit: 90, externalFit: 70, dynamicFit: 0, differentiationClarity: 0 }, w);
    expect(bd.score).toBeLessThanOrEqual(100);
    expect(bd.score).toBeGreaterThanOrEqual(0);
  });
});

// ─── Score 7: Business Model Strength ────────────────────────────────────────
describe('scoreBusinessModelStrength', () => {
  it('high moat depth increases score', () => {
    const w = { revenueModelClarity: 0.25, moatDepth: 0.3, scalability: 0.25, customerRelationshipDepth: 0.2 };
    const bd = scoreBusinessModelStrength({ revenueModelClarity: 70, moatDepth: 100, scalability: 70, customerRelationshipDepth: 70 }, w);
    expect(bd.score).toBeGreaterThan(70);
  });
});

// ─── Score 8: Data Science Readiness ─────────────────────────────────────────
describe('scoreDataScienceReadiness', () => {
  it('zero rigor level is allowed', () => {
    const w = { dataAvailability: 0.3, instrumentationCoverage: 0.3, modelingCapability: 0.2, rigorLevel: 0.2 };
    const bd = scoreDataScienceReadiness({ dataAvailability: 60, instrumentationCoverage: 60, modelingCapability: 40, rigorLevel: 0 }, w);
    expect(bd.score).toBeGreaterThanOrEqual(0);
    expect(bd.score).toBeLessThanOrEqual(100);
  });
});

// ─── Score 9: Architecture Resilience ────────────────────────────────────────
describe('scoreArchitectureResilience', () => {
  it('four equal dimensions → weighted average', () => {
    const w = { modularity: 0.25, testCoverage: 0.25, observability: 0.25, recoverability: 0.25 };
    const bd = scoreArchitectureResilience({ modularity: 80, testCoverage: 60, observability: 70, recoverability: 50 }, w);
    const expected = (80 + 60 + 70 + 50) / 4;
    expect(Math.abs(bd.score - expected)).toBeLessThan(0.01);
  });
});

// ─── Score 10: Strategic Advantage Composite ──────────────────────────────────
describe('scoreStrategicAdvantageComposite', () => {
  it('all-zero sub-scores → composite 0', () => {
    const w = defaultScoringWeights('proj_test').strategicAdvantageComposite;
    const bd = scoreStrategicAdvantageComposite({
      connectedExperience: 0, closedLoopMaturity: 0, switchingCost: 0,
      wtpUplift: 0, costReduction: 0, competitivePositioning: 0,
      businessModelStrength: 0, dataScienceReadiness: 0, architectureResilience: 0,
    }, w);
    expect(bd.score).toBe(0);
  });

  it('all-100 sub-scores → composite 100', () => {
    const w = defaultScoringWeights('proj_test').strategicAdvantageComposite;
    const bd = scoreStrategicAdvantageComposite({
      connectedExperience: 100, closedLoopMaturity: 100, switchingCost: 100,
      wtpUplift: 100, costReduction: 100, competitivePositioning: 100,
      businessModelStrength: 100, dataScienceReadiness: 100, architectureResilience: 100,
    }, w);
    expect(Math.abs(bd.score - 100)).toBeLessThan(0.1);
  });
});

// ─── computeStrategicMetrics (integration) ────────────────────────────────────
describe('computeStrategicMetrics', () => {
  it('produces all 10 metric scores from worksheet answers', () => {
    const weights = defaultScoringWeights('proj_integration');
    const answers = {
      id: 'ans_1',
      worksheetId: 'ws06_closed_loop',
      projectId: 'proj_integration',
      version: 1,
      answers: {
        ce_respond_to_desire: 70, ce_curated_offering: 60,
        ce_coach_behavior: 50, ce_automatic_execution: 40,
        clm_sense_quality: 80, clm_transmit_coverage: 70,
        clm_analyze_depth: 60, clm_react_speed: 50,
        sci_data_lock: 60, sci_habit_formation: 70,
        sci_integration_depth: 50, sci_network_effect: 30,
        wtp_value_perception: 75, wtp_pain_resolution: 65, wtp_convenience_delta: 55,
        cr_automation_coverage: 50, cr_manual_ops_reduction: 45, cr_support_burden_reduction: 40,
        cp_internal_fit: 70, cp_external_fit: 65, cp_dynamic_fit: 60, cp_differentiation_clarity: 55,
        bms_revenue_model_clarity: 70, bms_moat_depth: 60, bms_scalability: 65, bms_customer_relationship_depth: 75,
        dsr_data_availability: 60, dsr_instrumentation_coverage: 55, dsr_modeling_capability: 40, dsr_rigor_level: 30,
        ar_modularity: 70, ar_test_coverage: 50, ar_observability: 60, ar_recoverability: 55,
      },
      confidence: {},
      updatedAt: new Date().toISOString(),
    };

    const metrics = computeStrategicMetrics('proj_integration', answers, weights);

    expect(metrics.connectedExperienceScore).toBeGreaterThanOrEqual(0);
    expect(metrics.connectedExperienceScore).toBeLessThanOrEqual(100);
    expect(metrics.closedLoopMaturity).toBeGreaterThanOrEqual(0);
    expect(metrics.closedLoopMaturity).toBeLessThanOrEqual(100);
    expect(metrics.switchingCostIndex).toBeGreaterThanOrEqual(0);
    expect(metrics.switchingCostIndex).toBeLessThanOrEqual(100);
    expect(metrics.wtpUpliftIndex).toBeGreaterThanOrEqual(0);
    expect(metrics.wtpUpliftIndex).toBeLessThanOrEqual(100);
    expect(metrics.costReductionPotential).toBeGreaterThanOrEqual(0);
    expect(metrics.costReductionPotential).toBeLessThanOrEqual(100);
    expect(metrics.competitivePositioningIndex).toBeGreaterThanOrEqual(0);
    expect(metrics.competitivePositioningIndex).toBeLessThanOrEqual(100);
    expect(metrics.businessModelStrength).toBeGreaterThanOrEqual(0);
    expect(metrics.businessModelStrength).toBeLessThanOrEqual(100);
    expect(metrics.dataScienceReadiness).toBeGreaterThanOrEqual(0);
    expect(metrics.dataScienceReadiness).toBeLessThanOrEqual(100);
    expect(metrics.architectureResilience).toBeGreaterThanOrEqual(0);
    expect(metrics.architectureResilience).toBeLessThanOrEqual(100);
    expect(metrics.strategicAdvantageComposite).toBeGreaterThanOrEqual(0);
    expect(metrics.strategicAdvantageComposite).toBeLessThanOrEqual(100);
    expect(metrics.projectId).toBe('proj_integration');
    expect(metrics.calculatedAt.length).toBeGreaterThan(0);
  });

  it('missing answers default to 0 gracefully', () => {
    const weights = defaultScoringWeights('proj_empty');
    const emptyAnswers = {
      id: 'ans_empty',
      worksheetId: 'ws06_closed_loop',
      projectId: 'proj_empty',
      version: 1,
      answers: {},
      confidence: {},
      updatedAt: new Date().toISOString(),
    };
    const metrics = computeStrategicMetrics('proj_empty', emptyAnswers, weights);
    expect(metrics.strategicAdvantageComposite).toBe(0);
  });
});
