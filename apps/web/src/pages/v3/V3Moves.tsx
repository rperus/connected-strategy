import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';

import { API_BASE_URL } from '../../config';

export const V3Moves: React.FC = () => {
  const { allProjects: projects, activeProject, setActiveProject } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [moves, setMoves] = useState<any[]>([]);

  useEffect(() => {
    if (activeProject?.id) {
      setSelectedProjectId(activeProject.id);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, activeProject, selectedProjectId]);

  const fetchMoves = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/moves/${selectedProjectId}`);
      const data = await res.json();
      if (data.ok) {
        setMoves(data.moves || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMoves();
  }, [selectedProjectId]);

  const markComplete = async (moveId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/pipeline/context/${selectedProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Completed ${moveId}` })
      });
      alert('Marcado como completado. El próximo análisis V3 lo tendrá en cuenta.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #ec4899, #f43f5e, #f97316)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Antigravity Moves
          </h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Prioridades estratégicas listas para ejecución autónoma</p>
        </div>
        
        <select 
          value={selectedProjectId} 
          onChange={e => {
            setSelectedProjectId(e.target.value);
            const p = projects.find(x => x.id === e.target.value);
            if (p) setActiveProject(p);
          }}
          style={{ padding: '10px 16px', borderRadius: 8, background: '#1f2937', color: 'white', border: '1px solid #374151', fontSize: '1rem', minWidth: 200 }}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {moves.length === 0 ? (
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: 40, textAlign: 'center', borderRadius: 16, border: '1px dashed #374151' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.2rem' }}>No hay moves generados para este proyecto.</p>
          <p style={{ color: '#6b7280' }}>Lanza un Análisis V3 para que el Chief Strategist proponga prioridades.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {moves.map(m => (
            <div key={m.moveId} style={{ background: '#1f2937', border: '1px solid #374151', padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>{m.title}</h3>
                <span style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>{m.moveId}</span>
              </div>
              
              <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>{m.summary}</p>
              
              <div style={{ display: 'flex', gap: 15, margin: '20px 0', padding: '15px 0', borderTop: '1px solid #374151', borderBottom: '1px solid #374151' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Impacto Estimado</div>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>{m.impact}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Esfuerzo</div>
                  <div style={{ color: '#f59e0b', fontWeight: 600 }}>{m.effort}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <button 
                  onClick={() => navigator.clipboard.writeText(`Ejecuta el plan de implementación para la prioridad estratégica utilizando los archivos generados en la ruta: ${m.paths.prompt}`)}
                  style={{ flex: 2, padding: '10px', background: 'linear-gradient(90deg, #ec4899, #f43f5e)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(236, 72, 153, 0.3)' }}
                >
                  Copiar Tarea (Antigravity)
                </button>
                <button 
                  onClick={() => markComplete(m.moveId)}
                  style={{ flex: 1, padding: '10px', background: 'transparent', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  ✓ Completar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
