import React, { useState, useEffect } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import { ProjectCard } from '../components/ProjectCard';
import { api } from '../config';
import { usePolling } from '../hooks/usePolling';
import useSWR from 'swr';
import type { Project } from '@cs/domain';

type ApiState = 'loading' | 'live' | 'fallback';

interface AnalysisStats {
  total: number;
  queued: number;
  running: number;
  done: number;
  failed: number;
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

export function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiState, setApiState] = useState<ApiState>('loading');
  const [scanning, setScanning] = useState(false);

  // Per-project analysis state: projectId → { status, findings, proposals }
  const [analysisState, setAnalysisState] = useState<Record<string, {
    status: 'idle' | 'running' | 'done' | 'error';
    findings?: number;
    proposals?: number;
    error?: string;
  }>>({});

  // Poll analysis stats every 5s to show queue status
  const { data: stats } = usePolling<AnalysisStats>(api.analysisStats, 5000);

  const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

  const { data: projectsData, error: projectsError, isLoading: projectsLoading } = useSWR<{ ok: boolean; data: Project[] }>(api.projects, fetcher, { fallbackData: { ok: true, data: projects } });

  useEffect(() => {
    if (projectsLoading) {
      setApiState('loading');
    } else if (projectsData?.data && projectsData.data.length > 0) {
      setProjects(projectsData.data);
      setApiState('live');
    } else if (projectsError || (projectsData?.data && projectsData.data.length === 0)) {
      setProjects(MOCK_PROJECTS);
      setApiState('fallback');
    }
  }, [projectsData, projectsError, projectsLoading]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const r = await fetch(api.projectScan, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = await r.json() as { ok: boolean; data: { projects: Project[] } };
      if (body.data?.projects?.length) {
        setProjects(body.data.projects as unknown as Project[]);
        setApiState('live');
      }
    } catch {
      // scan failed — keep existing list
    } finally {
      setScanning(false);
    }
  };

  const handleAnalyzeProject = async (project: Project) => {
    setAnalysisState(prev => ({ ...prev, [project.id]: { status: 'running' } }));
    try {
      const r = await fetch(api.analysisRunAll, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          projectPath: project.path,
          answers: {},
        }),
      });
      const body = await r.json() as RunAllResult;
      if (!r.ok || !body.ok) {
        setAnalysisState(prev => ({
          ...prev,
          [project.id]: { status: 'error', error: body.error ?? `HTTP ${r.status}` },
        }));
      } else if (body.data) {
        const findings = body.data.analystReports.reduce(
          (sum, rpt) => sum + (rpt.findings?.length ?? 0),
          0,
        );
        const proposals = Array.isArray(body.data.proposals?.proposals)
          ? body.data.proposals!.proposals!.length
          : 0;
        setAnalysisState(prev => ({
          ...prev,
          [project.id]: { status: 'done', findings, proposals },
        }));
      }
    } catch (err) {
      setAnalysisState(prev => ({
        ...prev,
        [project.id]: { status: 'error', error: String(err) },
      }));
    }
  };

  // Poll real metrics from API
  const { data: metricsResp } = usePolling<{ ok: boolean; data: Record<string, { strategicAdvantageComposite: number }> }>(
    api.metrics, 10000
  );
  const metricsMap: Record<string, { strategicAdvantageComposite: number }> = metricsResp?.data ?? {};

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">▦ Portfolio de Proyectos</h1>
        <p className="page-subtitle">
          Todos los proyectos analizados por la plataforma
          {apiState === 'live' && <span className="badge badge-success" style={{ marginLeft: 10 }}>API live</span>}
          {apiState === 'fallback' && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Datos de prueba</span>}
          {apiState === 'loading' && <span className="badge badge-cyan" style={{ marginLeft: 10 }}>Cargando…</span>}
          {stats && stats.total > 0 && (
            <span className="badge badge-violet" style={{ marginLeft: 8 }}>
              Cola: {stats.done}✓ {stats.running}⟳ {stats.queued}⏳
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleScan}
          disabled={scanning}
          type="button"
        >
          {scanning ? 'Escaneando…' : '+ Escanear Workspace'}
        </button>
        {/* W1-11: Removed ghost "Importar" button (had no onClick handler — dead UI code) */}
      </div>

      {/* W3-5: Project cards grid with stagger enter animation */}
      <style>{`
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .project-entry { animation: cardEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
      `}</style>
      <div className="card-grid card-grid-2">
        {projects.map((p, i) => {
          const as = analysisState[p.id];
          return (
            <div
              key={p.id}
              className="project-entry"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <ProjectCard
                project={p}
                composite={metricsMap[p.id]?.strategicAdvantageComposite}
              />
              {/* Analysis status row below card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'var(--cs-surface)',
                borderRadius: '0 0 var(--radius) var(--radius)',
                border: '1px solid var(--cs-border)',
                marginTop: -1,
              }}>
                {!as && (
                  <span style={{ fontSize: 11, color: 'var(--cs-text-dim)' }}>Sin análisis</span>
                )}
                {as?.status === 'running' && (
                  <span style={{ fontSize: 11, color: 'var(--cs-accent-hover)' }}>⟳ Analizando…</span>
                )}
                {as?.status === 'done' && (
                  <>
                    <span style={{ fontSize: 11, color: 'var(--cs-success)' }}>✓ Listo</span>
                    <span style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
                      {as.findings} hallazgos · {as.proposals} propuestas
                    </span>
                  </>
                )}
                {as?.status === 'error' && (
                  <span style={{ fontSize: 11, color: 'var(--cs-error)' }} title={as.error}>⚠ Error</span>
                )}

                <button
                  className="btn btn-sm btn-secondary"
                  style={{ marginLeft: 'auto' }}
                  disabled={as?.status === 'running'}
                  onClick={() => handleAnalyzeProject(p)}
                  type="button"
                >
                  {as?.status === 'running' ? '⟳' : '▶ Analizar'}
                </button>
              </div>
            </div>
          );
        })}
        {/* W3-2: Premium empty state — shown when no projects and not loading */}
        {projects.length === 0 && apiState !== 'loading' && (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 32px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
            border: '1px dashed rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <style>{`
              @keyframes float {
                0%,100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
              }
              @keyframes orbitGlow {
                0%,100% { box-shadow: 0 0 40px rgba(99,102,241,0.15); }
                50% { box-shadow: 0 0 80px rgba(139,92,246,0.3); }
              }
            `}</style>
            {/* Orbit ring decoration */}
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 200, height: 200, borderRadius: '50%',
              border: '1px solid rgba(99,102,241,0.12)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -80, left: -40,
              width: 240, height: 240, borderRadius: '50%',
              border: '1px solid rgba(139,92,246,0.08)',
              pointerEvents: 'none',
            }} />

            {/* Floating emoji icon */}
            <div style={{
              fontSize: 56,
              marginBottom: 20,
              animation: 'float 3.5s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.4))',
            }}>
              🛰️
            </div>

            <h2 style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--cs-text)',
              marginBottom: 10,
              letterSpacing: '-0.02em',
            }}>
              Tu Torre de Control está esperando
            </h2>
            <p style={{
              color: 'var(--cs-text-muted)',
              maxWidth: 420,
              margin: '0 auto 28px',
              lineHeight: 1.65,
              fontSize: 14,
            }}>
              Escanea tu workspace local para descubrir proyectos y generar perfiles estratégicos automáticamente con IA.
              O sigue la Guía Rápida para registrar tu primer proyecto en 2 minutos.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={handleScan}
                disabled={scanning}
                type="button"
                style={{ padding: '11px 28px', fontSize: 14, boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}
              >
                {scanning ? '⟳ Escaneando…' : '🔍 Escanear Workspace'}
              </button>
              <a
                href="/quick-start"
                className="btn btn-secondary"
                style={{ padding: '11px 28px', fontSize: 14, textDecoration: 'none' }}
              >
                📖 Guía Rápida →
              </a>
            </div>

            {/* Stats hint */}
            <div style={{ marginTop: 28, display: 'flex', gap: 24, justifyContent: 'center' }}>
              {[
                { emoji: '🏢', label: 'Proyectos', hint: 'Ilimitados en local' },
                { emoji: '🤖', label: 'Agentes IA', hint: '21 especializados' },
                { emoji: '📊', label: 'Frameworks', hint: 'Wharton + Porter + BCG' },
              ].map(({ emoji, label, hint }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cs-text)' }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--cs-text-dim)' }}>{hint}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Queue stats summary */}
      {stats && stats.total > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="section-title">Cola de Análisis</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Total', val: stats.total, color: 'var(--cs-text)' },
              { label: 'En cola', val: stats.queued, color: 'var(--cs-text-muted)' },
              { label: 'Ejecutando', val: stats.running, color: 'var(--cs-accent-hover)' },
              { label: 'Completados', val: stats.done, color: 'var(--cs-success)' },
              { label: 'Fallidos', val: stats.failed, color: 'var(--cs-error)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
