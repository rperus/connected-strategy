/**
 * @cs/domain — scoring.ts
 *
 * Transparent, editable scoring contracts for all 10 Connected Strategy metrics.
 *
 * Principles enforced here:
 * 1. The LLM is NEVER the sole source of a score.
 * 2. Every formula is explicit, documented, and testable.
 * 3. Weights are externally configurable via ScoringWeights.
 * 4. Every score returns a ScoreBreakdown for UI transparency.
 * 5. All scores are 0–100.
 *
 * Loops: Sense→Transmit→Analyze→React→Repeat
 *        Recognize→Request→Respond→Repeat
 */

import type {
  ScoreBreakdown,
  StrategicMetrics,
  ScoringWeights,
  WorksheetAnswer,
} from './types.js';

// ─── Helper ──────────────────────────────────────────────────────────────────
function clamp(val: number): number {
  return Math.min(100, Math.max(0, val));
}

function weightedSum(inputs: Record<string, number>, weights: Record<string, number>): number {
  let total = 0;
  let wSum = 0;
  for (const [key, w] of Object.entries(weights)) {
    const val = inputs[key] ?? 0;
    total += val * w;
    wSum += w;
  }
  return wSum > 0 ? total / wSum : 0;
}

// ─── Score 1: Connected Experience Score ─────────────────────────────────────
/**
 * Measures how well the platform delivers a true connected experience
 * across the 4 archetypes from Wharton Connected Strategy.
 *
 * Inputs (each 0-100 from worksheet answers):
 * - respondToDesire: Does the platform react to explicit user requests?
 * - curatedOffering: Does it proactively curate relevant options?
 * - coachBehavior: Does it guide users toward better outcomes?
 * - automaticExecution: Does it act autonomously on user behalf?
 */
export function scoreConnectedExperience(
  inputs: { respondToDesire: number; curatedOffering: number; coachBehavior: number; automaticExecution: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ respondToDesire, curatedOffering, coachBehavior, automaticExecution }, weights)',
    score,
    rationale:
      `Connected experience maturity based on ${Object.keys(inputs).join(', ')}. ` +
      `Score reflects how deeply the platform moves from reactive (respond-to-desire) ` +
      `to autonomous (automatic-execution) along the connected strategy continuum.`,
  };
}

// ─── Score 2: Closed Loop Maturity ──────────────────────────────────────────
/**
 * Measures completeness of the Sense→Transmit→Analyze→React→Repeat loop.
 *
 * Inputs:
 * - senseQuality: Quality of signal capture (logs, events, costs, errors)
 * - transmitCoverage: Normalization and routing completeness
 * - analyzeDepth: Depth of pattern recognition and diagnostic capability
 * - reactSpeed: Speed from insight to action or proposal
 */
export function scoreClosedLoopMaturity(
  inputs: { senseQuality: number; transmitCoverage: number; analyzeDepth: number; reactSpeed: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ senseQuality, transmitCoverage, analyzeDepth, reactSpeed }, weights)',
    score,
    rationale:
      `Closed loop maturity across Sense/Transmit/Analyze/React. ` +
      `Low score means sensing is incomplete or reactions are slow/absent. ` +
      `High score means the platform has full observability and fast, governed responses.`,
  };
}

// ─── Score 3: Switching Cost Index ───────────────────────────────────────────
/**
 * How hard it is for users/customers to leave the platform.
 * This is a moat metric — higher is strategically better.
 *
 * Inputs:
 * - dataLock: User data and history captured exclusively on platform
 * - habitFormation: Frequency and depth of repeated interactions
 * - integrationDepth: API integrations, webhooks, embedded workflows
 * - networkEffect: Value increases as more users join
 */
export function scoreSwitchingCostIndex(
  inputs: { dataLock: number; habitFormation: number; integrationDepth: number; networkEffect: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ dataLock, habitFormation, integrationDepth, networkEffect }, weights)',
    score,
    rationale:
      `Switching cost index combines lock-in from data, habit, integration, and network effects. ` +
      `Per Wharton WS03, switching costs are a primary moat. ` +
      `Score of 0 means trivial to replace; 100 means deeply embedded platform.`,
  };
}

