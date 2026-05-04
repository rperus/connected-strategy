import React, { useState, useEffect } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { api } from '../config';
import { StatusBadge, StrategicFlags, LoopPhasePill } from '../components/Badges';
import { MOCK_PROPOSALS } from '../mockData';
import type { ImprovementProposal } from '@cs/domain';

export function ProposalsPage() {
  const [proposals, setProposals] = useState<ImprovementProposal[]>([]);
  const [source, setSource] = useState<'loading' | 'api' | 'mock'>('loading');
  const [filter, setFilter] = useState<string>('Todas');

  useEffect(() => {
    fetch(api.pipelineProposals)
      .then(r => r.json() as Promise<{ ok: boolean; data: ImprovementProposal[] }>)
      .then(body => {
        if (body.ok && body.data?.length > 0) {
          setProposals(body.data);
          setSource('api');
        } else {
          setProposals(MOCK_PROPOSALS);
          setSource('mock');
        }
      })
      .catch(() => {
        setProposals(MOCK_PROPOSALS);
        setSource('mock');
      });
  }, []);

  const statusOrder = ['draft', 'approved', 'implemented', 'rejected', 'archived'];
  const filtered = filter === 'Todas' ? proposals : proposals.filter(p => p.status === filter);
  const sorted = [...filtered].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  // Group by project
  const projectIds = [...new Set(proposals.map(p => p.projectId))];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">◉ Proposals</h1>
        <p className="page-subtitle">
          Propuestas de mejora estratégica con evidencia y criterios de aceptación
          {source === 'api' && <span className="badge badge-success" style={{ marginLeft: 10 }}>Pipeline real ✓ ({proposals.length})</span>}
          {source === 'mock' && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Datos demo</span>}
          {source === 'loading' && <span className="badge badge-cyan" style={{ marginLeft: 10 }}>Cargando…</span>}
        </p>
      </div>
      <ProjectBanner context="Proposals" />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Todas', 'draft', 'approved', 'implemented'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'Todas' ? `Todas (${proposals.length})` : <StatusBadge status={s} />}
          </button>
        ))}

        {/* Project filter */}
        {projectIds.length > 1 && (
          <select
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 11, padding: '4px 8px', background: 'var(--cs-surface)', color: 'var(--cs-text)', border: '1px solid var(--cs-border)' }}
            onChange={e => {
              if (e.target.value === 'all') setFilter('Todas');
              else setFilter(e.target.value);
            }}
          >
            <option value="all">Todos los proyectos</option>
            {projectIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats bar */}
      {source === 'api' && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 20, padding: '10px 16px',
          background: 'rgba(99,102,241,0.08)', borderRadius: 8, fontSize: 12,
        }}>
          <span><strong>{proposals.filter(p => p.status === 'draft').length}</strong> borrador</span>
          <span><strong>{proposals.filter(p => p.riskLevel === 'high').length}</strong> alto riesgo</span>
          <span><strong>{proposals.filter(p => p.requiresHumanApproval).length}</strong> requieren aprobación</span>
          <span><strong>{projectIds.length}</strong> proyectos</span>
        </div>
      )}

      {sorted.map(p => (
        <div key={p.id} className="proposal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="proposal-title">{p.title}</div>
            <StatusBadge status={p.status} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginBottom: 6 }}>
            Proyecto: <strong>{p.projectId}</strong>
            {(p.sourceAgents?.length ?? 0) > 0 && <> · Agentes: {p.sourceAgents!.join(', ')}</>}
          </div>
          <div className="proposal-context">{p.context}</div>

          <StrategicFlags mapping={p.strategicMapping} />

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <LoopPhasePill phase={p.strategicMapping.senseTransmitPhase} />
            <LoopPhasePill phase={p.strategicMapping.recognizeRequestPhase} />
            <span className={`badge badge-${p.riskLevel === 'high' ? 'error' : p.riskLevel === 'medium' ? 'warning' : 'success'}`}>
              Riesgo: {p.riskLevel}
            </span>
            <span className="badge badge-neutral">{p.changeType}</span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 12 }}>
            <strong style={{ color: 'var(--cs-text)' }}>Impacto esperado:</strong> {p.expectedImpact}
          </div>

          {p.acceptanceCriteria.length > 0 && (
            <details style={{ marginBottom: 12 }}>
              <summary style={{ fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                Criterios de aceptación ({p.acceptanceCriteria.length})
              </summary>
              <div style={{ paddingLeft: 12, marginTop: 4 }}>
                {p.acceptanceCriteria.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>✓ {c}</div>
                ))}
              </div>
            </details>
          )}

          <div className="proposal-actions">
            {p.requiresHumanApproval && p.status === 'draft' && (
              <button className="btn btn-success btn-sm">✓ Aprobar</button>
            )}
            <button className="btn btn-secondary btn-sm">Ver detalle</button>
          </div>
        </div>
      ))}

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--cs-text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◉</div>
          <div>No hay propuestas. Corre el pipeline primero.</div>
        </div>
      )}
    </div>
  );
}
