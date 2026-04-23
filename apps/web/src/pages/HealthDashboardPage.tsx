import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config';

interface ProjectHealth {
  projectId: string;
  projectName: string;
  path: string;
  maturity: string;
  stack: string[];
  tags: string[];
  sacScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  worksheetsTotal: number;
  worksheetsFilled: number;
  worksheetsCompletion: number;
  findingsByServerity: { high: number; medium: number; low: number };
  totalFindings: number;
  totalProposals: number;
  weakestMetrics: Array<{ name: string; score: number }>;
  strongestMetrics: Array<{ name: string; score: number }>;
  lastAnalyzed: string | null;
  metrics: Record<string, number> | null;
}

interface PortfolioSummary {
  totalProjects: number;
  averageSAC: number;
  portfolioGrade: string;
  totalFindings: number;
  totalProposals: number;
  gradeDistribution: Record<string, number>;
  queueStats: { total: number; queued: number; running: number; done: number; failed: number };
  lastPipelineRun: { timestamp: string; elapsed: string; projectsScanned: number; totalFindings: number; totalProposals: number } | null;
}

interface HealthData {
  portfolio: PortfolioSummary;
  projects: ProjectHealth[];
  generatedAt: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#10b981',
  B: '#22c55e',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

const GRADE_BG: Record<string, string> = {
  A: 'rgba(16,185,129,0.15)',
  B: 'rgba(34,197,94,0.15)',
  C: 'rgba(245,158,11,0.15)',
  D: 'rgba(249,115,22,0.15)',
  F: 'rgba(239,68,68,0.15)',
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: 'var(--cs-surface)', borderRadius: 4, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 50 ? '#10b981' : score >= 30 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 4 }}>
      <span style={{ width: 110, color: 'var(--cs-text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: 'var(--cs-surface)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ width: 28, textAlign: 'right', fontWeight: 600, color }}>{score}</span>
    </div>
  );
}

