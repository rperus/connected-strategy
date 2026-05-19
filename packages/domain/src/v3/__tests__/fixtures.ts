import type {
  WS01_JourneyMap,
  WS03_InfoFlow,
  WS04_WhyHowLadder,
  WS05_ResponseMatrix,
  WS06_RepeatLearning,
  WS07_ExistingMatrix,
  WS08_NewIdeasMatrix,
  WS09_SubfunctionGrid,
  WS10_TechSolutions,
  WS11_EmergingTech,
} from '../worksheets-canonical.js';
import type {
  FiveForcesAnalysis,
  ScenarioAnalysis,
  CompetitorProfile,
  DriverScore,
  ActivitySystemMap,
  ThreeFitsAssessment,
  FrontierAnalysis
} from '../competitive-canonical.js';

// Real Sun King data based on the Connected Strategy Wharton PDF case study
export const sunkingWS01: WS01_JourneyMap = {
  scope: { customerSegment: 'Off-grid households in rural Africa', useCase: 'Getting reliable, safe lighting and device charging' },
  stages: {
    latent_need: { 
      underlyingNeed: 'Need to see at night and study without toxic smoke', 
      customerActions: ['Burn kerosene', 'Buy expensive D-cell batteries'], 
      decisionFactors: ['Cost of fuel', 'Health hazards'], 
      touchpoints: ['Local kiosks', 'Home'], 
      painPoints: ['Kerosene is expensive over time', 'Smoke causes coughing', 'Dim light'], 
      wtpDrivers: [{ name: 'Safety', relativeScore: '--', competitorScores: { kerosene: '--' } }] 
    },
    awareness: { 
      underlyingNeed: 'Discover affordable solar alternatives', 
      customerActions: ['See a neighbor with a solar lamp', 'Hear radio ad', 'Talk to field agent'], 
      decisionFactors: ['Trust in brand', 'Perceived affordability'], 
      touchpoints: ['Neighbor house', 'Radio', 'Direct sales agent'], 
      painPoints: ['Doubt about durability', 'Worry about upfront cost'], 
      wtpDrivers: [{ name: 'Brand Trust', relativeScore: '0', competitorScores: { kerosene: '+' } }] 
    },
    search: { 
      underlyingNeed: 'Understand payment plans', 
      customerActions: ['Ask agent about Pay-As-You-Go (PAYG)', 'Compare with cheap generic solar'], 
      decisionFactors: ['Daily payment amount', 'Warranty'], 
      touchpoints: ['Sales agent demonstration'], 
      painPoints: ['Complex payment terms', 'Fear of hidden fees'], 
      wtpDrivers: [{ name: 'Affordability', relativeScore: '+', competitorScores: { generic_solar: '+' } }] 
    },
    decide: { 
      underlyingNeed: 'Commit to purchase', 
      customerActions: ['Sign contract', 'Choose product tier (e.g. Pro 400)'], 
      decisionFactors: ['Deposit size', 'Number of lights included'], 
      touchpoints: ['Paperwork with agent', 'Mobile phone (SMS)'], 
      painPoints: ['Gathering the initial deposit'], 
      wtpDrivers: [{ name: 'Financing Flexibility', relativeScore: '++', competitorScores: { kerosene: '--' } }] 
    },
    order_pay: { 
      underlyingNeed: 'Make initial deposit', 
      customerActions: ['Send money via M-Pesa or local mobile money'], 
      decisionFactors: ['Mobile network availability'], 
      touchpoints: ['USSD menu', 'Mobile money agent'], 
      painPoints: ['Network downtime', 'Typing the wrong paybill number'], 
      wtpDrivers: [{ name: 'Payment Convenience', relativeScore: '+', competitorScores: { kerosene: '0' } }] 
    },
    receive: { 
      underlyingNeed: 'Install the system', 
      customerActions: ['Take box home', 'Mount solar panel on roof', 'Plug in lamps'], 
      decisionFactors: ['Ease of installation', 'Cable length'], 
      touchpoints: ['Product unboxing', 'User manual'], 
      painPoints: ['Roof is hard to access', 'Orientation of panel to sun'], 
      wtpDrivers: [{ name: 'Ease of Setup', relativeScore: '+', competitorScores: { generic_solar: '0' } }] 
    },
    experience: { 
      underlyingNeed: 'Enjoy continuous light and charge phone', 
      customerActions: ['Turn on lights at night', 'Charge phone via USB', 'Make daily PAYG payments to unlock device'], 
      decisionFactors: ['Brightness', 'Battery duration', 'Code entry ease'], 
      touchpoints: ['Lamp keypad', 'SMS with unlock code'], 
      painPoints: ['Lamp locks when payment is missed', 'Typing long codes into keypad'], 
      wtpDrivers: [{ name: 'Reliability', relativeScore: '++', competitorScores: { kerosene: '--' } }, { name: 'Utility (Charging)', relativeScore: '++', competitorScores: { kerosene: '--' } }] 
    },
    post_purchase: { 
      underlyingNeed: 'Maintain the system long-term', 
      customerActions: ['Replace battery after 2-3 years', 'Upgrade to TV system once loan is paid off'], 
      decisionFactors: ['Upgrade discounts', 'Customer service response'], 
      touchpoints: ['Call center', 'Field agent'], 
      painPoints: ['Distance to repair center'], 
      wtpDrivers: [{ name: 'Customer Support', relativeScore: '+', competitorScores: { generic_solar: '--' } }] 
    }
  }
};

