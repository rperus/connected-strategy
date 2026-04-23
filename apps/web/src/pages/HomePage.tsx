import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PROJECTS, MOCK_METRICS } from '../mockData';
import { ScoreGrid } from '../components/ScoreGrid';
import { RadarChart } from '../components/RadarChart';
import { api } from '../config';
import { usePolling } from '../hooks/usePolling';
import type { Project, StrategicMetrics } from '@cs/domain';

interface ProjectsApiResponse {
  ok: boolean;
  data: Project[];
}

interface AnalysisStats {
  total: number;
  queued: number;
  running: number;
  done: number;
  failed: number;
}

interface MetricsApiResponse {
  ok: boolean;
  data: StrategicMetrics;
  meta: { answersUsed: number; source: string };
}

interface MetricsMapResponse {
  ok: boolean;
  data: Record<string, StrategicMetrics>;
}

interface RunAllResult {
  ok: boolean;
  data?: {
    jobIds: string[];
    analystReports: Array<{ findings?: unknown[] }>;
    proposals?: { proposals?: unknown[] };
    stats: AnalysisStats;
  };
  error?: string;
}

export function HomePage() {
  const nav = useNavigate();

  // Analysis trigger state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    findings: number;
    proposals: number;
    jobIds: string[];
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Full pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{
    elapsed: string;
    projectsScanned: number;
    promptPackets: Array<{ projectName: string; promptForAntigravity: string }>;
    log: string[];
  } | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Poll projects every 8s
  const { data: projectsResp, status: projectsStatus } = usePolling<ProjectsApiResponse>(
    api.projects,
    8000,
  );

  // Poll analysis stats every 5s
  const { data: stats, refetch: refetchStats } = usePolling<AnalysisStats>(
    api.analysisStats,
    5000,
  );

  // Poll ALL metrics every 10s (real scores from worksheet answers)
  const { data: metricsMapResp } = usePolling<MetricsMapResponse>(
    api.metrics,
    10000,
  );

  const projects: Project[] =
    projectsStatus === 'live' && projectsResp?.data?.length
      ? projectsResp.data
      : MOCK_PROJECTS;

  // Build metrics map — prefer real API data, fall back to mock
  const liveMetricsMap: Record<string, StrategicMetrics> = metricsMapResp?.data ?? {};
  const hasLiveMetrics = Object.keys(liveMetricsMap).length > 0;

  function getMetrics(projectId: string): StrategicMetrics {
    if (hasLiveMetrics && liveMetricsMap[projectId]) return liveMetricsMap[projectId];
    // Try to match by name (live projects may have different IDs from mock)
    const liveEntry = Object.values(liveMetricsMap).find((m) => m.projectId === projectId);
    if (liveEntry) return liveEntry;
    return MOCK_METRICS[projectId] ?? MOCK_METRICS[MOCK_PROJECTS[0].id];
  }

  const firstProject = projects[0] ?? MOCK_PROJECTS[0];
  const metrics = getMetrics(firstProject.id);

  const radarData: Record<string, number> = {
    CE: metrics.connectedExperienceScore,
    CL: metrics.closedLoopMaturity,
    SC: metrics.switchingCostIndex,
    WTP: metrics.wtpUpliftIndex,
    CR: metrics.costReductionPotential,
    CP: metrics.competitivePositioningIndex,
    BM: metrics.businessModelStrength,
    DS: metrics.dataScienceReadiness,
    AR: metrics.architectureResilience,
    SAC: metrics.strategicAdvantageComposite,
  };

  async function handleAnalyzeAll() {
    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const r = await fetch(api.analysisRunAll, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: firstProject.id,
          projectPath: firstProject.path,
          answers: {},
        }),
      });
      const body = await r.json() as RunAllResult;
      if (!r.ok || !body.ok) {
        setAnalysisError(body.error ?? `HTTP ${r.status}`);
      } else if (body.data) {
        const findings = body.data.analystReports.reduce(
          (sum, rpt) => sum + (rpt.findings?.length ?? 0),
          0,
        );
        const proposals = Array.isArray(body.data.proposals?.proposals)
          ? body.data.proposals!.proposals!.length
          : 0;
        setAnalysisResult({ findings, proposals, jobIds: body.data.jobIds });
        refetchStats();
      }
    } catch (err) {
      setAnalysisError(String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePipelineFull() {
    setPipelineRunning(true);
    setPipelineResult(null);
    setPipelineError(null);
    try {
      const r = await fetch(api.pipelineRunFull, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanPath: 'C:\\dev' }),
      });
      const body = await r.json() as { ok: boolean; data?: { elapsed: string; projectsScanned: number; promptPackets: Array<{ projectName: string; promptForAntigravity: string }>; log: string[] }; error?: string };
      if (!r.ok || !body.ok) {
        setPipelineError(body.error ?? `HTTP ${r.status}`);
      } else if (body.data) {
        setPipelineResult(body.data);
        refetchStats();
      }
    } catch (err) {
      setPipelineError(String(err));
    } finally {
      setPipelineRunning(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⌂ Torre de Control Estratégica</h1>
        <p className="page-subtitle">
          Sense → Transmit → Analyze → React → Repeat &nbsp;|&nbsp;
          Recognize → Request → Respond → Repeat
          {projectsStatus === 'live' && <span className="badge badge-success" style={{ marginLeft: 10 }}>API live</span>}
          {projectsStatus === 'error' && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Demo mode</span>}
          {projectsStatus === 'loading' && <span className="badge badge-cyan" style={{ marginLeft: 10 }}>Conectando…</span>}
          {hasLiveMetrics && <span className="badge badge-violet" style={{ marginLeft: 8 }}>Métricas reales ✓</span>}
          {stats && stats.total > 0 && (
            <span className="badge badge-cyan" style={{ marginLeft: 8 }}>
              Jobs: {stats.done}✓ {stats.running > 0 ? `${stats.running}⟳` : ''} {stats.queued > 0 ? `${stats.queued}⏳` : ''} {stats.failed > 0 ? `${stats.failed}✗` : ''}
            </span>
          )}
        </p>
      </div>

      {/* Project quick-select + Analyze button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {projects.map((p) => (
          <button key={p.id} className="btn btn-secondary" onClick={() => nav(`/project/${p.id}`)}>
            {p.name} →
          </button>
        ))}
        <button
          className="btn btn-primary"
          onClick={handleAnalyzeAll}
          disabled={analyzing}
          style={{ marginLeft: 'auto' }}
        >
          {analyzing ? '⟳ Analizando…' : '▶ Analizar + IA'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handlePipelineFull}
          disabled={pipelineRunning || analyzing}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' }}
        >
          {pipelineRunning ? '⟳ Pipeline…' : '🚀 Pipeline Completo'}
        </button>
      </div>

      {/* Pipeline running */}
      {pipelineRunning && (
        <div style={{
          marginBottom: 20, padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))',
          border: '1px solid #10b981', borderRadius: 'var(--radius-sm)',
          fontSize: 13, color: '#10b981',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🚀</span>
            <strong>Pipeline ejecutándose…</strong>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
            Escaneando C:\dev → Llenando worksheets → Analizando → Generando prompts
          </div>
        </div>
      )}

      {/* Pipeline results with prompt packets */}
      {pipelineResult && !pipelineRunning && (
        <div style={{
          marginBottom: 20, padding: '16px 20px',
          background: 'rgba(16,185,129,0.08)', border: '1px solid #10b981',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#10b981' }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <strong>Pipeline completado en {pipelineResult.elapsed}</strong>
            <span style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>
              {pipelineResult.projectsScanned} proyectos · {pipelineResult.promptPackets.length} prompts generados
            </span>
          </div>

          {pipelineResult.promptPackets.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--cs-text)' }}>
                📋 Prompts para Antigravity — copia y pega:
              </div>
              {pipelineResult.promptPackets.map((pkt, i) => (
                <details key={i} style={{ marginBottom: 8 }}>
                  <summary style={{
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--cs-accent)',
                    padding: '6px 0',
                  }}>
                    {pkt.projectName}
                  </summary>
                  <div style={{ position: 'relative' }}>
                    <pre style={{
                      background: 'var(--cs-bg-secondary)', padding: 12, borderRadius: 6,
                      fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                      border: '1px solid var(--cs-border)', maxHeight: 300, overflow: 'auto',
                      color: 'var(--cs-text)',
                    }}>
                      {pkt.promptForAntigravity}
                    </pre>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ position: 'absolute', top: 6, right: 6, fontSize: 10 }}
                      onClick={() => {
                        navigator.clipboard.writeText(pkt.promptForAntigravity);
                      }}
                    >
                      📋 Copiar
                    </button>
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* Log */}
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 11, color: 'var(--cs-text-muted)', cursor: 'pointer' }}>
              Ver log del pipeline ({pipelineResult.log.length} líneas)
            </summary>
            <pre style={{
              fontSize: 10, color: 'var(--cs-text-dim)', marginTop: 6,
              maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap',
            }}>
              {pipelineResult.log.join('\n')}
            </pre>
          </details>
        </div>
      )}

      {pipelineError && !pipelineRunning && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
          borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#ef4444',
        }}>
          ⚠ Pipeline error: {pipelineError}
        </div>
      )}

      {/* Analysis status panel */}
      {analyzing && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(99,102,241,0.1)', border: '1px solid var(--cs-accent)',
          borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--cs-accent-hover)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⟳</span>
          <span>Ejecutando análisis con Gemini AI para <strong>{firstProject.name}</strong>…</span>
        </div>
      )}

      {analysisResult && !analyzing && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'var(--cs-success-dim)', border: '1px solid var(--cs-success)',
          borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--cs-success)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span>✓ Análisis + IA completado</span>
          <span><strong>{analysisResult.findings}</strong> hallazgos</span>
          <span><strong>{analysisResult.proposals}</strong> propuestas</span>
          <button className="btn btn-ghost btn-sm"
            style={{ padding: 0, textDecoration: 'underline', color: 'var(--cs-success)' }}
            onClick={() => nav('/proposals')}>
            Ver propuestas →
          </button>
        </div>
      )}

      {analysisError && !analyzing && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
          borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#ef4444',
        }}>
          ⚠ Error: {analysisError}
        </div>
      )}

      {/* Score dashboard */}
      <div className="section-title">
        📊 Métricas Estratégicas — {firstProject.name}
        {hasLiveMetrics && liveMetricsMap[firstProject.id]
          ? <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--cs-success)', fontWeight: 400 }}>• datos reales</span>
          : <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--cs-text-muted)', fontWeight: 400 }}>• demo (completa worksheets para datos reales)</span>
        }
      </div>
      <ScoreGrid metrics={metrics} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28 }}>
        {/* Radar */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Radar Estratégico</div>
          <RadarChart metrics={radarData} size={280} />
        </div>

        {/* Loop phases */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Estado de Loops</div>
          {[
            { phase: 'Sense', score: metrics.closedLoopMaturity, desc: 'Calidad de señales capturadas' },
            { phase: 'Transmit', score: metrics.dataScienceReadiness, desc: 'Cobertura de pipeline de datos' },
            { phase: 'Analyze', score: metrics.competitivePositioningIndex, desc: 'Profundidad de análisis' },
            { phase: 'React', score: metrics.connectedExperienceScore, desc: 'Velocidad de respuesta' },
          ].map(({ phase, score, desc }) => (
            <div key={phase} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className={`loop-phase phase-${phase.toLowerCase()}`}>{phase}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{score.toFixed(0)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginBottom: 4 }}>{desc}</div>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${score}%`, background: 'var(--cs-accent)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects summary */}
      <div style={{ marginTop: 28 }}>
        <div className="section-title">Portfolio Rápido</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Proyecto</th><th>Madurez</th><th>SAC</th><th>CE</th><th>BM</th><th>DS</th><th>Fuente</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const m = getMetrics(p.id);
                const isReal = hasLiveMetrics && !!liveMetricsMap[p.id];
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className={`badge badge-${p.maturity === 'mature' ? 'success' : p.maturity === 'developing' ? 'cyan' : 'warning'}`}>{p.maturity}</span></td>
                    <td style={{ fontWeight: 700 }}>{m?.strategicAdvantageComposite?.toFixed(0) ?? '—'}</td>
                    <td>{m?.connectedExperienceScore?.toFixed(0) ?? '—'}</td>
                    <td>{m?.businessModelStrength?.toFixed(0) ?? '—'}</td>
                    <td>{m?.dataScienceReadiness?.toFixed(0) ?? '—'}</td>
                    <td><span className={`badge badge-${isReal ? 'success' : 'warning'}`} style={{ fontSize: 10 }}>{isReal ? 'real' : 'demo'}</span></td>
                    <td><button className="btn btn-sm btn-secondary" onClick={() => nav(`/project/${p.id}`)}>Ver →</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