// ─── Score 4: WTP Uplift Index ───────────────────────────────────────────────
/**
 * How much the platform raises Willingness To Pay (WTP).
 * WTP = maximum a customer would pay. Higher WTP → more value created.
 *
 * Inputs:
 * - valuePerception: Users perceive clear, differentiated value
 * - painResolution: Platform resolves high-severity pain points
 * - convenienceDelta: Reduction in user effort compared to alternatives
 */
export function scoreWtpUpliftIndex(
  inputs: { valuePerception: number; painResolution: number; convenienceDelta: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ valuePerception, painResolution, convenienceDelta }, weights)',
    score,
    rationale:
      `WTP Uplift index per Wharton competitive advantage framework. ` +
      `Value perception, pain resolution, and convenience reduction all shift WTP upward. ` +
      `Score reflects total WTP-raising capacity of the platform today.`,
  };
}

// ─── Score 5: Cost Reduction Potential ──────────────────────────────────────
/**
 * How much the platform reduces operational cost (for operator or customer).
 *
 * Inputs:
 * - automationCoverage: What % of manual steps are automated
 * - manualOpsReduction: Reduction in manual operations burden
 * - supportBurdenReduction: Decrease in support tickets / human interventions
 */
export function scoreCostReductionPotential(
  inputs: { automationCoverage: number; manualOpsReduction: number; supportBurdenReduction: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ automationCoverage, manualOpsReduction, supportBurdenReduction }, weights)',
    score,
    rationale:
      `Cost reduction potential across automation, ops burden, and support load. ` +
      `This is the cost side of the WTP/cost competitive advantage lens. ` +
      `High score means the platform substantially reduces cost vs. alternatives.`,
  };
}

// ─── Score 6: Competitive Positioning Index ──────────────────────────────────
/**
 * How well the platform occupies a defensible competitive position.
 *
 * Inputs (from WS10 and competitive landscape):
 * - internalFit: Activity system coherence and self-reinforcement
 * - externalFit: Alignment with real customer value (WTP)
 * - dynamicFit: Ability to adapt without losing position
 * - differentiationClarity: Clear strategic choices about what NOT to do
 */
export function scoreCompetitivePositioningIndex(
  inputs: { internalFit: number; externalFit: number; dynamicFit: number; differentiationClarity: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ internalFit, externalFit, dynamicFit, differentiationClarity }, weights)',
    score,
    rationale:
      `Competitive positioning per Wharton WS10. ` +
      `Internal fit = activities reinforce each other. ` +
      `External fit = activities deliver on customer WTP. ` +
      `Dynamic fit = can evolve without destroying position. ` +
      `Differentiation = clear choices made about scope and trade-offs.`,
  };
}

// ─── Score 7: Business Model Strength ────────────────────────────────────────
/**
 * How strong, defensible, and scalable the business model is.
 *
 * Inputs:
 * - revenueModelClarity: Revenue streams are clear and sustainable
 * - moatDepth: Depth of competitive moat (combined switching costs, network effects)
 * - scalability: Can growth happen without proportional cost increase
 * - customerRelationshipDepth: Depth and stickiness of customer relationships
 */
export function scoreBusinessModelStrength(
  inputs: { revenueModelClarity: number; moatDepth: number; scalability: number; customerRelationshipDepth: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ revenueModelClarity, moatDepth, scalability, customerRelationshipDepth }, weights)',
    score,
    rationale:
      `Business model strength across revenue clarity, moat depth, scalability, and customer depth. ` +
      `High score means the model is self-reinforcing, scalable, and hard to replicate.`,
  };
}

// ─── Score 8: Data Science Readiness ─────────────────────────────────────────
/**
 * Readiness to apply rigorous data science (per MITx MicroMasters standard).
 * Rigor = method justification, data requirements, causality vs. correlation.
 *
 * Inputs:
 * - dataAvailability: Is clean, structured data available at scale?
 * - instrumentationCoverage: Are events and signals properly tracked?
 * - modelingCapability: Are DS techniques currently applied (even basic ones)?
 * - rigorLevel: Is causal reasoning applied vs. pure correlation?
 */