export const sunkingWS03: WS03_InfoFlow = {
  grid: {
    latent_need: { description: 'Firm does not know specific household needs', trigger: 'N/A', frequency: 'none', richness: 'low', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: 'Use satellite data to identify off-grid areas' },
    awareness: { description: 'Agent logs visit in CRM', trigger: 'Agent visit', frequency: 'event', richness: 'medium', customerEffort: 'low', inferenceParty: 'firm', improvementIdea: 'Automate prospect tracking via WhatsApp' },
    search: { description: 'Customer asks questions', trigger: 'Conversation', frequency: 'event', richness: 'medium', customerEffort: 'medium', inferenceParty: 'shared', improvementIdea: 'Interactive SMS chatbot' },
    decide: { description: 'Customer provides ID and signs', trigger: 'Contract signing', frequency: 'event', richness: 'high', customerEffort: 'high', inferenceParty: 'customer', improvementIdea: 'Digital KYC via mobile operator' },
    order_pay: { description: 'Mobile money API sends payment confirmation', trigger: 'Payment', frequency: 'event', richness: 'high', customerEffort: 'medium', inferenceParty: 'firm', improvementIdea: 'Direct telco billing integration' },
    receive: { description: 'Agent marks as delivered', trigger: 'Delivery', frequency: 'event', richness: 'low', customerEffort: 'low', inferenceParty: 'firm', improvementIdea: 'QR code scan upon unboxing' },
    experience: { description: 'Firm sends unlock code via SMS upon payment; device enforces lock', trigger: 'Daily payment', frequency: 'periodic', richness: 'medium', customerEffort: 'high', inferenceParty: 'firm', improvementIdea: 'IoT enabled devices that unlock automatically without typing codes' },
    post_purchase: { description: 'Device logs battery degradation internally', trigger: 'Usage', frequency: 'continuous', richness: 'high', customerEffort: 'low', inferenceParty: 'algorithm', improvementIdea: 'Predictive maintenance dispatch' },
  }
};

export const sunkingWS04: WS04_WhyHowLadder = {
  rungs: [
    { level: 1, statement: 'Sell solar lamps' },
    { level: 2, statement: 'Provide reliable lighting' },
    { level: 3, statement: 'Eliminate toxic kerosene smoke' },
    { level: 4, statement: 'Improve health and study hours for children' }
  ],
  topPurpose: 'Powering brighter, healthier futures for off-grid families'
};

const createEmptyRecord = <K extends string | number | symbol, V>(keys: readonly K[], val: V): Record<K, V> => {
  const result = {} as Record<K, V>;
  keys.forEach(k => result[k] = val);
  return result;
};

import { CONNECTED_MODES, JOURNEY_STAGES, CONNECTION_ARCHITECTURES, STAR_DIMENSIONS, SUBFUNCTIONS_4R9 } from '../worksheets-canonical.js';

export const sunkingWS05: WS05_ResponseMatrix = {
  cells: createEmptyRecord(CONNECTED_MODES, createEmptyRecord(JOURNEY_STAGES, { response: 'N/A', requiredInfo: [], currentlyImplemented: false }))
};

export const sunkingWS06: WS06_RepeatLearning = {
  currentLevel: 2,
  evidenceForLevel: ['Uses payment history to assess credit risk for future upgrades'],
  learning: {
    customization: [{ experienceN: 10, observation: 'Offer tailored repayment schedules based on crop harvest cycles' }],
    deeper_needs: [{ experienceN: 50, observation: 'Customers who pay off lamps quickly want TVs' }],
    optimization: [{ experienceN: 1000, observation: 'Identify regions with high default rates to adjust agent training' }],
    new_offerings: [{ experienceN: 5000, observation: 'Introduce solar water pumps based on rural farmer data' }],
    efficiency: [{ experienceN: 10000, observation: 'Optimize inventory distribution based on regional sales velocity' }]
  },
  pathToNextLevel: 'Integrate direct IoT telemetry from devices to move from Level 2 (transaction learning) to Level 3 (usage learning)'
};

export const sunkingWS07: WS07_ExistingMatrix = {
  cells: createEmptyRecord(CONNECTED_MODES, createEmptyRecord(CONNECTION_ARCHITECTURES, { selfActivities: [], competitorActivities: [], isWhitespace: true }))
};

