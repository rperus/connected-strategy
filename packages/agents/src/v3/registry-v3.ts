import { runCodeCartographer } from './agents/code-cartographer.js';
import { runCustomerJourneyMapper } from './agents/customer-journey-mapper.js';
import { runInfoFlowAnalyzer } from './agents/info-flow-analyzer.js';
import { runDeeperNeedsLaddering } from './agents/deeper-needs-laddering.js';
import { runConnectedExperienceMatrix } from './agents/connected-experience-matrix.js';
import { runTechStackMapper } from './agents/tech-stack-mapper.js';
import { runRevenueModelArchitect } from './agents/revenue-model-architect.js';
import { runIndustryStructureAnalyst } from './agents/industry-structure-analyst.js';
import { runCompetitorIntelligence } from './agents/competitor-intelligence.js';
import { runWtpCostDriverScorer } from './agents/wtp-cost-driver-scorer.js';
import { runActivitySystemMapper } from './agents/activity-system-mapper.js';
import { runDbArchitect } from './agents/swarm/db-architect.js';
import { runSecurityAuditor } from './agents/swarm/security-auditor.js';
import { runApiDesignCritic } from './agents/swarm/api-design-critic.js';
import { runPerformanceEngineer } from './agents/swarm/performance-engineer.js';
import { runMlReadiness } from './agents/swarm/ml-readiness.js';
import { runFrontendPerf } from './agents/swarm/frontend-perf.js';
import { runObservability } from './agents/swarm/observability.js';

export const V3_AGENTS = {
  // discovery
  'code-cartographer': runCodeCartographer,
  // wharton
  'customer-journey-mapper': runCustomerJourneyMapper,
  'info-flow-analyzer': runInfoFlowAnalyzer,
  'deeper-needs-laddering': runDeeperNeedsLaddering,
  'connected-experience-matrix': runConnectedExperienceMatrix,
  'tech-stack-mapper': runTechStackMapper,
  'revenue-model-architect': runRevenueModelArchitect,
  // competitive
  'industry-structure-analyst': runIndustryStructureAnalyst,
  'competitor-intelligence': runCompetitorIntelligence,
  'wtp-cost-driver-scorer': runWtpCostDriverScorer,
  'activity-system-mapper': runActivitySystemMapper,
  // swarm
  'db-architect': runDbArchitect,
  'security-auditor': runSecurityAuditor,
  'api-design-critic': runApiDesignCritic,
  'performance-engineer': runPerformanceEngineer,
  'ml-readiness': runMlReadiness,
  'frontend-perf': runFrontendPerf,
  'observability': runObservability,
} as const;