export function scoreDataScienceReadiness(
  inputs: { dataAvailability: number; instrumentationCoverage: number; modelingCapability: number; rigorLevel: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ dataAvailability, instrumentationCoverage, modelingCapability, rigorLevel }, weights)',
    score,
    rationale:
      `Data science readiness per MITx MicroMasters rigor standard. ` +
      `Low score means the platform lacks data or applies correlational reasoning. ` +
      `High score means structured data, full instrumentation, and causal methodology exist.`,
  };
}

// ─── Score 9: Architecture Resilience ────────────────────────────────────────
/**
 * How resilient and maintainable the technical architecture is.
 *
 * Inputs:
 * - modularity: Separation of concerns; bounded modules with clear contracts
 * - testCoverage: Automated test coverage (unit, integration, e2e)
 * - observability: Logging, tracing, alerting completeness
 * - recoverability: How fast the system recovers from failures
 */
export function scoreArchitectureResilience(
  inputs: { modularity: number; testCoverage: number; observability: number; recoverability: number },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(inputs as Record<string, number>, weights));
  return {
    inputs: inputs as Record<string, number>,
    formula: 'weightedSum({ modularity, testCoverage, observability, recoverability }, weights)',
    score,
    rationale:
      `Architecture resilience across modularity, test coverage, observability, and recoverability. ` +
      `Low score = monolith with no tests and blind failure modes. ` +
      `High score = modular, well-tested, fully observable, fast-recovery system.`,
  };
}

// ─── Score 10: Strategic Advantage Composite ────────────────────────────────
/**
 * Composite of all 9 scores above, weighted to reflect overall strategic strength.
 * This is the primary headline metric for a project.
 *
 * Uses individual metric scores (0-100) and the composite weights.
 */
export function scoreStrategicAdvantageComposite(
  scores: {
    connectedExperience: number;
    closedLoopMaturity: number;
    switchingCost: number;
    wtpUplift: number;
    costReduction: number;
    competitivePositioning: number;
    businessModelStrength: number;
    dataScienceReadiness: number;
    architectureResilience: number;
  },
  weights: Record<string, number>,
): ScoreBreakdown {
  const score = clamp(weightedSum(scores, weights));
  return {
    inputs: scores,
    formula: 'weightedSum(allMetricScores, compositeWeights)',
    score,
    rationale:
      `Strategic advantage composite aggregates all 9 metrics with configurable weights. ` +
      `This is the single headline score for the project. ` +
      `It reflects the overall strategic health across connected experience, ` +
      `competitive moat, cost structure, data capability, and architecture.`,
  };
}

// ─── Full Metrics Calculator ─────────────────────────────────────────────────
/**
 * Computes all 10 metrics from raw worksheet answer inputs.
 * Input key mapping mirrors WorksheetQuestion IDs.
 * Returns full StrategicMetrics with breakdowns for UI transparency.
 */
