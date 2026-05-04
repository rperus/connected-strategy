/**
 * PlatformIntelPage — Skills & Workflows Intelligence View
 *
 * Shows per-platform: global Antigravity skills, local skills, n8n workflows,
 * daemons, and scripts. Real data from filesystem scan 2026-04-27.
 */
import React, { useState } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import type { ProjectWorkflow, ProjectSkill, ServiceAccess } from '@cs/domain';

const PLATFORM_COLORS: Record<string, string> = {
  'n8n':    '#ea580c',
  'daemon': '#a855f7',
  'script': '#06b6d4',
  'cron':   '#f59e0b',
};
const STATUS_COLORS = {
  active:  { bg: '#22c55e20', text: '#22c55e', label: '● Activo' },
  inactive:{ bg: '#ef444420', text: '#ef4444', label: '○ Inactivo' },
  unknown: { bg: '#6b728020', text: '#9ca3af', label: '? Desconocido' },
};
const CATEGORY_COLORS: Record<string, string> = {
  'ai-coding':    '#6366f1',
  'automation':   '#ea580c',
  'analysis':     '#f59e0b',
  'dev-workflow': '#22c55e',
  'data':         '#06b6d4',
};
const CATEGORY_ICONS: Record<string, string> = {
  'ai-coding':    '🤖',
  'automation':   '⚡',
  'analysis':     '📊',
  'dev-workflow': '🔧',
  'data':         '🗄️',
};

