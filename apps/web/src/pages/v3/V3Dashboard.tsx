import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';

import { API_BASE_URL } from '../../config';

export const V3Dashboard: React.FC = () => {
  const { allProjects: projects, activeProject, setActiveProject } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [useGemini, setUseGemini] = useState(false);
  const [skipPhases, setSkipPhases] = useState<string[]>([]);
  const [contextInput, setContextInput] = useState('');
  const [logs, setLogs] = useState<{phase: string, msg: string}[]>([]);

  useEffect(() => {
    if (activeProject?.id) {
      setSelectedProjectId(activeProject.id);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, activeProject, selectedProjectId]);

  useEffect(() => {
    if (runId) {
      const eventSource = new EventSource(`${API_BASE_URL}/api/pipeline/stream/${runId}`);
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setLogs(prev => [...prev, data]);
        if (data.phase === 'DONE' || data.phase === 'FAILED') {
          eventSource.close();
          fetchState();
          setStatus({ status: data.phase === 'DONE' ? 'done' : 'failed' });
        }
      };
      return () => eventSource.close();
    }
  }, [runId]);

  const fetchState = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/state/${selectedProjectId}`);
      const data = await res.json();
      if (data.ok) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchState();
  }, [selectedProjectId]);

  const runV3 = async () => {
    if (!selectedProjectId) return;
    setLogs([]);
    setStatus({ status: 'running' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/run-v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectIds: [selectedProjectId],
          useGemini,
          skipPhases,
          naturalLanguageContext: contextInput || undefined
        })
      });
      const data = await res.json();
      if (data.ok) {
        setRunId(data.runId);
        setContextInput('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSkip = (p: string) => {
    setSkipPhases(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Mega-Professional Control Tower
          </h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Connected Strategy V3 Analysis Pipeline</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 24, marginBottom: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            value={selectedProjectId} 
            onChange={e => {
              setSelectedProjectId(e.target.value);
              const p = projects.find(x => x.id === e.target.value);
              if (p) setActiveProject(p);
            }}
            style={{ padding: '10px 16px', borderRadius: 8, background: '#1f2937', color: 'white', border: '1px solid #374151', fontSize: '1rem', flex: 1, minWidth: 200 }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d1d5db', cursor: 'pointer' }}>
            <input type="checkbox" checked={useGemini} onChange={e => setUseGemini(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#a855f7' }} />
            <span>Enable Gemini (LLM)</span>
          </label>
        </div>

        <div style={{ marginTop: 20, color: '#9ca3af', fontSize: '0.9rem' }}>
          <strong>Skip Phases: </strong>
          {['A','B','C','D','E','F','G'].map(p => (
            <label key={p} style={{ marginLeft: 15, cursor: 'pointer' }}>
              <input type="checkbox" checked={skipPhases.includes(p)} onChange={() => toggleSkip(p)} style={{ accentColor: '#a855f7' }} /> {p}
            </label>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <textarea 
            placeholder="Contexto o eventos recientes (e.g., 'Lanzamos la app móvil, revisa la arquitectura')..."
            value={contextInput} 
            onChange={e => setContextInput(e.target.value)} 
            rows={2} 
            style={{ width: '100%', padding: 16, borderRadius: 8, background: '#111827', border: '1px solid #374151', color: 'white', fontSize: '0.95rem', resize: 'vertical' }}
          />
        </div>

        <button 
          onClick={runV3} 
          disabled={status?.status === 'running'}
          style={{ marginTop: 20, width: '100%', padding: '16px', background: status?.status === 'running' ? '#4b5563' : 'linear-gradient(90deg, #a855f7, #6366f1)', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.1rem', fontWeight: 600, cursor: status?.status === 'running' ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)' }}
        >
          {status?.status === 'running' ? 'Pipeline en Ejecución...' : '🚀 Lanzar Análisis V3'}
        </button>
      </div>

      {status?.status === 'running' && (
        <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20, marginBottom: 30 }}>
          <h3 style={{ marginTop: 0, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, background: '#a855f7', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            Transmisión en Vivo (SSE)
          </h3>
          <div style={{ background: '#111827', padding: 15, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.85rem', color: '#10b981', maxHeight: 200, overflowY: 'auto' }}>
            {logs.map((l, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <span style={{ color: '#6b7280' }}>[{l.phase}]</span> {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {state?.synthesis && status?.status !== 'running' && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: 30, borderRadius: 16, border: '1px solid #4338ca', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
              <h2 style={{ color: '#a5b4fc', fontSize: '1.2rem', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: 2 }}>Health Score</h2>
              <div style={{ fontSize: '4.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                {state.synthesis.healthScore?.value}
                <span style={{ fontSize: '1.5rem', color: '#818cf8', marginLeft: 8 }}>/100</span>
              </div>
            </div>
            <div style={{ background: '#1f2937', padding: 30, borderRadius: 16, border: '1px solid #374151' }}>
              <h2 style={{ color: '#d1d5db', fontSize: '1.2rem', margin: '0 0 20px 0' }}>Three Fits (Wharton Assessment)</h2>
              {['internal', 'external', 'dynamic'].map(fit => {
                const f = (state.synthesis!.threeFits as any)[fit];
                return (
                  <div key={fit} style={{ marginBottom: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <strong style={{ color: 'white', textTransform: 'capitalize' }}>{fit} Fit</strong>
                      <span style={{ color: '#a855f7', fontWeight: 600 }}>{f?.score || 0}/100</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#374151', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ transform: `scaleX(${(f?.score ?? 0) / 100})`, height: '100%', background: 'linear-gradient(90deg, #818cf8, #c084fc)', transformOrigin: 'left' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ background: '#1f2937', padding: 30, borderRadius: 16, border: '1px solid #374151', marginBottom: 24 }}>
            <h2 style={{ color: 'white', margin: '0 0 15px 0' }}>Executive Summary</h2>
            <p style={{ color: '#d1d5db', lineHeight: 1.6, fontSize: '1.05rem' }}>{state.synthesis.executiveSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
};
