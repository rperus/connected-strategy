import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ws01Schema,
  ws03Schema,
  ws04Schema,
  ws05Schema,
  ws06Schema,
  ws07Schema,
  ws08Schema,
  ws09Schema,
  ws10Schema,
  ws11Schema,
  fiveForcesSchema,
  scenarioAnalysisSchema,
  competitorProfileSchema,
  driverScoreSchema,
  activitySystemMapSchema,
  threeFitsAssessmentSchema,
  frontierAnalysisSchema
} from '../schemas.js';

import {
  sunkingWS01,
  sunkingWS03,
  sunkingWS04,
  sunkingWS05,
  sunkingWS06,
  sunkingWS07,
  sunkingWS08,
  sunkingWS09,
  sunkingWS10,
  sunkingWS11,
  sunkingFiveForces,
  sunkingScenarios,
  sunkingCompetitor,
  sunkingDriverScore,
  sunkingActivitySystem,
  sunkingThreeFits,
  sunkingFrontier
} from './fixtures.js';

describe('v3 worksheet schemas', () => {
  it('accepts valid Sun King WS01 fixture', () => {
    assert.ok(ws01Schema.parse(sunkingWS01));
  });
  
  it('rejects WS01 with missing journey stage', () => {
    const broken = { ...sunkingWS01, stages: {} as any };
    assert.throws(() => ws01Schema.parse(broken));
  });

  it('accepts WS03', () => { assert.ok(ws03Schema.parse(sunkingWS03)); });
  it('accepts WS04', () => { assert.ok(ws04Schema.parse(sunkingWS04)); });
  it('accepts WS05', () => { assert.ok(ws05Schema.parse(sunkingWS05)); });
  it('accepts WS06', () => { assert.ok(ws06Schema.parse(sunkingWS06)); });
  it('accepts WS07', () => { assert.ok(ws07Schema.parse(sunkingWS07)); });
  it('accepts WS08', () => { assert.ok(ws08Schema.parse(sunkingWS08)); });
  it('accepts WS09', () => { assert.ok(ws09Schema.parse(sunkingWS09)); });
  it('accepts WS10', () => { assert.ok(ws10Schema.parse(sunkingWS10)); });
  it('accepts WS11', () => { assert.ok(ws11Schema.parse(sunkingWS11)); });

  it('accepts FiveForces', () => { assert.ok(fiveForcesSchema.parse(sunkingFiveForces)); });
  it('accepts Scenarios', () => { assert.ok(scenarioAnalysisSchema.parse(sunkingScenarios)); });
  it('accepts CompetitorProfile', () => { assert.ok(competitorProfileSchema.parse(sunkingCompetitor)); });
  it('accepts DriverScore', () => { assert.ok(driverScoreSchema.parse(sunkingDriverScore)); });
  it('accepts ActivitySystem', () => { assert.ok(activitySystemMapSchema.parse(sunkingActivitySystem)); });
  it('accepts ThreeFits', () => { assert.ok(threeFitsAssessmentSchema.parse(sunkingThreeFits)); });
  it('accepts FrontierAnalysis', () => { assert.ok(frontierAnalysisSchema.parse(sunkingFrontier)); });
});