export function PlatformIntelPage() {
  const [selected, setSelected] = useState<string>(MOCK_PROJECTS[0]?.id ?? '');
  const [tab, setTab] = useState<'workflows' | 'skills'>('workflows');
  const [skillFilter, setSkillFilter] = useState<'all' | 'global' | 'local'>('all');

  const project = MOCK_PROJECTS.find(p => p.id === selected);
  const workflows = project?.workflows ?? [];
  const allSkills = project?.skills ?? [];
  const services  = project?.serviceAccess ?? [];
  const skills = allSkills.filter(s => skillFilter === 'all' || s.scope === skillFilter);

  const globalCount  = allSkills.filter(s => s.scope === 'global').length;
  const localCount   = allSkills.filter(s => s.scope === 'local').length;
  const activeFlows  = workflows.filter(w => w.status === 'active').length;
  const n8nCount     = workflows.filter(w => w.platform === 'n8n').length;
  const daemonCount  = workflows.filter(w => w.platform === 'daemon').length;

  // Aggregate stats across all projects
  const totalN8n    = MOCK_PROJECTS.reduce((s, p) => s + (p.workflows?.filter(w => w.platform === 'n8n').length ?? 0), 0);
  const totalDaemon = MOCK_PROJECTS.reduce((s, p) => s + (p.workflows?.filter(w => w.platform === 'daemon').length ?? 0), 0);
  const totalScripts= MOCK_PROJECTS.reduce((s, p) => s + (p.scriptCount ?? 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔌 Inteligencia de Plataformas</h1>
        <p className="page-subtitle">
          Skills Antigravity · Workflows n8n · Daemons · Scripts — datos del escaneo real 2026-04-27
        </p>
      </div>

      {/* Portfolio summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Skills Globales', val:15, sub:'Antigravity', color:'#6366f1', icon:'🧠' },
          { label:'Workflows n8n', val:totalN8n, sub:`${totalN8n} en portfolio`, color:'#ea580c', icon:'⚡' },
          { label:'Daemons', val:totalDaemon, sub:'siempre activos', color:'#a855f7', icon:'🔮' },
          { label:'Scripts totales', val:totalScripts, sub:'en /scripts dirs', color:'#06b6d4', icon:'📜' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:'center', padding:'14px 10px' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--cs-text)' }}>{s.label}</div>
            <div style={{ fontSize:9, color:'var(--cs-text-muted)', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>

        {/* Project list */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--cs-text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
            Plataformas ({MOCK_PROJECTS.length})
          </div>
          {MOCK_PROJECTS.map(p => {
            const isSel = p.id === selected;
            const wfCount = p.workflows?.length ?? 0;
            const skCount = p.skills?.length ?? 0;
            return (
              <div key={p.id} onClick={() => setSelected(p.id)}
                style={{
                  padding:'10px 12px', borderRadius:9, cursor:'pointer',
                  background: isSel ? 'rgba(99,102,241,0.15)' : '#1e2433',
                  border: isSel ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                  transition:'all 0.15s',
                }}>
                <div style={{ fontSize:11, fontWeight:700, color: isSel ? '#6366f1' : 'var(--cs-text)', marginBottom:4 }}>
                  {p.name}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {wfCount > 0 && (
                    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:'#ea580c20', color:'#ea580c', fontWeight:700 }}>
                      ⚡{wfCount} flows
                    </span>
                  )}
                  {skCount > 0 && (
                    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:'#6366f120', color:'#6366f1', fontWeight:700 }}>
                      🧠{skCount} skills
                    </span>
                  )}
                  {(p.scriptCount ?? 0) > 0 && (
                    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:'#06b6d420', color:'#06b6d4', fontWeight:700 }}>
                      📜{p.scriptCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail area */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Project header */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--cs-text)', marginBottom:4 }}>{project?.name}</div>
                <div style={{ fontSize:10, color:'var(--cs-text-muted)', fontFamily:'monospace', marginBottom:6 }}>{project?.path}</div>
                <div style={{ fontSize:11, color:'var(--cs-text-muted)', lineHeight:1.5 }}>{project?.description}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                {[
                  { label:'Workflows', val:workflows.length, color:'#ea580c' },
                  { label:'Activos', val:activeFlows, color:'#22c55e' },
                  { label:'Skills', val:allSkills.length, color:'#6366f1' },
                  { label:'Scripts', val:project?.scriptCount ?? 0, color:'#06b6d4' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'right' }}>
                    <span style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.val}</span>
                    <span style={{ fontSize:9, color:'var(--cs-text-muted)', marginLeft:4 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Stack tags */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {project?.stack.map(s => (
                <span key={s} style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'rgba(99,102,241,0.12)', color:'#818cf8', fontWeight:600 }}>{s}</span>
              ))}
              {project?.tags.map(t => (
                <span key={t} style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.06)', color:'var(--cs-text-muted)' }}>#{t}</span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {(['workflows','skills'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'6px 16px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
                background: tab===t ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: tab===t ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                color: tab===t ? '#6366f1' : 'var(--cs-text-muted)',
              }}>
                {t === 'workflows' ? `⚡ Workflows (${workflows.length})` : `🧠 Skills (${allSkills.length})`}
              </button>
            ))}
            {tab === 'skills' && (
              <div style={{ display:'flex', gap:6, marginLeft:8 }}>
                {(['all','global','local'] as const).map(f => (
                  <button key={f} onClick={() => setSkillFilter(f)} style={{
                    padding:'4px 10px', borderRadius:14, fontSize:10, fontWeight:700, cursor:'pointer',
                    background: skillFilter===f ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: skillFilter===f ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: skillFilter===f ? '#818cf8' : 'var(--cs-text-muted)',
                  }}>
                    {f === 'all' ? `Todos (${allSkills.length})` : f === 'global' ? `🌐 Global (${globalCount})` : `📍 Local (${localCount})`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Workflows tab */}
          {tab === 'workflows' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {workflows.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:32, color:'var(--cs-text-muted)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>🔌</div>
                  <div style={{ fontSize:12 }}>No hay workflows registrados para esta plataforma.</div>
                  <div style={{ fontSize:10, marginTop:4 }}>Los workflows n8n, daemons y scripts se detectan automáticamente en el escaneo.</div>
                </div>
              ) : workflows.map((wf: ProjectWorkflow) => {
                const sc = STATUS_COLORS[wf.status];
                const pc = PLATFORM_COLORS[wf.platform] ?? '#6b7280';
                return (
                  <div key={wf.file} className="card" style={{ padding:'12px 14px', borderLeft:`3px solid ${pc}` }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--cs-text)' }}>{wf.name}</span>
                          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:`${pc}22`, color:pc, fontWeight:700 }}>
                            {wf.platform.toUpperCase()}
                          </span>
                          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:sc.bg, color:sc.text, fontWeight:700 }}>
                            {sc.label}
                          </span>
                        </div>
                        <div style={{ fontSize:10, color:'var(--cs-text-muted)', marginBottom:6, lineHeight:1.5 }}>{wf.description}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:9, fontFamily:'monospace', color:'#475569' }}>{wf.file}</span>
                          {wf.triggers && wf.triggers.length > 0 && (
                            <div style={{ display:'flex', gap:4 }}>
                              {wf.triggers.map(t => (
                                <span key={t} style={{ fontSize:8, padding:'1px 6px', borderRadius:6, background:'rgba(255,255,255,0.06)', color:'var(--cs-text-muted)' }}>
                                  🔔 {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Script count summary */}
              {(project?.scriptCount ?? 0) > 0 && (
                <div className="card" style={{ padding:'10px 14px', borderLeft:'3px solid #06b6d4', opacity:0.8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>📜</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#06b6d4' }}>{project?.scriptCount} scripts en /scripts/</div>
                      <div style={{ fontSize:10, color:'var(--cs-text-muted)' }}>Scripts Python/Shell detectados en el directorio. Ver detalle en el filesystem.</div>
                    </div>
                  </div>
                </div>
              )}
              {/* Service Access */}
              {services.length > 0 && (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--cs-text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>
                    🔐 Acceso a Servicios
                  </div>
                  {services.map((svc: ServiceAccess) => {
                    const svcColors: Record<string, string> = { n8n:'#ea580c', gcp:'#4285f4', 'cloud-run':'#34a853', stripe:'#635bff', postgres:'#336791', other:'#6b7280' };
                    const sc = svcColors[svc.platform] ?? '#6b7280';
                    const stColors = { reachable:{ bg:'#22c55e20', text:'#22c55e', label:'● Online' }, unreachable:{ bg:'#ef444420', text:'#ef4444', label:'○ Offline' }, unknown:{ bg:'#6b728020', text:'#9ca3af', label:'? Sin verificar' } };
                    const st = stColors[svc.status];
                    return (
                      <div key={svc.url} className="card" style={{ padding:'14px 16px', borderLeft:`3px solid ${sc}`, background:'rgba(0,0,0,0.2)' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                              <span style={{ fontSize:13, fontWeight:800, color:'var(--cs-text)' }}>{svc.name}</span>
                              <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:`${sc}22`, color:sc, fontWeight:700 }}>{svc.platform.toUpperCase()}</span>
                              <span style={{ fontSize:9, padding:'2px 7px', borderRadius:8, background:st.bg, color:st.text, fontWeight:700 }}>{st.label}</span>
                            </div>
                            {/* Clickable URL */}
                            <a href={svc.url} target="_blank" rel="noopener noreferrer"
                              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:6,
                                background:`${sc}15`, border:`1px solid ${sc}40`, color:sc,
                                fontSize:11, fontFamily:'monospace', fontWeight:600, textDecoration:'none', marginBottom:8 }}>
                              🔗 {svc.url}
                            </a>
                            {/* Credential hint */}
                            {svc.credentialHint && (
                              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:6, padding:'8px 10px', border:'1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize:9, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                                  🔑 Credenciales (local only)
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 10px', alignItems:'center' }}>
                                  <span style={{ fontSize:9, color:'var(--cs-text-muted)' }}>Usuario:</span>
                                  <span style={{ fontSize:11, fontFamily:'monospace', color:'#e2e8f0', fontWeight:600 }}>{svc.credentialHint.user}</span>
                                  <span style={{ fontSize:9, color:'var(--cs-text-muted)' }}>Contraseña:</span>
                                  <span style={{ fontSize:11, fontFamily:'monospace', color:'#fbbf24', fontWeight:600 }}>{svc.credentialHint.passwordHint}</span>
                                </div>
                                {svc.credentialHint.note && (
                                  <div style={{ fontSize:9, color:'var(--cs-text-muted)', marginTop:6, lineHeight:1.5, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:6 }}>
                                    {svc.credentialHint.note}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Skills tab */}
          {tab === 'skills' && (
            <div>
              {skills.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:32, color:'var(--cs-text-muted)' }}>
                  <div style={{ fontSize:12 }}>No hay skills con este filtro.</div>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:8 }}>
                  {skills.map((skill: ProjectSkill) => {
                    const cc = CATEGORY_COLORS[skill.category] ?? '#6b7280';
                    const ci = CATEGORY_ICONS[skill.category] ?? '🔧';
                    return (
                      <div key={skill.name} className="card" style={{
                        padding:'10px 12px',
                        borderLeft: `3px solid ${skill.scope === 'global' ? cc : '#ec4899'}`,
                        opacity: skill.scope === 'global' ? 0.88 : 1,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:14 }}>{ci}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:'var(--cs-text)', flex:1 }}>{skill.name}</span>
                          <span style={{ fontSize:8, padding:'1px 6px', borderRadius:6,
                            background: skill.scope === 'global' ? `${cc}20` : '#ec489920',
                            color: skill.scope === 'global' ? cc : '#ec4899',
                            fontWeight:700
                          }}>
                            {skill.scope === 'global' ? '🌐 global' : '📍 local'}
                          </span>
                        </div>
                        <div style={{ fontSize:10, color:'var(--cs-text-muted)', lineHeight:1.4 }}>{skill.description}</div>
                        <div style={{ marginTop:4 }}>
                          <span style={{ fontSize:8, padding:'1px 6px', borderRadius:6, background:`${cc}15`, color:cc }}>
                            {skill.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
