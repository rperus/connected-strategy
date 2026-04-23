import React, { useState } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import { api } from '../config';

export function LauncherPage() {
  const [launching, setLaunching] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  async function handleLaunch(id: string, name: string) {
    setLaunching(id);
    try {
      const res = await fetch(api.projectLaunch(id), { method: 'POST' });
      if (res.ok) {
        setToast(`Lanzando ${name}...`);
      } else {
        setToast(`API no disponible — SET-03 en construcción`);
      }
    } catch {
      setToast(`Servidor no disponible. Inicia el API server (puerto 4311).`);
    }
    setLaunching(null);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚡ Launcher</h1>
        <p className="page-subtitle">Lanza proyectos locales sin colisiones de puerto</p>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--cs-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--cs-text-muted)', borderLeft: '3px solid #f59e0b' }}>
        El runtime de lanzamiento está disponible en <code style={{ color: 'var(--cs-accent-hover)' }}>http://127.0.0.1:4311/api/runtime/ports</code>.
        SET-03 (Analysis Orchestrator) implementa el endpoint de lanzamiento.
      </div>

      <div className="launcher-grid">
        {MOCK_PROJECTS.map(p => (
          <div key={p.id} className="launcher-card">
            <div className="launcher-card-name">{p.name}</div>
            <div className="launcher-card-path">{p.path}</div>
            <div className="stack-badges" style={{ marginBottom: 14 }}>
              {p.stack.slice(0, 3).map(s => <span key={s} className="badge badge-stack">{s}</span>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className="status-dot status-stopped" />
              <span style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>Detenido</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={launching === p.id}
              onClick={() => handleLaunch(p.id, p.name)}
            >
              {launching === p.id ? '⏳ Lanzando...' : '⚡ Launch'}
            </button>
          </div>
        ))}

        {/* External tools */}
        {[
          { id: 'codex', name: 'Codex', desc: 'Plan de implementación multiarchivo', color: '#22c55e' },
          { id: 'antigravity', name: 'Antigravity', desc: 'Ejecución directa de mejoras', color: '#6366f1' },
        ].map(tool => (
          <div key={tool.id} className="launcher-card" style={{ borderColor: tool.color + '44' }}>
            <div className="launcher-card-name" style={{ color: tool.color }}>{tool.name}</div>
            <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 14 }}>{tool.desc}</div>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Abrir herramienta</button>
          </div>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
