/**
 * Agent Orchestrator — 3-Tier Hierarchical Swarm View
 * Level 0: Supervisor | Level 1: Crew Leads | Level 2: Specialists
 * Views: hierarchy | orgchart | flow
 */
import React, { useState, useRef, useEffect } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { useProject } from '../context/ProjectContext';

import { API_BASE_URL } from '../config';

type Tier = 'supervisor' | 'crew-lead' | 'specialist';
type Crew = 'recon' | 'analysis' | 'action' | 'cross-cutting' | 'none';
type Phase = 'Sense' | 'Analyze' | 'React';

interface AgentNode {
  id: string; name: string; emoji: string;
  phase: Phase; tier: Tier; crew: Crew;
  role: string; input: string[]; output: string[];
  memory: string; llm: boolean; dependsOn: string[];
  autonomous: boolean;
}

const TIER_COLORS: Record<Tier, string> = {
  'supervisor': '#a855f7',
  'crew-lead':  '#06b6d4',
  'specialist': '#f59e0b',
};
const TIER_LABELS: Record<Tier, string> = {
  'supervisor': '🧠 Nivel 0: Supervisor',
  'crew-lead':  '⚙️ Nivel 1: Crew Leads',
  'specialist': '🔬 Nivel 2: Especialistas',
};
const CREW_COLORS: Record<Crew, string> = {
  recon: '#6366f1', analysis: '#f59e0b', action: '#22c55e',
  'cross-cutting': '#ec4899', none: '#a855f7',
};

