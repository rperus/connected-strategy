export type Tier = 'supervisor' | 'crew-lead' | 'specialist';
export type Crew = 'recon' | 'analysis' | 'action' | 'cross-cutting' | 'none';
export type Phase = 'Sense' | 'Analyze' | 'React';

export interface AgentNode {
  id: string; name: string; emoji: string;
  phase: Phase; tier: Tier; crew: Crew;
  role: string; input: string[]; output: string[];
  memory: string; llm: boolean; dependsOn: string[];
  autonomous: boolean;
}

export const TIER_COLORS: Record<Tier, string> = {
  'supervisor': '#a855f7',
  'crew-lead':  '#06b6d4',
  'specialist': '#f59e0b',
};

export const TIER_LABELS: Record<Tier, string> = {
  'supervisor': '🧠 Nivel 0: Supervisor',
  'crew-lead':  '⚙️ Nivel 1: Crew Leads',
  'specialist': '🔬 Nivel 2: Especialistas',
};

export const CREW_COLORS: Record<Crew, string> = {
  recon: '#6366f1', analysis: '#f59e0b', action: '#22c55e',
  'cross-cutting': '#ec4899', none: '#a855f7',
};

export const AGENTS: AgentNode[] = [
  // ── Level 0 ──────────────────────────────────────────────────
  { id:'strategist-supervisor', name:'Strategist', emoji:'🧠', phase:'React', tier:'supervisor', crew:'none',
    role:'Apex meta-agent: planifica ejecución (HTN planning), resuelve contradicciones entre analistas, genera síntesis ejecutiva del portfolio.',
    input:['portfolioProjects','allFindings','contradictions?'], output:['ExecutionPlan','StrategistOutput'],
    memory:'Lee todos los reportes en RAM. Puede escribir a SQLite plan de ejecución.', llm:true, dependsOn:[], autonomous:false },

  // ── Level 1 ──────────────────────────────────────────────────
  { id:'recon-lead', name:'Recon Lead', emoji:'🔍', phase:'Sense', tier:'crew-lead', crew:'recon',
    role:'Coordina Recon crew. Decide si re-escanear o usar caché. Data quality gate antes de pasar al Analysis crew.',
    input:['lastScanAt?','staleThresholdHours?'], output:['ReconLeadOutput'],
    memory:'Lee timestamp del último scan en SQLite.', llm:false, dependsOn:['strategist-supervisor'], autonomous:false },
  { id:'analysis-lead', name:'Analysis Lead', emoji:'⚗️', phase:'Analyze', tier:'crew-lead', crew:'analysis',
    role:'Coordina 8 analistas. Scheduling con dependencias. Cross-agent finding propagation. Early stopping si SAC > umbral.',
    input:['currentSAC?','availableAnalysts','priorityDimensions?'], output:['AnalysisSchedule'],
    memory:'Bus de mensajes en RAM — comparte hallazgos entre analistas mid-run.', llm:false, dependsOn:['recon-lead'], autonomous:false },
  { id:'action-lead', name:'Action Lead', emoji:'⚡', phase:'React', tier:'crew-lead', crew:'action',
    role:'Gate final antes de publicar propuestas. Coordina Composer + Validation + Cost. Escala al Strategist si pass rate < 50%.',
    input:['proposalCount?','validationPassRate?','estimatedCostUSD?'], output:['ActionPackage'],
    memory:'Lee resultados de validation-agent y cost-estimator de la sesión.', llm:false, dependsOn:['analysis-lead'], autonomous:false },

  // ── Level 2: Recon Crew ───────────────────────────────────────
  { id:'portfolio-scanner', name:'Portfolio Scanner', emoji:'📡', phase:'Sense', tier:'specialist', crew:'recon',
    role:'Descubre y clasifica proyectos en el Workspace. Detecta stack, madurez y tags.',
    input:['scanPath?'], output:['PortfolioScanResult[]'],
    memory:'Stateless — re-escanea cada run.', llm:false, dependsOn:['recon-lead'], autonomous:false },
  { id:'competitive-intel-agent', name:'Competitive Intel', emoji:'📊', phase:'Sense', tier:'specialist', crew:'recon',
    role:'Extrae datos de competidores desde WS10/WS12 para la Frontera de Eficiencia.',
    input:['projectId','answers'], output:['CompetitiveIntelResult'],
    memory:'Lee worksheets de SQLite.', llm:false, dependsOn:['recon-lead'], autonomous:false },

  // ── Level 2: Analysis Crew ────────────────────────────────────
  { id:'worksheet-synthesizer', name:'Worksheet Synth', emoji:'📝', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Auto-rellena WS01-WS11 analizando el filesystem. LLM opcional.',
    input:['projectId','projectPath','stack'], output:['WorksheetSynthesisResult[]'],
    memory:'Persiste en SQLite vía upsertAnswer().', llm:true, dependsOn:['analysis-lead'], autonomous:false },
  { id:'connected-strategy-analyst', name:'Connected Strategy', emoji:'🔄', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Evalúa loop conectado y madurez del ciclo cerrado. Score vs framework Wharton.',
    input:['projectId','answers'], output:['AnalystReport'],
    memory:'Lee worksheets de SQLite. No escribe.', llm:false, dependsOn:['worksheet-synthesizer'], autonomous:false },
  { id:'competitive-advantage-analyst', name:'Competitive Advantage', emoji:'⚔️', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Evalúa switching costs, WTP uplift, activity system fit y diferenciación.',
    input:['projectId','answers'], output:['AnalystReport'],
    memory:'Lee worksheets de SQLite.', llm:false, dependsOn:['worksheet-synthesizer'], autonomous:false },
  { id:'business-model-analyst', name:'Business Model', emoji:'💼', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Evalúa claridad del modelo de ingresos, profundidad del moat y escalabilidad.',
    input:['projectId','answers'], output:['AnalystReport'],
    memory:'Lee worksheets de SQLite.', llm:false, dependsOn:['worksheet-synthesizer'], autonomous:false },
  { id:'data-science-opportunity-analyst', name:'Data Science', emoji:'∑', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Evalúa disponibilidad de datos, instrumentación y rigor estadístico. Standard MITx.',
    input:['projectId','answers'], output:['AnalystReport'],
    memory:'Lee worksheets de SQLite.', llm:false, dependsOn:['worksheet-synthesizer'], autonomous:false },
  { id:'architecture-improvement-analyst', name:'Architecture', emoji:'⬡', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Evalúa modularidad, cobertura de tests, observabilidad y compliance.',
    input:['projectId','answers','projectPath?'], output:['AnalystReport'],
    memory:'Lee worksheets + filesystem.', llm:false, dependsOn:['worksheet-synthesizer'], autonomous:false },
  { id:'ai-frontier-analyst', name:'AI Frontier', emoji:'✦', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Evalúa oportunidades de IA: guardrails, gaps de automatización, moat de IA.',
    input:['projectId','answers'], output:['AnalystReport'],
    memory:'Lee worksheets de SQLite.', llm:false, dependsOn:['worksheet-synthesizer'], autonomous:false },
  { id:'causal-mapper', name:'Causal Mapper', emoji:'⟁', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Reemplaza SAC plano con DAG causal (Pearl 2000). Architecture→DS→BusinessModel. Computa SAC causal vs plano.',
    input:['projectId','scores'], output:['CausalOutput (causalSAC, dag, dimensions)'],
    memory:'Sin persistencia. Cálculo puro con 10 aristas causales.', llm:false, dependsOn:['connected-strategy-analyst','competitive-advantage-analyst'], autonomous:false },
  { id:'frontier-mapper-agent', name:'Frontier Mapper', emoji:'📈', phase:'Analyze', tier:'specialist', crew:'analysis',
    role:'Calcula frontera de Pareto y ventaja competitiva (CA = Value_Own − Value_Comp).',
    input:['projectId','entities: FrontierEntity[]'], output:['FrontierMapperResult'],
    memory:'Sin persistencia. Cálculo puro.', llm:false, dependsOn:['competitive-intel-agent'], autonomous:false },

  // ── Level 2: Cross-Cutting ────────────────────────────────────
  { id:'temporal-analyst', name:'Temporal Analyst', emoji:'📅', phase:'Analyze', tier:'specialist', crew:'cross-cutting',
    role:'Detecta tendencias, regresiones e inflection points comparando vs runs históricos. Z-score significance testing.',
    input:['projectId','currentScores','historicalRuns?'], output:['TemporalOutput (trends, regressions)'],
    memory:'Lee historial de jobs de SQLite. Puede auto-ejecutarse en schedule.', llm:false, dependsOn:['analysis-lead'], autonomous:true },
  { id:'anomaly-detector', name:'Anomaly Detector', emoji:'🔔', phase:'Analyze', tier:'specialist', crew:'cross-cutting',
    role:'Z-score outlier detection en scores. Outliers cross-portfolio. Reglas de contradicción en worksheets.',
    input:['projectId','scores','worksheetAnswers?','portfolioScores?'], output:['AnomalyOutput'],
    memory:'Sin persistencia. Compara contra portfolio scores en RAM.', llm:false, dependsOn:['analysis-lead'], autonomous:false },

  // ── Level 2: Action Crew ──────────────────────────────────────
  { id:'proposal-composer', name:'Proposal Composer', emoji:'◉', phase:'React', tier:'specialist', crew:'action',
    role:'Agrega hallazgos de todos los analistas. Genera ImprovementProposal[] con evidencia e impacto.',
    input:['projectId','reports: AnalystReport[]'], output:['ImprovementProposal[]'],
    memory:'Lee cache de reports en RAM de la sesión.', llm:false, dependsOn:['analysis-lead'], autonomous:false },
  { id:'validation-agent', name:'Validation Agent', emoji:'✓', phase:'React', tier:'specialist', crew:'action',
    role:'Verifica propuestas: contradicciones (Jaccard), evidencia faltante, criterios vagos, riesgo alto sin rollback.',
    input:['projectId','proposals: ImprovementProposal[]'], output:['ValidationOutput (passRate, issues)'],
    memory:'Sin persistencia. Constraint satisfaction en RAM.', llm:false, dependsOn:['proposal-composer'], autonomous:false },
  { id:'cost-estimator-agent', name:'Cost Estimator', emoji:'💰', phase:'React', tier:'specialist', crew:'action',
    role:'Calcula costo USD por workflow IA usando precios Gemini Flash/Pro por token.',
    input:['projectId','agentRuns: AgentRunEntry[]'], output:['CostEstimatorResult'],
    memory:'Sin persistencia. Calcula en tiempo real.', llm:false, dependsOn:['proposal-composer'], autonomous:false },
];

export const TIER_ORDER: Tier[] = ['supervisor', 'crew-lead', 'specialist'];
