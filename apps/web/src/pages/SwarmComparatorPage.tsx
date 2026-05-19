import React, { useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { API_BASE_URL } from '../config';

export function SwarmComparatorPage() {
  const { activeProject, allProjects } = useProject();
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (allProjects.length > 0 && !targetProjectId) {
      const other = allProjects.find((p: any) => p.id !== activeProject?.id);
      if (other) setTargetProjectId(other.id);
    }
  }, [allProjects, activeProject, targetProjectId]);

  useEffect(() => {
    if (!activeProject?.id || !targetProjectId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/pipeline/v3-swarm-comparator?p1=${activeProject.id}&p2=${targetProjectId}`)
      .then(r => r.json())
      .then(res => {
        if (res.ok) setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeProject?.id, targetProjectId]);

  if (!activeProject) return <div className="page-container">Selecciona un proyecto base primero.</div>;

  const getSeverityColor = (sev: string) => {
    if (sev === 'critical') return '#ef4444';
    if (sev === 'high') return '#f59e0b';
    if (sev === 'medium') return '#3b82f6';
    return '#10b981';
  };

  const getSeverityBg = (sev: string) => {
    if (sev === 'critical') return 'rgba(239, 68, 68, 0.1)';
    if (sev === 'high') return 'rgba(245, 158, 11, 0.1)';
    if (sev === 'medium') return 'rgba(59, 130, 246, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  };

  const renderFinding = (f: any, i: number) => (
    <div key={i} style={{ 
      background: 'var(--cs-surface-2)', 
      border: `1px solid ${getSeverityColor(f.severity)}`, 
      borderLeftWidth: '4px',
      borderRadius: 8, 
      padding: '12px 16px', 
      marginBottom: 12 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ 
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', 
          color: getSeverityColor(f.severity), background: getSeverityBg(f.severity), 
          padding: '2px 8px', borderRadius: 4 
        }}>
          {f.severity}
        </span>
        <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{f.category}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cs-text)', marginBottom: 4 }}>{f.title}</div>
      <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{f.description}</div>
      <div style={{ fontSize: 11, color: 'var(--cs-accent)', background: 'var(--cs-accent-dim)', padding: '6px 10px', borderRadius: 4 }}>
        <strong>Remediación:</strong> {f.remediation}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">⚖️ Swarm Comparator</h1>
          <p className="page-subtitle">Compara los hallazgos del enjambre entre dos proyectos del portfolio</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>Comparar con:</span>
          <select 
            className="ws-input" 
            style={{ width: 250 }}
            value={targetProjectId}
            onChange={(e) => setTargetProjectId(e.target.value)}
          >
            <option value="" disabled>Selecciona un proyecto</option>
            {allProjects.filter((p: any) => p.id !== activeProject.id).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </header>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--cs-text-muted)' }}>Analizando matrices del enjambre...</div>}
      
      {!loading && data && data.comparison && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, position: 'sticky', top: 0, background: 'var(--cs-bg)', paddingBottom: 16, zIndex: 10 }}>
            <div className="card" style={{ textAlign: 'center', borderColor: 'var(--cs-accent)' }}>
              <div style={{ fontSize: 12, color: 'var(--cs-accent)', fontWeight: 700, textTransform: 'uppercase' }}>Proyecto Base</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{data.projects.p1.name}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', borderColor: 'var(--cs-violet)' }}>
              <div style={{ fontSize: 12, color: 'var(--cs-violet)', fontWeight: 700, textTransform: 'uppercase' }}>Proyecto Objetivo</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{data.projects.p2.name}</div>
            </div>
          </div>

          {/* Comparison Rows */}
          {data.comparison.map((row: any, i: number) => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'var(--cs-surface-2)', padding: '12px 20px', borderBottom: '1px solid var(--cs-border)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                🤖 Agent: <span style={{ color: 'var(--cs-accent)' }}>{row.agent.replace(/-/g, ' ').toUpperCase()}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 150 }}>
                {/* Project 1 */}
                <div style={{ padding: 20, borderRight: '1px solid var(--cs-border)' }}>
                  {row.project1.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--cs-text-dim)', fontSize: 12, fontStyle: 'italic' }}>
                      Sin hallazgos reportados
                    </div>
                  ) : (
                    row.project1.map((f: any, idx: number) => renderFinding(f, idx))
                  )}
                </div>
                {/* Project 2 */}
                <div style={{ padding: 20 }}>
                  {row.project2.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--cs-text-dim)', fontSize: 12, fontStyle: 'italic' }}>
                      Sin hallazgos reportados
                    </div>
                  ) : (
                    row.project2.map((f: any, idx: number) => renderFinding(f, idx))
                  )}
                </div>
              </div>
            </div>
          ))}

          {data.comparison.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--cs-text-muted)' }}>
              No hay hallazgos del enjambre para comparar entre estos proyectos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
