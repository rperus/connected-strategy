/**
 * StrategicImprovePage — Real Pipeline Results + Prompt Generator
 *
 * Loads LIVE data from POST /api/pipeline/run-full (offline mode = zero cost).
 * Falls back to curated static proposals when no pipeline run exists.
 */
import React, { useState, useEffect } from 'react';
import { api } from '../config';
import { MOCK_PROJECTS } from '../mockData';

// ── Types ────────────────────────────────────────────────────────────────────

interface LivePrompt {
  projectName: string;
  promptForAntigravity: string;
}

interface LiveFinding {
  projectId: string;
  projectName: string;
  agentId: string;
  finding: {
    id: string;
    title: string;
    description: string;
    priority: string;
    category: string;
  };
}

interface PipelineHistory {
  id: number;
  timestamp: string;
  elapsed: string;
  projects_scanned: number;
  total_findings: number;
  total_proposals: number;
  total_prompts: number;
}

// ── Static fallback proposals (when no pipeline run yet) ──────────────────────

const STATIC: Record<string, Array<{ title: string; description: string; impact: 'high'|'medium'|'low'; category: string }>> = {
  'connected-strategy': [
    { title: 'Persistir historical runs en SQLite', impact: 'high', category: 'architecture',
      description: 'pipeline_runs ya existe en el schema. Conectar el Temporal Analyst para que lea histórico real y detecte regresiones con Z-score.' },
    { title: 'Enriquecer scoring keys con señales de código', impact: 'high', category: 'data-science',
      description: 'buildScoringKeys() solo lee README. Leer también package.json, config.ts, App.tsx para detectar auth, notificaciones, pagos reales. CE score actual: 10/100.' },
  ],
  'balam-licitaciones': [
    { title: 'Activar Stripe LIVE ($49/mo)', impact: 'high', category: 'revenue',
      description: 'Stripe está en modo TEST. Un flag lo activa. SAC=48, CE=53 — infraestructura lista.' },
    { title: 'Alertas proactivas por sector', impact: 'high', category: 'automation',
      description: 'Cerebro daemon escanea cada 60s. Falta trigger de notificación al usuario cuando aparece licitación en su sector.' },
  ],
  'rodrigo-os-health': [
    { title: 'Activar 5 workflows n8n en GCP', impact: 'high', category: 'automation',
      description: 'Los JSON existen. Importar y activar en la instancia n8n (ver .env.local). SAC actual: 26/100, AR=11 (arquitectura frágil).' },
  ],
  'youtube-cashcow': [
    { title: 'Verificar workflows n8n activos', impact: 'high', category: 'automation',
      description: 'SAC=14/100 — el más bajo. 4 workflows con status unknown. Activar Master Pipeline y RADAR para orquestación.' },
  ],
};