export const sunkingWS08: WS08_NewIdeasMatrix = {
  ideas: [
    {
      cell: { mode: 'automatic_execution', architecture: 'connected_retailer' },
      description: 'Auto-unlock lamps via GSM module, removing the need for customers to type 12-digit SMS codes daily.',
      businessModel: 'Increases customer retention and reduces support calls for lost codes.',
      requiredConnections: ['IoT GSM Module in Lamp', 'Direct telco integration'],
      informationFlows: ['Lamp pings server daily', 'Server verifies payment', 'Server sends unlock command'],
      revenueLevers: ['when', 'who'],
      feasibility: 3
    }
  ]
};

export const sunkingWS09: WS09_SubfunctionGrid = {
  cells: createEmptyRecord(STAR_DIMENSIONS, createEmptyRecord(SUBFUNCTIONS_4R9, { description: 'TBD' }))
};

export const sunkingWS10: WS10_TechSolutions = {
  cells: createEmptyRecord(STAR_DIMENSIONS, createEmptyRecord(SUBFUNCTIONS_4R9, { currentTech: 'TBD', selectionScores: { convenience: 0, safety: 0, cost: 0 }, appliedIn: 'TBD' }))
};

export const sunkingWS11: WS11_EmergingTech = {
  cells: createEmptyRecord(STAR_DIMENSIONS, createEmptyRecord(SUBFUNCTIONS_4R9, { emergingTechCandidates: [] }))
};

export const sunkingFiveForces: FiveForcesAnalysis = {
  customers: { attractiveness: 4, drivers: ['High need', 'Price sensitive but value PAYG'], evidence: [] },
  suppliers: { attractiveness: 3, drivers: ['Solar panel commodities', 'Battery supply chain'], evidence: [] },
  rivalry: { attractiveness: 2, drivers: ['Many generic solar entrants', 'Price wars in basic lighting'], evidence: [] },
  entrants: { attractiveness: 2, drivers: ['Low barrier to import generic panels', 'High barrier to build PAYG software'], evidence: [] },
  substitutes: { attractiveness: 4, drivers: ['Kerosene', 'Candles', 'Grid extension (slow)'], evidence: [] },
  industryAttractiveness: 3
};

export const sunkingScenarios: ScenarioAnalysis = {
  uncertainties: [{ name: 'Grid Expansion', high: 'Fast', low: 'Slow' }, { name: 'Component Costs', high: 'Rising', low: 'Falling' }],
  scenarios: [
    { name: 'Solar Utopia', quadrant: 'LL', narrative: 'Grid fails to expand, solar costs plummet. Massive boom.', strategicImplication: 'Scale rapidly.' }
  ]
};

export const sunkingCompetitor: CompetitorProfile = {
  name: 'Kerosene (Status Quo)',
  url: '',
  pricing: '$0.50 per day perpetually',
  positioning: 'Always available, requires no upfront capital',
  recentMoves: [],
  wtpScores: { 'Reliability': '-', 'Safety': '--' },
  costScores: { 'Upfront Cost': '++', 'Lifetime Cost': '--' }
};

export const sunkingDriverScore: DriverScore = {
  name: 'Upfront Affordability',
  weight: 0.4,
  selfScore: 1, // PAYG makes it affordable
  competitorScores: { 'Kerosene': 2, 'Generic Solar': -2 } // Kerosene has zero upfront, generic solar has high upfront
};

export const sunkingActivitySystem: ActivitySystemMap = {
  positioning: ['Affordable reliable energy', 'Financial inclusion via PAYG'],
  coreChoices: [
    { id: 'payg', label: 'Proprietary PAYG Software', centrality: 5, valueChainStage: 'operations' },
    { id: 'agents', label: 'Commission-based Agent Network', centrality: 4, valueChainStage: 'marketing' }
  ],
  supportingActivities: [
    { id: 'telecom', label: 'Mobile Money Integration' },
    { id: 'design', label: 'Durable Hardware Design' }
  ],
  reinforcementMatrix: {
    'payg': ['agents', 'telecom'],
    'agents': ['payg']
  },
  oeVsSp: { 'payg': 'SP', 'agents': 'SP', 'telecom': 'OE', 'design': 'OE' },
  mermaid: 'graph TD; payg-->agents;',
  imitabilityScore: 0.85
};

export const sunkingThreeFits: ThreeFitsAssessment = {
  internal: { score: 90, justification: 'PAYG software perfectly enables the commission agent network to sell without risk.', gaps: [] },
  external: { score: 95, justification: 'Exactly meets the needs of unbanked, off-grid customers who only have daily cash flows.', gaps: [] },
  dynamic: { score: 80, justification: 'Migrating to larger appliances (TVs) as customer credit profiles mature.', gaps: ['Need IoT for larger devices'] }
};

export const sunkingFrontier: FrontierAnalysis = {
  axes: { wtpDrivers: ['Reliability', 'Safety', 'Utility'], costDrivers: ['Lifetime Cost'] },
  points: [
    { entity: 'Sun King', wtp: 8, cost: 7, dominatedBy: [] },
    { entity: 'Kerosene', wtp: 2, cost: 3, dominatedBy: ['Sun King'] }
  ],
  paretoFront: ['Sun King'],
  selfPosition: 'on',
  candidateMoves: []
};
