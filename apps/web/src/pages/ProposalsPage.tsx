import React, { useState, useEffect } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { api } from '../config';
import { StatusBadge, StrategicFlags, LoopPhasePill } from '../components/Badges';
import { MOCK_PROPOSALS } from '../mockData';
import type { ImprovementProposal } from '@cs/domain';

export function ProposalsPage() {
  const [proposals, setProposals] = useState<ImprovementProposal[]>([]);
  const [source, setSource] = useState<'loading' | 'api' | 'mock'>('loading');
  const [projectIdFilter, setProjectIdFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();

    // Sincronización en vivo (Multiplayer)
    const evtSource = new EventSource(api.telemetryStream);
    evtSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'proposal:updated') {
          // Si otro cliente actualizó una propuesta, refrescamos los datos
          fetchData();
        }
      } catch (e) { }
    };
    
    return () => {
      evtSource.close();
    };
  }, []);

  const fetchData = () => {
    setSource('loading');
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
  };

  const updateStatus = async (proposal: ImprovementProposal, newStatus: string) => {
    // Optimistic update
    setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: newStatus as any } : p));
    try {
      await fetch(`/api/pipeline/proposals/${proposal.projectId}/${proposal.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error('Failed to update status', e);
      fetchData(); // rollback
    }
  };

  const projectIds = [...new Set(proposals.map(p => p.projectId))];
  const filtered = projectIdFilter === 'all' ? proposals : proposals.filter(p => p.projectId === projectIdFilter);

  const columns = [
    { id: 'draft', title: 'Borrador', color: 'var(--cs-text-muted)' },
    { id: 'approved', title: 'Aprobadas', color: '#3b82f6' },
    { id: 'in-progress', title: 'En Curso', color: '#f59e0b' },
    { id: 'implemented', title: 'Implementadas', color: '#10b981' },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">◉ Strategic Kanban</h1>
        <p className="page-subtitle">
          Tablero de ejecución estratégica. Avanza las propuestas desde borradores hasta su implementación final.
          {source === 'api' && <span className="badge badge-success" style={{ marginLeft: 10 }}>Pipeline real ✓ ({proposals.length})</span>}
          {source === 'mock' && <span className="badge badge-warning" style={{ marginLeft: 10 }}>Datos demo</span>}
          {source === 'loading' && <span className="badge badge-cyan" style={{ marginLeft: 10 }}>Cargando…</span>}
        </p>
      </div>

      {projectIds.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <select
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 13, padding: '6px 12px', background: 'var(--cs-surface)', color: 'var(--cs-text)', border: '1px solid var(--cs-border)' }}
            value={projectIdFilter}
            onChange={e => setProjectIdFilter(e.target.value)}
          >
            <option value="all">Todos los proyectos</option>
            {projectIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: 16, 
        alignItems: 'start',
        overflowX: 'auto',
        paddingBottom: 20
      }}>
        {columns.map(col => {
          const colProposals = filtered.filter(p => p.status === col.id);
          return (
            <div key={col.id} style={{ 
              background: 'var(--cs-surface-hover)', 
              borderRadius: 8, 
              padding: 12,
              minHeight: 400
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 16,
                borderBottom: '1px solid var(--cs-border)',
                paddingBottom: 8
              }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: col.color }}>{col.title}</h3>
                <span style={{ fontSize: 12, color: 'var(--cs-text-dim)', background: 'var(--cs-surface)', padding: '2px 8px', borderRadius: 12 }}>
                  {colProposals.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {colProposals.map(p => (
                  <div key={p.id} className="proposal-card" style={{ padding: 12, borderLeft: `3px solid ${col.color}` }}>
                    <div className="proposal-title" style={{ fontSize: 13, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--cs-text-dim)', marginBottom: 8 }}>
                      {p.projectId}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${p.riskLevel === 'high' ? 'error' : p.riskLevel === 'medium' ? 'warning' : 'success'}`} style={{ fontSize: 9 }}>
                        {p.riskLevel}
                      </span>
                      <LoopPhasePill phase={p.strategicMapping.senseTransmitPhase} />
                    </div>

                    <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
                      {col.id === 'draft' && (
                        <>
                          <button type="button" className="btn btn-sm" style={{ background: '#3b82f6', color: 'white', flex: 1 }} onClick={() => updateStatus(p, 'approved')}>Aprobar</button>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => updateStatus(p, 'rejected')}>Rechazar</button>
                        </>
                      )}
                      {col.id === 'approved' && (
                        <>
                          <button type="button" className="btn btn-sm" style={{ background: '#f59e0b', color: 'white', flex: 1 }} onClick={() => updateStatus(p, 'in-progress')}>Iniciar</button>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => updateStatus(p, 'draft')}>Regresar</button>
                        </>
                      )}
                      {col.id === 'in-progress' && (
                        <>
                          <button type="button" className="btn btn-sm" style={{ background: '#10b981', color: 'white', flex: 1 }} onClick={() => updateStatus(p, 'implemented')}>Completar</button>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => updateStatus(p, 'approved')}>Pausar</button>
                        </>
                      )}
                      {col.id === 'implemented' && (
                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, width: '100%', textAlign: 'center' }}>✓ Implementado</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {colProposals.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--cs-text-dim)', fontSize: 12, border: '1px dashed var(--cs-border)', borderRadius: 8 }}>
                    Vacío
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Rejected / Archived area could go here, for now we just filter them out of Kanban */}
    </div>
  );
}
