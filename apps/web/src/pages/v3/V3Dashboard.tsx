import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';

const API_BASE_URL = 'http://127.0.0.1:4311';

export const V3Dashboard: React.FC = () => {
  const { allProjects: projects } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [useGemini, setUseGemini] = useState(false);
  const [skipPhases, setSkipPhases] = useState<string[]>([]);
  const [contextInput, setContextInput] = useState('');

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    let interval: any;
    if (runId && status?.status === 'running') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/pipeline/v3-status/${runId}`);
          const data = await res.json();
          if (data.ok && data.run) {
            setStatus(data.run);
            if (data.run.status !== 'running') {
              fetchState();
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [runId, status]);

  const fetchState = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/v3-state/${selectedProjectId}`);
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
    try {
      setStatus({ status: 'running' });
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
    <div style={{ padding: 20 }}>
      <h1>V3 Intelligence Pipeline</h1>
      
      <div style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label><input type="checkbox" checked={useGemini} onChange={e => setUseGemini(e.target.checked)} /> Use Gemini (LLM)</label>
        <div>
          Skip: 
          {['A','B','C','D','E','F','G'].map(p => (
            <label key={p} style={{ marginLeft: 10 }}>
              <input type="checkbox" checked={skipPhases.includes(p)} onChange={() => toggleSkip(p)} /> {p}
            </label>
          ))}
        </div>
        <button onClick={runV3} disabled={status?.status === 'running'}>Run V3 Analysis</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <textarea 
          placeholder="Natural language context (e.g., 'Competitor X just launched Y')"
          value={contextInput} 
          onChange={e => setContextInput(e.target.value)} 
          rows={3} 
          style={{ width: '100%', maxWidth: 600 }}
        />
      </div>

      {status && (
        <div style={{ padding: 10, background: '#f0f0f0', marginBottom: 20 }}>
          Status: <strong>{status.status}</strong> {runId}
        </div>
      )}

      {state?.synthesis ? (
        <div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, flex: 1 }}>
              <h2>Health Score</h2>
              <h1 style={{ margin: 0 }}>{state.synthesis.healthScore?.value} <small style={{ fontSize: '0.5em', color: '#666' }}>±{(state.synthesis.healthScore?.ci[1] - state.synthesis.healthScore?.value) || 0}</small></h1>
            </div>
            <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, flex: 2 }}>
              <h2>Three Fits</h2>
              {['internal', 'external', 'dynamic'].map(fit => {
                const f = (state.synthesis!.threeFits as any)[fit];
                return (
                  <div key={fit}>
                    <strong>{fit}</strong>: {f.score}/100 — {f.justification}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, marginBottom: 20 }}>
            <h2>Executive Summary</h2>
            <p>{state.synthesis.executiveSummary}</p>
          </div>

          <h2>Top Priorities (Handoff)</h2>
          <ul>
            {state.synthesis.topPriorities.map((p: any) => (
              <li key={p.priorityId}>
                <strong>{p.title}</strong> (Impact: {p.estimatedImpact}, Effort: {p.estimatedEffort})
                <p>{p.summary}</p>
                <button onClick={() => navigator.clipboard.writeText(p.antigravityPromptHint)}>Copy Prompt Hint</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No synthesis state available for this project. Run the pipeline.</p>
      )}
    </div>
  );
};
