import { describe, it } from 'node:test';
import { expect } from 'expect';
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
    expect(ws01Schema.parse(sunkingWS01)).toBeTruthy();
  });
  
  it('rejects WS01 with missing scope', () => {
    const broken = { stages: sunkingWS01.stages };
    expect(() => ws01Schema.parse(broken)).toThrow();
  });

  it('accepts WS03', () => { expect(ws03Schema.parse(sunkingWS03)).toBeTruthy(); });
  it('accepts WS04', () => { expect(ws04Schema.parse(sunkingWS04)).toBeTruthy(); });
  it('accepts WS05', () => { expect(ws05Schema.parse(sunkingWS05)).toBeTruthy(); });
  it('accepts WS06', () => { expect(ws06Schema.parse(sunkingWS06)).toBeTruthy(); });
  it('accepts WS07', () => { expect(ws07Schema.parse(sunkingWS07)).toBeTruthy(); });
  it('accepts WS08', () => { expect(ws08Schema.parse(sunkingWS08)).toBeTruthy(); });
  it('accepts WS09', () => { expect(ws09Schema.parse(sunkingWS09)).toBeTruthy(); });
  it('accepts WS10', () => { expect(ws10Schema.parse(sunkingWS10)).toBeTruthy(); });
  it('accepts WS11', () => { expect(ws11Schema.parse(sunkingWS11)).toBeTruthy(); });

  it('accepts FiveForces', () => { expect(fiveForcesSchema.parse(sunkingFiveForces)).toBeTruthy(); });
  it('accepts Scenarios', () => { expect(scenarioAnalysisSchema.parse(sunkingScenarios)).toBeTruthy(); });
  it('accepts CompetitorProfile', () => { expect(competitorProfileSchema.parse(sunkingCompetitor)).toBeTruthy(); });
  it('accepts DriverScore', () => { expect(driverScoreSchema.parse(sunkingDriverScore)).toBeTruthy(); });
  it('accepts ActivitySystem', () => { expect(activitySystemMapSchema.parse(sunkingActivitySystem)).toBeTruthy(); });
  it('accepts ThreeFits', () => { expect(threeFitsAssessmentSchema.parse(sunkingThreeFits)).toBeTruthy(); });
  it('accepts FrontierAnalysis', () => { expect(frontierAnalysisSchema.parse(sunkingFrontier)).toBeTruthy(); });
});
