import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';

const API_BASE_URL = 'http://127.0.0.1:4311';

export const V3Moves: React.FC = () => {
  const { allProjects: projects } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [moves, setMoves] = useState<any[]>([]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const fetchMoves = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/v3-moves/${selectedProjectId}`);
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
      await fetch(`${API_BASE_URL}/api/pipeline/v3-context/${selectedProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Completed ${moveId}` })
      });
      alert('Marked as complete in context history!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Antigravity Moves</h1>
      <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ marginBottom: 20 }}>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {moves.length === 0 ? <p>No moves generated.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {moves.map((m: any) => (
            <div key={m.moveId} style={{ border: '1px solid #ccc', padding: 15, borderRadius: 8 }}>
              <h3>{m.moveId}: {m.title}</h3>
              <p><strong>Impact:</strong> {m.impact} | <strong>Effort:</strong> {m.effort}</p>
              <p>{m.summary}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={() => navigator.clipboard.writeText(`Implement ${m.moveId} using the files in ${m.paths.prompt}`)}>
                  Copy Antigravity Task
                </button>
                <button onClick={() => markComplete(m.moveId)}>Mark Complete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
