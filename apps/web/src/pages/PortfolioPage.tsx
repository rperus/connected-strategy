import React, { useState, useEffect } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import { ProjectCard } from '../components/ProjectCard';
import { api } from '../config';
import { usePolling } from '../hooks/usePolling';
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

  useEffect(() => {
    let cancelled = false;
    fetch(api.projects)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ ok: boolean; data: Project[] }>;
      })
      .then((body) => {
        if (cancelled) return;
        const liveProjects = body.data ?? [];
        if (liveProjects.length > 0) {
          setProjects(liveProjects);
          setApiState('live');
        } else {
          setProjects(MOCK_PROJECTS);
          setApiState('fallback');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects(MOCK_PROJECTS);
          setApiState('fallback');
        }
      });
    return () => { cancelled = true; };
  }, []);

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
        >
          {scanning ? 'Escaneando…' : '+ Escanear Workspace'}
        </button>
        <button className="btn btn-secondary btn-sm">Importar</button>
      </div>

      {/* Project cards grid */}
      <div className="card-grid card-grid-2">
        {projects.map((p) => {
          const as = analysisState[p.id];
          return (
            <div key={p.id}>
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
                {/* Analysis status indicator */}
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
                >
                  {as?.status === 'running' ? '⟳' : '▶ Analizar'}
                </button>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && apiState !== 'loading' && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div>No hay proyectos. Haz clic en «Escanear Workspace» para descubrir proyectos.</div>
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