export function StrategicImprovePage() {
  const [selectedProject, setSelectedProject] = useState(MOCK_PROJECTS[0]?.id ?? '');
  const [livePrompts, setLivePrompts] = useState<LivePrompt[]>([]);
  const [liveFindings, setLiveFindings] = useState<LiveFinding[]>([]);
  const [history, setHistory] = useState<PipelineHistory[]>([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'proposals'|'prompt'|'findings'>('proposals');
  const [copied, setCopied] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown'|'live'|'offline'>('unknown');

  const project = MOCK_PROJECTS.find(p => p.id === selectedProject);

  // Load pipeline data on mount
  useEffect(() => {
    loadLiveData();
  }, []);

  async function loadLiveData() {
    try {
      const [pRes, fRes, hRes] = await Promise.all([
        fetch(api.pipelinePrompts),
        fetch(api.pipelineFindings),
        fetch(api.pipelineHistory),
      ]);
      if (pRes.ok) {
        const pb = await pRes.json() as { ok: boolean; data: LivePrompt[] };
        if (pb.ok && pb.data.length > 0) { setLivePrompts(pb.data); setApiStatus('live'); }
      }
      if (fRes.ok) {
        const fb = await fRes.json() as { ok: boolean; data: LiveFinding[] };
        if (fb.ok) setLiveFindings(fb.data);
      }
      if (hRes.ok) {
        const hb = await hRes.json() as { ok: boolean; data: PipelineHistory[] };
        if (hb.ok) setHistory(hb.data);
      }
    } catch {
      setApiStatus('offline');
    }
  }

  async function runPipeline() {
    setRunning(true);
    try {
      const r = await fetch(api.pipelineRunFull, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useGemini: false }),
      });
      if (r.ok) {
        await loadLiveData();
        setApiStatus('live');
      }
    } catch { setApiStatus('offline'); }
    finally { setRunning(false); }
  }

  // Find live prompt for current project (match by name fragment)
  const currentLivePrompt = livePrompts.find(p =>
    p.projectName.toLowerCase().includes(selectedProject.replace(/-/g, '_').toLowerCase()) ||
    p.projectName.toLowerCase().includes(selectedProject.replace(/-/g, ' ').toLowerCase()) ||
    selectedProject.includes(p.projectName.toLowerCase().replace(/ /g, '-'))
  );

  const currentFindings = liveFindings.filter(f => f.projectId === selectedProject);
  const staticProposals = STATIC[selectedProject] ?? [];
  const lastRun = history[0];

  const IMPACT = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' } as const;
  const CAT_ICON: Record<string,string> = { revenue:'💰', architecture:'⬡', 'data-science':'∑', automation:'⚡', strategy:'🧠', ux:'✨' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🚀 Mejoras Estratégicas</h1>
        <p className="page-subtitle">
          Pipeline real de Connected Strategy → Hallazgos → Prompts para Antigravity
        </p>
      </div>

      {/* Status bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:10, padding:'3px 10px', borderRadius:12,
          background: apiStatus==='live' ? '#22c55e20' : '#f59e0b20',
          color: apiStatus==='live' ? '#22c55e' : '#f59e0b', fontWeight:700 }}>
          {apiStatus==='live' ? `● Pipeline activo — ${livePrompts.length} proyectos` : '○ Sin pipeline — mostrando propuestas estáticas'}
        </span>
        {lastRun && (
          <span style={{ fontSize:9, color:'var(--cs-text-muted)' }}>
            Último run: {new Date(lastRun.timestamp).toLocaleString()} · {lastRun.elapsed} · {lastRun.total_findings} hallazgos
          </span>
        )}
        <button onClick={runPipeline} disabled={running} style={{
          marginLeft:'auto', padding:'6px 16px', borderRadius:20, fontSize:11, fontWeight:700, cursor:running?'not-allowed':'pointer',
          background: running ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg,#10b981,#059669)',
          border:'1px solid #059669', color:'#fff',
        }}>
          {running ? '⟳ Ejecutando pipeline…' : '🚀 Correr Pipeline (sin costo)'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:16 }}>

        {/* Project list */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--cs-text-muted)', textTransform:'uppercase', marginBottom:4 }}>
            Plataformas ({MOCK_PROJECTS.length})
          </div>
          {MOCK_PROJECTS.map(p => {
            const isSel = p.id === selectedProject;
            const hasLive = livePrompts.some(lp =>
              lp.projectName.toLowerCase().includes(p.id.replace(/-/g,'_')) ||
              p.id.includes(lp.projectName.toLowerCase().replace(/ /g,'-'))
            );
            const findings = liveFindings.filter(f => f.projectId === p.id).length;
            const staticCount = (STATIC[p.id] ?? []).length;
            return (
              <div key={p.id} onClick={() => { setSelectedProject(p.id); setTab('proposals'); }}
                style={{ padding:'9px 11px', borderRadius:8, cursor:'pointer',
                  background: isSel ? 'rgba(99,102,241,0.15)' : '#1e2433',
                  border: isSel ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:10, fontWeight:700, color: isSel ? '#6366f1' : 'var(--cs-text)', marginBottom:3 }}>{p.name}</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {hasLive && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:6, background:'#22c55e20', color:'#22c55e', fontWeight:700 }}>● live</span>}
                  {findings > 0 && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:6, background:'#f59e0b20', color:'#f59e0b', fontWeight:700 }}>{findings}f</span>}
                  {staticCount > 0 && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:6, background:'rgba(255,255,255,0.06)', color:'var(--cs-text-muted)' }}>{staticCount} static</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Header */}
          <div className="card" style={{ padding:'12px 16px' }}>
            <div style={{ fontSize:15, fontWeight:800 }}>{project?.name}</div>
            <div style={{ fontSize:9, fontFamily:'monospace', color:'var(--cs-text-muted)' }}>{project?.path}</div>
            {currentLivePrompt && (
              <div style={{ marginTop:6, fontSize:10, color:'#22c55e' }}>
                ✅ Datos reales del pipeline disponibles — {currentFindings.length} hallazgos
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:6 }}>
            {(['proposals','findings','prompt'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'5px 14px', borderRadius:16, fontSize:10, fontWeight:700, cursor:'pointer',
                background: tab===t ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: tab===t ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                color: tab===t ? '#6366f1' : 'var(--cs-text-muted)',
              }}>
                {t==='proposals' ? `📋 Propuestas (${staticProposals.length})` :
                 t==='findings' ? `🔍 Hallazgos reales (${currentFindings.length})` :
                 `⚡ Prompt Antigravity`}
              </button>
            ))}
          </div>

          {/* Proposals tab */}
          {tab==='proposals' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* Real score from pipeline if available */}
              {currentLivePrompt && (() => {
                const match = currentLivePrompt.promptForAntigravity.match(/SAC:\s*(\d+)/);
                const sac = match ? match[1] : null;
                const ceMatch = currentLivePrompt.promptForAntigravity.match(/CE:(\d+)/);
                const ce = ceMatch ? ceMatch[1] : null;
                return sac ? (
                  <div className="card" style={{ padding:'10px 14px', borderLeft:'3px solid #22c55e' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#22c55e', marginBottom:4 }}>📊 Score Real del Pipeline</div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                      <span style={{ fontSize:18, fontWeight:900, color:'#6366f1' }}>{sac}<span style={{ fontSize:10, color:'var(--cs-text-muted)'}}>/100 SAC</span></span>
                      {ce && <span style={{ fontSize:18, fontWeight:900, color:'#ea580c' }}>{ce}<span style={{ fontSize:10, color:'var(--cs-text-muted)'}}>/100 CE</span></span>}
                    </div>
                    <div style={{ fontSize:9, color:'var(--cs-text-muted)', marginTop:4 }}>Scores calculados en 0.4s — modo offline, sin costo de API</div>
                  </div>
                ) : null;
              })()}

              {staticProposals.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:32, color:'var(--cs-text-muted)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🎯</div>
                  <div>Corre el pipeline para ver propuestas de mejora específicas.</div>
                </div>
              ) : staticProposals.map((p, i) => (
                <div key={i} className="card" style={{ padding:'12px 14px', borderLeft:`3px solid ${IMPACT[p.impact]}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13 }}>{CAT_ICON[p.category] ?? '🔧'}</span>
                    <span style={{ fontSize:12, fontWeight:700 }}>{p.title}</span>
                    <span style={{ fontSize:8, padding:'2px 6px', borderRadius:6,
                      background:`${IMPACT[p.impact]}20`, color:IMPACT[p.impact], fontWeight:700 }}>
                      {p.impact === 'high' ? '🔴' : p.impact === 'medium' ? '🟡' : '⚪'} {p.impact}
                    </span>
                    <span style={{ fontSize:8, padding:'2px 6px', borderRadius:6, background:'rgba(99,102,241,0.1)', color:'#818cf8' }}>{p.category}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--cs-text)', lineHeight:1.6 }}>{p.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Real findings tab */}
          {tab==='findings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {currentFindings.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:32, color:'var(--cs-text-muted)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
                  <div>Corre el pipeline para ver hallazgos reales de los agentes.</div>
                  <button onClick={runPipeline} disabled={running} style={{
                    marginTop:12, padding:'6px 16px', borderRadius:16, fontSize:11, fontWeight:700, cursor:'pointer',
                    background:'rgba(16,185,129,0.2)', border:'1px solid #10b981', color:'#10b981',
                  }}>{running ? '⟳ Corriendo…' : '🚀 Correr ahora'}</button>
                </div>
              ) : currentFindings.map((f, i) => (
                <div key={i} className="card" style={{ padding:'10px 12px', borderLeft:'3px solid #f59e0b' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                    <span style={{ fontSize:11, fontWeight:700 }}>{f.finding.title}</span>
                    <span style={{ fontSize:8, padding:'1px 5px', borderRadius:5, background:'rgba(99,102,241,0.1)', color:'#818cf8' }}>{f.agentId}</span>
                    {f.finding.priority && (
                      <span style={{ fontSize:8, padding:'1px 5px', borderRadius:5,
                        background: f.finding.priority==='high' ? '#ef444420' : '#f59e0b20',
                        color: f.finding.priority==='high' ? '#ef4444' : '#f59e0b', fontWeight:700 }}>{f.finding.priority}</span>
                    )}
                  </div>
                  <div style={{ fontSize:10, color:'var(--cs-text-muted)', lineHeight:1.5 }}>{f.finding.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Prompt tab */}
          {tab==='prompt' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div className="card" style={{ padding:'12px 14px', borderLeft:'3px solid #22c55e' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:13 }}>⚡</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#22c55e' }}>
                    {currentLivePrompt ? 'Prompt Real (pipeline)' : 'Prompt Estático (sin pipeline)'}
                  </span>
                  <button onClick={() => {
                    const text = currentLivePrompt?.promptForAntigravity ??
                      `# Sugerencias para ${project?.name}\n⚠️ SUGERENCIA — requiere revisión de Antigravity antes de implementar\n\n${staticProposals.map((p,i) => `${i+1}. **${p.title}** [${p.impact}]\n   ${p.description}`).join('\n\n')}`;
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} style={{
                    marginLeft:'auto', padding:'4px 12px', borderRadius:12, fontSize:10, fontWeight:700, cursor:'pointer',
                    background:'rgba(34,197,94,0.15)', border:'1px solid #22c55e60', color:'#22c55e',
                  }}>{copied ? '✅ Copiado!' : '📋 Copiar'}</button>
                </div>
                <div style={{ fontSize:9, color:'var(--cs-text-muted)' }}>
                  {currentLivePrompt
                    ? '⚠️ Framed como SUGERENCIA. El agente receptor evaluará viabilidad antes de implementar.'
                    : 'Corre el pipeline para obtener un prompt basado en análisis real de tu código.'}
                </div>
              </div>

              <pre style={{
                background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8,
                padding:16, fontSize:11, lineHeight:1.7, color:'#e6edf3',
                whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:520, overflow:'auto',
              }}>
                {currentLivePrompt
                  ? `# 💡 SUGERENCIA — ${project?.name}\n# ⚠️ Requiere revisión de Antigravity antes de implementar\n# Fuente: Connected Strategy v2.3.0 Pipeline Real\n\n${currentLivePrompt.promptForAntigravity}`
                  : staticProposals.length > 0
                    ? `# 💡 Sugerencias para ${project?.name}\n# ⚠️ SUGERENCIA — Antigravity debe evaluar viabilidad antes de implementar\n\n${staticProposals.map((p,i) => `${i+1}. **${p.title}** [${p.impact}]\n   ${p.description}`).join('\n\n')}\n\n## Nota\nEjecuta el pipeline real (botón arriba) para obtener un análisis basado en tu código actual.`
                    : '// Selecciona un proyecto y corre el pipeline para generar el prompt.'
                }
              </pre>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="card" style={{ padding:'10px 14px', marginTop:4 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--cs-text-muted)', textTransform:'uppercase', marginBottom:6 }}>
                📜 Historial de Pipeline Runs ({history.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:120, overflow:'auto' }}>
                {history.slice(0, 5).map(h => (
                  <div key={h.id} style={{ display:'flex', gap:10, fontSize:9, color:'var(--cs-text-muted)', alignItems:'center' }}>
                    <span style={{ fontFamily:'monospace', color:'var(--cs-text)' }}>{new Date(h.timestamp).toLocaleString()}</span>
                    <span>{h.projects_scanned} proyectos</span>
                    <span style={{ color:'#f59e0b' }}>{h.total_findings} hallazgos</span>
                    <span style={{ color:'#22c55e' }}>{h.total_prompts} prompts</span>
                    <span style={{ color:'var(--cs-text-muted)' }}>{h.elapsed}</span>
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
