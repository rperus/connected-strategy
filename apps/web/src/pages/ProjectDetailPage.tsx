import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PROJECTS, MOCK_METRICS } from '../mockData';
import { ScoreGrid } from '../components/ScoreGrid';
import { RadarChart } from '../components/RadarChart';
import { StatusBadge } from '../components/Badges';
import { api } from '../config';
import type { Project } from '@cs/domain';

const TABS = ['Resumen', 'Worksheets', 'Findings', 'Proposals'];

interface MetricsData {
  strategicAdvantageComposite: number;
  connectedExperienceScore: number;
  closedLoopMaturity: number;
  switchingCostIndex: number;
  wtpUpliftIndex: number;
  costReductionPotential: number;
  competitivePositioningIndex: number;
  businessModelStrength: number;
  dataScienceReadiness: number;
  architectureResilience: number;
  strategicAdvantageBreakdown: { rationale: string };
  calculatedAt: string;
  calculationVersion: string;
}

interface Finding {
  projectId: string;
  projectName: string;
  agentId: string;
  finding: {
    category: string;
    title: string;
    detail: string;
    severity: 'high' | 'medium' | 'low';
    loopPhase: string;
    impactOnWTP: string;
    impactOnCost: string;
    impactOnSwitchingCosts: string;
  };
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [tab, setTab] = useState('Resumen');
  const [project, setProject] = useState<Project | undefined>();
  const [metrics, setMetrics] = useState<MetricsData | undefined>();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [source, setSource] = useState<'loading' | 'api' | 'mock'>('loading');

  useEffect(() => {
    if (!id) return;

    // Try to load real project data
    Promise.all([
      fetch(api.projectById(id)).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(api.metricsForProject(id)).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(api.pipelineFindings).then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([projResp, metricsResp, findingsResp]) => {
      const pData = projResp as { ok: boolean; data?: Project };
      const mData = metricsResp as { ok: boolean; data?: MetricsData };
      const fData = findingsResp as { ok: boolean; data?: Finding[] };

      if (pData.ok && pData.data) {
        setProject(pData.data);
        setSource('api');
      } else {
        setProject(MOCK_PROJECTS.find(p => p.id === id));
        setSource('mock');
      }

      if (mData.ok && mData.data) {
        setMetrics(mData.data);
      } else {
        setMetrics(MOCK_METRICS[id!]);
      }

      if (fData.ok && fData.data) {
        setFindings(fData.data.filter(f => f.projectId === id));
      }
    });
  }, [id]);

  if (source === 'loading') {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--cs-text-muted)' }}>Cargando...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">⚠</div>
          <div className="empty-state-msg">Proyecto no encontrado. <button className="btn btn-ghost" onClick={() => nav('/portfolio')}>← Volver</button></div>
        </div>
      </div>
    );
  }

  const radarData: Record<string, number> = metrics ? {
    CE: metrics.connectedExperienceScore, CL: metrics.closedLoopMaturity,
    SC: metrics.switchingCostIndex, WTP: metrics.wtpUpliftIndex,
    CR: metrics.costReductionPotential, CP: metrics.competitivePositioningIndex,
    BM: metrics.businessModelStrength, DS: metrics.dataScienceReadiness,
    AR: metrics.architectureResilience, SAC: metrics.strategicAdvantageComposite,
  } : {};

  const severityColor = (s: string) => s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#10b981';
  const severityBg = (s: string) => s === 'high' ? 'rgba(239,68,68,0.1)' : s === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';

  return (
    <div className="page-container">
      <div style={{ marginBottom: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/portfolio')}>← Portfolio</button>
        {source === 'api' && <span className="badge badge-success" style={{ marginLeft: 10, fontSize: 10 }}>API ✓</span>}
      </div>
      <div className="page-header">
        <h1 className="page-title">{project.name}</h1>
        <p className="page-subtitle">{project.description ?? project.path}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <StatusBadge status={project.maturity} />
          {project.stack.map(s => <span key={s} className="badge badge-stack">{s}</span>)}
          {project.tags.map(t => <span key={t} className="badge badge-neutral">#{t}</span>)}
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
            {t === 'Findings' && findings.length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 10, color: '#f59e0b' }}>({findings.length})</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Resumen' && metrics && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 24 }}>
            <div>
              <div className="section-title">Métricas Estratégicas</div>
              <ScoreGrid metrics={metrics as any} />
            </div>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Radar</div>
              <RadarChart metrics={radarData} size={240} />
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{Math.round(metrics.strategicAdvantageComposite)}</span>
                <span style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginLeft: 6 }}>SAC</span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Breakdown — Ventaja Estratégica Compuesta</div>
            <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', lineHeight: 1.7 }}>
              {metrics.strategicAdvantageBreakdown?.rationale ?? 'Ejecuta el pipeline para obtener un análisis detallado.'}
            </p>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--cs-text-dim)' }}>
              Calculado: {metrics.calculatedAt ? new Date(metrics.calculatedAt).toLocaleString('es-MX') : 'N/A'}
              {metrics.calculationVersion && ` · v${metrics.calculationVersion}`}
            </div>
          </div>
        </div>
      )}

      {tab === 'Resumen' && !metrics && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-msg">Sin métricas. Corre el pipeline desde Inicio.</div>
        </div>
      )}

      {tab === 'Worksheets' && (
        <div className="empty-state">
          <div className="empty-state-icon">✎</div>
          <div className="empty-state-msg">
            <button className="btn btn-primary" onClick={() => nav(`/worksheets?project=${project.id}`)}>
              Abrir editor de Worksheets →
            </button>
          </div>
        </div>
      )}

      {tab === 'Findings' && (
        <div>
          {findings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-msg">Sin hallazgos. Corre el pipeline primero.</div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 12 }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>
                  🔴 {findings.filter(f => f.finding.severity === 'high').length} críticos
                </span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                  🟡 {findings.filter(f => f.finding.severity === 'medium').length} medios
                </span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  🟢 {findings.filter(f => f.finding.severity === 'low').length} bajos
                </span>
              </div>

              {/* Findings list */}
              {findings
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return (order[a.finding.severity] ?? 3) - (order[b.finding.severity] ?? 3);
                })
                .map((f, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', marginBottom: 8, borderRadius: 8,
                    background: severityBg(f.finding.severity),
                    borderLeft: `3px solid ${severityColor(f.finding.severity)}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{f.finding.title}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                          color: severityColor(f.finding.severity),
                          background: 'rgba(0,0,0,0.1)',
                        }}>
                          {f.finding.severity}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--cs-text-dim)', padding: '2px 6px' }}>
                          {f.agentId.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', lineHeight: 1.5 }}>
                      {f.finding.detail}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: 'var(--cs-text-dim)' }}>
                      <span>📂 {f.finding.category}</span>
                      <span>🔄 {f.finding.loopPhase}</span>
                      <span>WTP: {f.finding.impactOnWTP}</span>
                      <span>Cost: {f.finding.impactOnCost}</span>
                    </div>
                  </div>
                ))
              }
            </>
          )}
        </div>
      )}

      {tab === 'Proposals' && (
        <div className="empty-state">
          <div className="empty-state-icon">◉</div>
          <div className="empty-state-msg">
            <button className="btn btn-primary" onClick={() => nav('/proposals')}>Ver Proposals →</button>
          </div>
        </div>
      )}
    </div>
  );
}
