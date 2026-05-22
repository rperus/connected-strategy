import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_PROJECTS, MOCK_METRICS } from '../mockData';
import { ScoreGrid } from '../components/ScoreGrid';
import { RadarChart } from '../components/RadarChart';
import { StatusBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
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
  const [runningIntel, setRunningIntel] = useState(false);

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
        <EmptyState 
          icon="⚠" 
          title="Proyecto no encontrado" 
          description="El proyecto que buscas no existe o ha sido eliminado." 
          action={{ label: '← Volver', to: '/portfolio' }} 
        />
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
        <Link className="btn btn-ghost btn-sm" to="/portfolio" style={{ textDecoration: 'none', display: 'inline-block' }}>← Portfolio</Link>
        {source === 'api' && <span className="badge badge-success" style={{ marginLeft: 10, fontSize: 10 }}>API ✓</span>}
      </div>
      <div className="page-header">
        <h1 className="page-title">{project.name}</h1>
        <p className="page-subtitle">{project.description ?? project.path}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <StatusBadge status={project.maturity} />
          {project.stack.map(s => <span key={s} className="badge badge-stack">{s}</span>)}
          {project.tags.map(t => <span key={t} className="badge badge-neutral">#{t}</span>)}
          
          <button 
            className="btn btn-primary btn-sm" 
            style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}
            disabled={runningIntel}
            onClick={async () => {
              setRunningIntel(true);
              try {
                const res = await fetch(`/api/pipeline/market-intel/${project.id}`, { method: 'POST' });
                const json = await res.json();
                if (json.ok && json.findings?.length > 0) {
                  alert(`¡Market Intel completado! Encontrados ${json.findings.length} hallazgos nuevos.`);
                  window.location.reload();
                } else {
                  alert('No se encontraron nuevos hallazgos.');
                }
              } catch (e) {
                alert('Error al ejecutar Market Intel');
              }
              setRunningIntel(false);
            }}
          >
            {runningIntel ? 'Buscando en la web...' : '🌍 Run Market Intel'}
          </button>
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
        <EmptyState 
          icon="📊" 
          title="Sin métricas calculadas" 
          description="Corre el pipeline desde Inicio para generar el análisis base de este proyecto." 
        />
      )}

      {tab === 'Worksheets' && (
        <EmptyState 
          icon="✎" 
          title="Worksheets" 
          description="Gestiona las dimensiones estratégicas para este proyecto." 
          action={{ label: 'Abrir editor de Worksheets →', to: `/worksheets?project=${project.id}`, primary: true }} 
        />
      )}

      {tab === 'Findings' && (
        <div>
          {findings.length === 0 ? (
            <EmptyState 
              icon="🔍" 
              title="Sin hallazgos detectados" 
              description="Aún no se han detectado problemas estratégicos. Corre el pipeline para analizar." 
            />
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
        <EmptyState 
          icon="◉" 
          title="Sin Propuestas" 
          description="No hay propuestas estratégicas generadas aún." 
          action={{ label: 'Ver Proposals →', to: '/proposals', primary: true }} 
        />
      )}
    </div>
  );
}