export function computeStrategicMetrics(
  projectId: string,
  answers: WorksheetAnswer,
  weights: ScoringWeights,
  formulaVersion = '1.0.0',
): StrategicMetrics {
  const a = answers.answers as Record<string, number>;

  const ceInputs = {
    respondToDesire: a['ce_respond_to_desire'] ?? 0,
    curatedOffering: a['ce_curated_offering'] ?? 0,
    coachBehavior: a['ce_coach_behavior'] ?? 0,
    automaticExecution: a['ce_automatic_execution'] ?? 0,
  };
  const ceBreakdown = scoreConnectedExperience(ceInputs, weights.connectedExperience);

  const clmInputs = {
    senseQuality: a['clm_sense_quality'] ?? 0,
    transmitCoverage: a['clm_transmit_coverage'] ?? 0,
    analyzeDepth: a['clm_analyze_depth'] ?? 0,
    reactSpeed: a['clm_react_speed'] ?? 0,
  };
  const clmBreakdown = scoreClosedLoopMaturity(clmInputs, weights.closedLoopMaturity);

  const sciInputs = {
    dataLock: a['sci_data_lock'] ?? 0,
    habitFormation: a['sci_habit_formation'] ?? 0,
    integrationDepth: a['sci_integration_depth'] ?? 0,
    networkEffect: a['sci_network_effect'] ?? 0,
  };
  const sciBreakdown = scoreSwitchingCostIndex(sciInputs, weights.switchingCost);

  const wtpInputs = {
    valuePerception: a['wtp_value_perception'] ?? 0,
    painResolution: a['wtp_pain_resolution'] ?? 0,
    convenienceDelta: a['wtp_convenience_delta'] ?? 0,
  };
  const wtpBreakdown = scoreWtpUpliftIndex(wtpInputs, weights.wtpUplift);

  const crInputs = {
    automationCoverage: a['cr_automation_coverage'] ?? 0,
    manualOpsReduction: a['cr_manual_ops_reduction'] ?? 0,
    supportBurdenReduction: a['cr_support_burden_reduction'] ?? 0,
  };
  const crBreakdown = scoreCostReductionPotential(crInputs, weights.costReduction);

  const cpInputs = {
    internalFit: a['cp_internal_fit'] ?? 0,
    externalFit: a['cp_external_fit'] ?? 0,
    dynamicFit: a['cp_dynamic_fit'] ?? 0,
    differentiationClarity: a['cp_differentiation_clarity'] ?? 0,
  };
  const cpBreakdown = scoreCompetitivePositioningIndex(cpInputs, weights.competitivePositioning);

  const bmsInputs = {
    revenueModelClarity: a['bms_revenue_model_clarity'] ?? 0,
    moatDepth: a['bms_moat_depth'] ?? 0,
    scalability: a['bms_scalability'] ?? 0,
    customerRelationshipDepth: a['bms_customer_relationship_depth'] ?? 0,
  };
  const bmsBreakdown = scoreBusinessModelStrength(bmsInputs, weights.businessModelStrength);

  const dsrInputs = {
    dataAvailability: a['dsr_data_availability'] ?? 0,
    instrumentationCoverage: a['dsr_instrumentation_coverage'] ?? 0,
    modelingCapability: a['dsr_modeling_capability'] ?? 0,
    rigorLevel: a['dsr_rigor_level'] ?? 0,
  };
  const dsrBreakdown = scoreDataScienceReadiness(dsrInputs, weights.dataScienceReadiness);

  const arInputs = {
    modularity: a['ar_modularity'] ?? 0,
    testCoverage: a['ar_test_coverage'] ?? 0,
    observability: a['ar_observability'] ?? 0,
    recoverability: a['ar_recoverability'] ?? 0,
  };
  const arBreakdown = scoreArchitectureResilience(arInputs, weights.architectureResilience);

  const compositeScores = {
    connectedExperience: ceBreakdown.score,
    closedLoopMaturity: clmBreakdown.score,
    switchingCost: sciBreakdown.score,
    wtpUplift: wtpBreakdown.score,
    costReduction: crBreakdown.score,
    competitivePositioning: cpBreakdown.score,
    businessModelStrength: bmsBreakdown.score,
    dataScienceReadiness: dsrBreakdown.score,
    architectureResilience: arBreakdown.score,
  };
  const sacBreakdown = scoreStrategicAdvantageComposite(compositeScores, weights.strategicAdvantageComposite);

  return {
    projectId,
    connectedExperienceScore: ceBreakdown.score,
    connectedExperienceBreakdown: ceBreakdown,
    closedLoopMaturity: clmBreakdown.score,
    closedLoopMaturityBreakdown: clmBreakdown,
    switchingCostIndex: sciBreakdown.score,
    switchingCostBreakdown: sciBreakdown,
    wtpUpliftIndex: wtpBreakdown.score,
    wtpUpliftBreakdown: wtpBreakdown,
    costReductionPotential: crBreakdown.score,
    costReductionBreakdown: crBreakdown,
    competitivePositioningIndex: cpBreakdown.score,
    competitivePositioningBreakdown: cpBreakdown,
    businessModelStrength: bmsBreakdown.score,
    businessModelBreakdown: bmsBreakdown,
    dataScienceReadiness: dsrBreakdown.score,
    dataScienceBreakdown: dsrBreakdown,
    architectureResilience: arBreakdown.score,
    architectureResilienceBreakdown: arBreakdown,
    strategicAdvantageComposite: sacBreakdown.score,
    strategicAdvantageBreakdown: sacBreakdown,
    calculatedAt: new Date().toISOString(),
    calculationVersion: formulaVersion,
  };
}
