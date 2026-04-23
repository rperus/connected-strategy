import React, { useState, useEffect } from 'react';
import { MOCK_PROJECTS, MOCK_METRICS, MOCK_PROPOSALS } from '../mockData';
import { ScoreGrid } from '../components/ScoreGrid';
import { api } from '../config';
import type { Project, ImprovementProposal } from '@cs/domain';

interface MetricsMap {
  [projectId: string]: {
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
  };
}

export function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [metricsMap, setMetricsMap] = useState<MetricsMap>(MOCK_METRICS);
  const [proposals, setProposals] = useState<ImprovementProposal[]>(MOCK_PROPOSALS);
  const [source, setSource] = useState<'loading' | 'api' | 'mock'>('loading');

  useEffect(() => {
    Promise.all([
      fetch(api.projects).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(api.metrics).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(api.pipelineProposals).then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([projResp, metricsResp, propResp]) => {
      const pData = projResp as { ok: boolean; data?: Project[] };
      const mData = metricsResp as { ok: boolean; data?: MetricsMap };
      const propData = propResp as { ok: boolean; data?: ImprovementProposal[] };

      if (pData.ok && pData.data?.length) setProjects(pData.data);
      if (mData.ok && mData.data) setMetricsMap(mData.data);
      if (propData.ok && propData.data?.length) setProposals(propData.data);
      setSource(mData.ok && mData.data ? 'api' : 'mock');
    });
  }, []);

  const sacToColor = (sac: number) => sac >= 50 ? '#10b981' : sac >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⎙ Reportes</h1>
        <p className="page-subtitle">
          Vista imprimible del portfolio y resumen por proyecto
          {source === 'api' && <span className="badge badge-success" style={{ marginLeft: 10 }}>Datos reales ✓</span>}
          {source === 'mock' && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Datos demo</span>}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
      </div>

      {/* Portfolio Summary */}
      <div className="report-section">
        <h2>Portfolio — Resumen Ejecutivo</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Proyecto</th><th>Madurez</th><th>SAC</th><th>CE</th><th>CL</th><th>SC</th><th>WTP</th><th>BM</th><th>DS</th><th>AR</th></tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const m = metricsMap[p.id];
                const sac = m?.strategicAdvantageComposite ?? 0;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.maturity}</td>
                    <td style={{ fontWeight: 700, color: sacToColor(sac) }}>{Math.round(sac) || '—'}</td>
                    <td>{Math.round(m?.connectedExperienceScore ?? 0) || '—'}</td>
                    <td>{Math.round(m?.closedLoopMaturity ?? 0) || '—'}</td>
                    <td>{Math.round(m?.switchingCostIndex ?? 0) || '—'}</td>
                    <td>{Math.round(m?.wtpUpliftIndex ?? 0) || '—'}</td>
                    <td>{Math.round(m?.businessModelStrength ?? 0) || '—'}</td>
                    <td>{Math.round(m?.dataScienceReadiness ?? 0) || '—'}</td>
                    <td>{Math.round(m?.architectureResilience ?? 0) || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-project detail */}
      {projects.map(p => {
        const m = metricsMap[p.id];
        const projectProposals = proposals.filter(pr => pr.projectId === p.id);
        return (
          <div key={p.id} className="report-section">
            <h2>{p.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', marginBottom: 16 }}>{p.description ?? p.path}</p>
            {m && <ScoreGrid metrics={m as any} />}
            {projectProposals.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  Proposals ({projectProposals.length})
                </div>
                {projectProposals.map(pr => (
                  <div key={pr.id} style={{ marginBottom: 10, padding: 12, border: '1px solid var(--cs-border)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{pr.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>
                      Status: {pr.status} · Risk: {pr.riskLevel} · Type: {pr.changeType}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