export function HealthDashboardPage() {
  const nav = useNavigate();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    fetch(api.healthDashboard)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ ok: boolean; data: HealthData; error?: string }>;
      })
      .then(body => {
        if (body.ok && body.data) {
          setData(body.data);
          setError(null);
        } else {
          setError(body.error ?? 'Unknown error');
        }
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHealth(); }, []);

  if (loading && !data) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⟳</div>
          <div style={{ color: 'var(--cs-text-muted)' }}>Calculando salud del portfolio...</div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginTop: 8 }}>
            Escaneando proyectos, corriendo agentes, computando métricas...
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠</div>
          <div style={{ color: '#ef4444' }}>{error}</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchHealth}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { portfolio, projects } = data;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🏥 Salud del Portfolio</h1>
        <p className="page-subtitle">
          Vista ejecutiva de la salud estratégica de todos los proyectos
          <button
            className="btn btn-sm btn-secondary"
            style={{ marginLeft: 12 }}
            onClick={fetchHealth}
            disabled={loading}
          >
            {loading ? '⟳ Actualizando...' : '↻ Refrescar'}
          </button>
        </p>
      </div>

      {/* ─── Portfolio Summary Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {/* Portfolio Grade */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{
            fontSize: 48, fontWeight: 800,
            color: GRADE_COLORS[portfolio.portfolioGrade] ?? '#666',
            lineHeight: 1,
          }}>
            {portfolio.portfolioGrade}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>Grado Portfolio</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cs-accent)', marginTop: 4 }}>
            SAC {portfolio.averageSAC}
          </div>
        </div>

        {/* Projects */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--cs-text)' }}>
            {portfolio.totalProjects}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>Proyectos</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
            {Object.entries(portfolio.gradeDistribution).map(([grade, count]) => (
              count > 0 && (
                <span key={grade} style={{
                  padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: GRADE_BG[grade], color: GRADE_COLORS[grade],
                }}>
                  {count}{grade}
                </span>
              )
            ))}
          </div>
        </div>

        {/* Findings */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>
            {portfolio.totalFindings}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>Hallazgos</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            {(() => {
              const high = projects.reduce((s, p) => s + p.findingsByServerity.high, 0);
              const med = projects.reduce((s, p) => s + p.findingsByServerity.medium, 0);
              const low = projects.reduce((s, p) => s + p.findingsByServerity.low, 0);
              return (
                <>
                  <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>{high} 🔴</span>
                  <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{med} 🟡</span>
                  <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>{low} 🟢</span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Proposals */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#6366f1' }}>
            {portfolio.totalProposals}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>Propuestas</div>
        </div>

        {/* Queue */}
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--cs-text)' }}>
            {portfolio.queueStats.done}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>Jobs Done</div>
          {portfolio.queueStats.failed > 0 && (
            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>
              {portfolio.queueStats.failed} fallidos
            </div>
          )}
        </div>
      </div>

      {/* ─── Project Health Cards ─────────────────────────────────── */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--cs-text)' }}>
        Salud por Proyecto
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {projects.map(p => (
          <div key={p.projectId} className="card" style={{
            padding: '16px 20px',
            borderLeft: `4px solid ${GRADE_COLORS[p.healthGrade]}`,
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {/* Grade badge */}
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: GRADE_BG[p.healthGrade],
                color: GRADE_COLORS[p.healthGrade],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800,
              }}>
                {p.healthGrade}
              </div>

              {/* Name & meta */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'var(--cs-text)' }}
                  onClick={() => nav(`/project/${p.projectId}`)}>
                  {p.projectName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-dim)' }}>
                  {p.maturity} · {p.stack.slice(0, 4).join(', ')}
                  {p.stack.length > 4 && ` +${p.stack.length - 4}`}
                </div>
              </div>

              {/* SAC score */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: GRADE_COLORS[p.healthGrade] }}>
                  {p.sacScore}
                </div>
                <div style={{ fontSize: 10, color: 'var(--cs-text-dim)' }}>SAC</div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
              {/* Findings */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginBottom: 4, fontWeight: 600 }}>
                  Hallazgos ({p.totalFindings})
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {p.findingsByServerity.high > 0 && (
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      {p.findingsByServerity.high} críticos
                    </span>
                  )}
                  {p.findingsByServerity.medium > 0 && (
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                      {p.findingsByServerity.medium} medios
                    </span>
                  )}
                  {p.findingsByServerity.low > 0 && (
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                      {p.findingsByServerity.low} bajos
                    </span>
                  )}
                  {p.totalFindings === 0 && (
                    <span style={{ fontSize: 10, color: 'var(--cs-text-dim)' }}>Sin hallazgos</span>
                  )}
                </div>
              </div>

              {/* Proposals */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginBottom: 4, fontWeight: 600 }}>
                  Propuestas
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.totalProposals > 0 ? '#6366f1' : 'var(--cs-text-dim)' }}>
                  {p.totalProposals > 0 ? `${p.totalProposals} pendientes` : 'Ninguna'}
                </div>
              </div>

              {/* Worksheets */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginBottom: 4, fontWeight: 600 }}>
                  Worksheets ({p.worksheetsFilled}/{p.worksheetsTotal})
                </div>
                <ProgressBar
                  value={p.worksheetsFilled}
                  max={p.worksheetsTotal}
                  color={p.worksheetsCompletion >= 80 ? '#10b981' : p.worksheetsCompletion >= 50 ? '#f59e0b' : '#ef4444'}
                />
                <div style={{ fontSize: 10, color: 'var(--cs-text-dim)', marginTop: 2 }}>
                  {p.worksheetsCompletion}% completado
                </div>
              </div>
            </div>

            {/* Metric bars */}
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--cs-text-muted)', fontWeight: 600, marginBottom: 6 }}>
                Desglose de métricas
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginTop: 8 }}>
                {p.metrics && (
                  <>
                    <ScoreBar label="Connected Exp." score={Math.round((p.metrics as Record<string,number>).connectedExperienceScore ?? 0)} />
                    <ScoreBar label="Closed Loop" score={Math.round((p.metrics as Record<string,number>).closedLoopMaturity ?? 0)} />
                    <ScoreBar label="Switching Costs" score={Math.round((p.metrics as Record<string,number>).switchingCostIndex ?? 0)} />
                    <ScoreBar label="WTP Uplift" score={Math.round((p.metrics as Record<string,number>).wtpUpliftIndex ?? 0)} />
                    <ScoreBar label="Cost Reduction" score={Math.round((p.metrics as Record<string,number>).costReductionPotential ?? 0)} />
                    <ScoreBar label="Competitive Pos." score={Math.round((p.metrics as Record<string,number>).competitivePositioningIndex ?? 0)} />
                    <ScoreBar label="Business Model" score={Math.round((p.metrics as Record<string,number>).businessModelStrength ?? 0)} />
                    <ScoreBar label="Data Science" score={Math.round((p.metrics as Record<string,number>).dataScienceReadiness ?? 0)} />
                    <ScoreBar label="Architecture" score={Math.round((p.metrics as Record<string,number>).architectureResilience ?? 0)} />
                  </>
                )}
              </div>

              {/* Weakest & strongest */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>🔻 Más débiles</div>
                  {p.weakestMetrics.map((m, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
                      {m.name}: <strong style={{ color: '#ef4444' }}>{m.score}</strong>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>🔺 Más fuertes</div>
                  {p.strongestMetrics.map((m, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
                      {m.name}: <strong style={{ color: '#10b981' }}>{m.score}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 11, color: 'var(--cs-text-dim)', textAlign: 'center' }}>
        Generado: {new Date(data.generatedAt).toLocaleString('es-MX')}
      </div>
    </div>
  );
}