const AGENTS: AgentNode[] = [
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

const TIER_ORDER: Tier[] = ['supervisor', 'crew-lead', 'specialist'];

export function AgentOrchestratorPage() {
  const { activeProject } = useProject();
  const [selected, setSelected] = useState<AgentNode | null>(null);
  const [filterCrew, setFilterCrew] = useState<Crew | 'all'>('all');
  const [view, setView] = useState<'hierarchy' | 'orgchart' | 'flow'>('hierarchy');
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle'|'running'|'done'|'failed'>('idle');
  const [logs, setLogs] = useState<{phase?: string, msg?: string, message?: string, type?: string, agentId?: string}[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (runId) {
      const eventSource = new EventSource(`${API_BASE_URL}/api/pipeline/v3-stream/${runId}`);
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setLogs(prev => [...prev, data]);
        
        // Track active agent
        if (data.type === 'telemetry' && data.agentId) {
          if (data.message.includes('started') || data.message.includes('Starting')) {
            setActiveAgentId(data.agentId);
          }
        } else if (data.phase && data.phase !== 'general') {
           // Approximate active agent by phase if needed
        }

        if (data.phase === 'DONE' || data.phase === 'FAILED') {
          eventSource.close();
          setStatus(data.phase === 'DONE' ? 'done' : 'failed');
          setActiveAgentId(null);
        }
      };
      return () => eventSource.close();
    }
  }, [runId]);

  const runPipeline = async () => {
    if (!activeProject?.id) return alert('Selecciona un proyecto primero.');
    setLogs([]);
    setStatus('running');
    setActiveAgentId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/run-v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: [activeProject.id], useGemini: true })
      });
      const data = await res.json();
      if (data.ok) setRunId(data.runId);
      else setStatus('failed');
    } catch (e) {
      console.error(e);
      setStatus('failed');
    }
  };

  const crews: Crew[] = ['recon', 'analysis', 'action', 'cross-cutting'];
  const visible = filterCrew === 'all' ? AGENTS : AGENTS.filter(a => a.crew === filterCrew || a.tier !== 'specialist');

  const byTier = (tier: Tier) => visible.filter(a => a.tier === tier);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🤖 Orquestador de Agentes — Swarm Jerárquico</h1>
        <p className="page-subtitle">
          20 agentes · 3 niveles · Supervisor → Crew Leads → Especialistas · Haz clic para detalles
        </p>
      </div>
      <ProjectBanner context="Agent Orchestrator" />

      {/* Controls */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6 }}>
          {(['hierarchy','orgchart','flow'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
              background: view===v ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: view===v ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
              color: view===v ? '#6366f1' : 'var(--cs-text-muted)',
            }}>{v === 'hierarchy' ? '🏗️ Jerarquía' : v === 'orgchart' ? '🌳 Organigrama' : '🔄 Flujo'}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {(['all',...crews] as const).map(c => (
            <button key={c} onClick={() => setFilterCrew(c)} style={{
              padding:'4px 10px', borderRadius:14, fontSize:10, fontWeight:700, cursor:'pointer',
              background: filterCrew===c ? `${CREW_COLORS[c as Crew] ?? '#6366f1'}22` : 'transparent',
              border: filterCrew===c ? `1px solid ${CREW_COLORS[c as Crew] ?? '#6366f1'}` : '1px solid rgba(255,255,255,0.08)',
              color: filterCrew===c ? (CREW_COLORS[c as Crew] ?? '#6366f1') : 'var(--cs-text-muted)',
            }}>{c === 'all' ? 'Todos' : c}</button>
          ))}
        </div>
        {/* Stats */}
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          {([
            { label:'Total', val:20, color:'#6366f1' },
            { label:'LLM', val:2, color:'#ec4899' },
            { label:'Auto', val:1, color:'#22c55e' },
            { label:'Crews', val:4, color:'#f59e0b' },
          ]).map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:900, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:9, color:'var(--cs-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>
        {/* Main Canvas */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Telemetry Bar */}
          <div style={{ padding: '16px', background: 'var(--cs-surface-2)', borderRadius: 12, border: '1px solid var(--cs-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Control de Ejecución</div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>
                {status === 'running' ? 'Pipeline ejecutándose...' : status === 'done' ? 'Ejecución completada.' : 'Pipeline en espera.'}
              </div>
            </div>
            <button onClick={runPipeline} disabled={status === 'running'} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: status === 'running' ? 'not-allowed' : 'pointer',
              background: status === 'running' ? '#4b5563' : '#6366f1', color: 'white', border: 'none'
            }}>
              {status === 'running' ? '⏳ Ejecutando...' : '🚀 Iniciar V3 Swarm'}
            </button>
          </div>
          {logs.length > 0 && (
            <div style={{ padding: 12, background: '#0a0d14', border: '1px solid #1f2937', borderRadius: 8, maxHeight: 150, overflowY: 'auto', fontFamily: 'monospace', fontSize: 10 }}>
              {logs.map((l, i) => (
                <div key={i} style={{ color: l.type === 'telemetry' ? '#a855f7' : '#10b981', marginBottom: 4 }}>
                  <span style={{ color: '#6b7280' }}>[{new Date().toLocaleTimeString()}]</span> {l.agentId ? `<${l.agentId}> ` : ''}{l.msg || l.message}
                </div>
              ))}
              <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
            </div>
          )}

          {/* ── ORGCHART VIEW ─────────────────────────────────────── */}
          {view === 'orgchart' && (() => {
            // Virtual canvas — scales with viewBox to fill any container
            const VW = 1600;
            const NW = 152, NH = 56;
            const ROW_GAP = 70, COL_GAP = 14;
            const yInc = NH + COL_GAP;

            // Row Y positions
            const y0 = 28;
            const y1 = y0 + NH + ROW_GAP;
            const y2 = y1 + NH + ROW_GAP;

            // Crew lead horizontal centres
            const cxRecon    = 220;
            const cxAnalysis = 800;
            const cxAction   = 1380;
            const cxSup      = VW / 2;

            const leads = [
              { id:'recon-lead',    cx: cxRecon },
              { id:'analysis-lead', cx: cxAnalysis },
              { id:'action-lead',   cx: cxAction },
            ];

            // Specialist lists
            const reconSpecs    = ['portfolio-scanner','competitive-intel-agent'];
            const analysisSpecs = [
              'worksheet-synthesizer','connected-strategy-analyst','competitive-advantage-analyst',
              'business-model-analyst','data-science-opportunity-analyst','architecture-improvement-analyst',
              'ai-frontier-analyst','causal-mapper','frontier-mapper-agent',
              'temporal-analyst','anomaly-detector',
            ];
            const actionSpecs   = ['proposal-composer','validation-agent','cost-estimator-agent'];

            // Build positioned specialist nodes
            const specNodes: {id:string; x:number; y:number; crewId:string}[] = [];

            // Recon: 1 col × 2 rows
            reconSpecs.forEach((id, i) => {
              specNodes.push({ id, x: cxRecon - NW/2, y: y2 + i*yInc, crewId:'recon' });
            });

            // Analysis: 3 cols × 4 rows (11 nodes)
            const aCols = 3;
            const aTotalW = aCols*NW + (aCols-1)*COL_GAP;
            const aStartX = cxAnalysis - aTotalW/2;
            analysisSpecs.forEach((id, i) => {
              const col = i % aCols, row = Math.floor(i / aCols);
              specNodes.push({ id, x: aStartX + col*(NW+COL_GAP), y: y2 + row*yInc, crewId:'analysis' });
            });

            // Action: 1 col × 3 rows
            actionSpecs.forEach((id, i) => {
              specNodes.push({ id, x: cxAction - NW/2, y: y2 + i*yInc, crewId:'action' });
            });

            const agentMap = Object.fromEntries(AGENTS.map(a => [a.id, a]));
            const maxRows = Math.ceil(analysisSpecs.length / aCols);
            const VH = y2 + maxRows*yInc - COL_GAP + 36;

            // Bézier connector
            const bezier = (x1:number,y1b:number,x2:number,y2b:number,col:string,key:string) => {
              const my = (y1b + y2b) / 2;
              return <path key={key} d={`M${x1},${y1b} C${x1},${my} ${x2},${my} ${x2},${y2b}`}
                fill="none" stroke={`${col}65`} strokeWidth={1.5} strokeDasharray="5 4"/>;
            };

            const renderNode = (id: string, nx: number, ny: number) => {
              const a = agentMap[id]; if (!a) return null;
              const col = a.tier === 'supervisor' ? '#a855f7'
                        : a.tier === 'crew-lead'  ? '#06b6d4'
                        : CREW_COLORS[a.crew];
              const isSel = selected?.id === id;
              const isActive = activeAgentId === id;
              const label = a.name.length > 15 ? a.name.slice(0,15)+'…' : a.name;
              return (
                <g key={id} style={{cursor:'pointer'}} onClick={() => setSelected(isSel ? null : a)}>
                  <rect x={nx} y={ny} width={NW} height={NH} rx={8}
                    fill={isSel ? `${col}25` : isActive ? `${col}40` : '#131929'}
                    stroke={isSel || isActive ? col : `${col}50`} strokeWidth={isSel || isActive ? 2 : 1}/>
                  {/* Left accent bar */}
                  <rect x={nx} y={ny+8} width={3} height={NH-16} rx={1.5} fill={col}/>
                  {isActive && <circle cx={nx+NW-8} cy={ny+8} r={4} fill="#10b981" style={{ animation: 'pulse 1.5s infinite' }} />}
                  <text x={nx+12} y={ny+22} fontSize={11} fontWeight={700} fill={isActive ? '#ffffff' : col}
                    fontFamily="Inter,system-ui,sans-serif">
                    {a.emoji} {label}
                  </text>
                  <text x={nx+12} y={ny+37} fontSize={9} fill="#4e5f7a"
                    fontFamily="Inter,system-ui,sans-serif">
                    {a.crew !== 'none' ? a.crew : 'supervisor'}
                  </text>
                  {a.llm && <><rect x={nx+NW-34} y={ny+8} width={28} height={13} rx={4} fill="#6366f120"/>
                    <text x={nx+NW-32} y={ny+18} fontSize={8} fill="#818cf8" fontWeight={700}>⚡ LLM</text></>}
                  {a.autonomous && <><rect x={nx+NW-34} y={ny+NH-21} width={28} height={13} rx={4} fill="#22c55e20"/>
                    <text x={nx+NW-33} y={ny+NH-12} fontSize={8} fill="#4ade80" fontWeight={700}>⏰ AUTO</text></>}
                </g>
              );
            };

            // Crew section labels (above specialist blocks)
            const crewLabels = [
              { label:'CREW RECON', cx: cxRecon,    col: CREW_COLORS.recon },
              { label:'CREW ANALYSIS + CROSS-CUTTING', cx: cxAnalysis, col: CREW_COLORS.analysis },
              { label:'CREW ACTION', cx: cxAction,   col: CREW_COLORS.action },
            ];

            return (
              <div className="card" style={{padding:0, overflow:'hidden'}}>
                <div style={{padding:'12px 16px 8px', fontSize:11, fontWeight:700,
                  borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:12, alignItems:'center'}}>
                  🌳 Organigrama de Mando
                  <span style={{fontSize:9, color:'var(--cs-text-muted)', fontWeight:400}}>
                    Escala automáticamente · Haz clic en cualquier nodo para ver detalles
                  </span>
                </div>
                <div style={{padding:'8px', overflowX:'auto'}}>
                  <svg viewBox={`0 0 ${VW} ${VH}`} width="100%"
                    style={{display:'block', minWidth:700}} preserveAspectRatio="xMidYMid meet">

                    {/* Supervisor → Crew Leads */}
                    {leads.map(l => bezier(cxSup, y0+NH, l.cx, y1, '#a855f7', `sup-${l.id}`))}

                    {/* Crew Leads → Specialists */}
                    {specNodes.map(sn => {
                      const leadCx = sn.crewId === 'recon' ? cxRecon
                                   : sn.crewId === 'analysis' ? cxAnalysis : cxAction;
                      const col = CREW_COLORS[sn.crewId as Crew] ?? '#888';
                      return bezier(leadCx, y1+NH, sn.x+NW/2, sn.y, col, `lead-${sn.id}`);
                    })}

                    {/* Crew section labels */}
                    {crewLabels.map(g => (
                      <text key={g.label} x={g.cx} y={y2-12} textAnchor="middle"
                        fontSize={9} fontWeight={800} fill={`${g.col}80`}
                        fontFamily="Inter,system-ui,sans-serif" letterSpacing="1.5">
                        {g.label}
                      </text>
                    ))}

                    {/* Nodes: Supervisor */}
                    {renderNode('strategist-supervisor', cxSup - NW/2, y0)}
                    {/* Crew Leads */}
                    {leads.map(l => renderNode(l.id, l.cx - NW/2, y1))}
                    {/* Specialists */}
                    {specNodes.map(sn => renderNode(sn.id, sn.x, sn.y))}
                  </svg>
                </div>
              </div>
            );
          })()}


          {/* ── HIERARCHY VIEW ────────────────────────────────────── */}
          {view !== 'orgchart' && TIER_ORDER.map(tier => {
            const agents = byTier(tier);
            if (!agents.length) return null;
            const color = TIER_COLORS[tier];
            return (
              <div key={tier} style={{
                border:`1px solid ${color}30`, borderRadius:12,
                background:`${color}06`, padding:14,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:800, color }}>{TIER_LABELS[tier]}</div>
                  <div style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:`${color}20`, color }}>{agents.length} agente{agents.length>1?'s':''}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:8 }}>
                  {agents.map(agent => {
                    const isSel = selected?.id === agent.id;
                    const crewColor = CREW_COLORS[agent.crew];
                    return (
                      <div key={agent.id} onClick={() => setSelected(isSel ? null : agent)}
                        style={{
                          padding:'10px 12px', borderRadius:9, cursor:'pointer',
                          background: isSel ? `${color}20` : (activeAgentId === agent.id ? `${color}40` : '#1e2433'),
                          border:`1px solid ${isSel || activeAgentId === agent.id ? color : `${color}33`}`,
                          borderLeft:`3px solid ${crewColor}`,
                          transition:'all 0.15s',
                          position: 'relative'
                        }}>
                        {activeAgentId === agent.id && <div style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#10b981', animation:'pulse 1.5s infinite' }} />}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:18 }}>{agent.emoji}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:11, fontWeight:700, color: isSel ? color : 'var(--cs-text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {agent.name}
                            </div>
                            <div style={{ display:'flex', gap:4, marginTop:2, flexWrap:'wrap' }}>
                              <span style={{ fontSize:8, padding:'1px 5px', borderRadius:6, background:`${crewColor}20`, color:crewColor, fontWeight:700 }}>
                                {agent.crew}
                              </span>
                              {agent.llm && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:6, background:'#6366f120', color:'#6366f1', fontWeight:700 }}>⚡LLM</span>}
                              {agent.autonomous && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:6, background:'#22c55e20', color:'#22c55e', fontWeight:700 }}>⏰AUTO</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize:9, color:'var(--cs-text-muted)', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {agent.role}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Execution flow diagram */}
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, marginBottom:12 }}>🔄 Flujo de Ejecución (Strategist Plan)</div>
            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
              {[
                { label:'① Strategist\nPlans', color:'#a855f7', agents:1 },
                { label:'② Recon Lead\n+ Crew', color:'#6366f1', agents:3 },
                { label:'③ Temporal\n+ Anomaly', color:'#ec4899', agents:2 },
                { label:'④ Analysis Lead\n+ 8 Analysts', color:'#f59e0b', agents:9 },
                { label:'⑤ Causal\nMapper', color:'#06b6d4', agents:1 },
                { label:'⑥ Action Lead\n+ Validation', color:'#22c55e', agents:4 },
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div style={{ textAlign:'center', padding:'8px 10px', borderRadius:8, background:`${step.color}15`, border:`1px solid ${step.color}40`, minWidth:90 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:step.color, whiteSpace:'pre-line', lineHeight:1.4 }}>{step.label}</div>
                    <div style={{ fontSize:8, color:'var(--cs-text-muted)', marginTop:3 }}>{step.agents} agente{step.agents>1?'s':''}</div>
                  </div>
                  {i < arr.length-1 && <div style={{ color:'var(--cs-text-muted)', fontSize:14 }}>→</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div>
          {selected ? (
            <div className="card" style={{ borderLeft:`3px solid ${TIER_COLORS[selected.tier]}`, position:'sticky', top:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:28 }}>{selected.emoji}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:TIER_COLORS[selected.tier] }}>{selected.name}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
                    <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:`${TIER_COLORS[selected.tier]}20`, color:TIER_COLORS[selected.tier], fontWeight:700 }}>
                      {selected.tier}
                    </span>
                    <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:`${CREW_COLORS[selected.crew]}20`, color:CREW_COLORS[selected.crew], fontWeight:700 }}>
                      crew:{selected.crew}
                    </span>
                    {selected.llm && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:'#6366f120', color:'#6366f1', fontWeight:700 }}>⚡LLM</span>}
                    {selected.autonomous && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:'#22c55e20', color:'#22c55e', fontWeight:700 }}>⏰ Autónomo</span>}
                  </div>
                </div>
              </div>

              <div style={{ fontSize:11, color:'var(--cs-text-muted)', lineHeight:1.6, marginBottom:12 }}>{selected.role}</div>

              {[
                { label:'📥 INPUT', items:selected.input, color:'#6366f1' },
                { label:'📤 OUTPUT', items:selected.output, color:'#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
                  {s.items.map(item => (
                    <div key={item} style={{ fontSize:10, padding:'3px 8px', background:'var(--cs-surface-2)', borderRadius:4, marginBottom:2, fontFamily:'monospace', color:'var(--cs-text-muted)' }}>{item}</div>
                  ))}
                </div>
              ))}

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>🧠 MEMORIA</div>
                <div style={{ fontSize:10, color:'var(--cs-text-muted)', padding:'6px 8px', background:'var(--cs-surface-2)', borderRadius:4, lineHeight:1.5 }}>{selected.memory}</div>
              </div>

              {selected.dependsOn.length > 0 && (
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#ec4899', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>⛓️ DEPENDE DE</div>
                  {selected.dependsOn.map(dep => {
                    const a = AGENTS.find(x => x.id === dep);
                    return (
                      <div key={dep} onClick={() => setSelected(a ?? null)}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', background:'var(--cs-surface-2)', borderRadius:4, marginBottom:3, cursor:'pointer' }}>
                        <span style={{ fontSize:12 }}>{a?.emoji}</span>
                        <span style={{ fontSize:10, color:a ? TIER_COLORS[a.tier] : 'var(--cs-text-muted)', fontWeight:600 }}>{a?.name ?? dep}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:32 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🤖</div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Selecciona un agente</div>
              <div style={{ fontSize:11, color:'var(--cs-text-muted)', lineHeight:1.6 }}>
                Haz clic en cualquier tarjeta para ver su rol, tier, crew, inputs, outputs y dependencias.
              </div>
              <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
                {TIER_ORDER.map(t => (
                  <div key={t} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:`${TIER_COLORS[t]}10`, border:`1px solid ${TIER_COLORS[t]}30` }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:TIER_COLORS[t], flexShrink:0 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:TIER_COLORS[t] }}>{TIER_LABELS[t]}</span>
                    <span style={{ fontSize:10, color:'var(--cs-text-muted)', marginLeft:'auto' }}>{byTier(t).length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
