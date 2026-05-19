import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_PROJECTS } from '../mockData';
import { api } from '../config';

type ProjectStatus = 'unknown' | 'running' | 'stopped';

const CATEGORY_COLORS: Record<string, string> = {
  'b2b': '#6366f1',
  'procurement': '#6366f1',
  'saas': '#6366f1',
  'strategy': '#22c55e',
  'control-tower': '#22c55e',
  'personal-os': '#f59e0b',
  'health': '#ec4899',
  'youtube': '#ef4444',
  'automation': '#ef4444',
  'demo': '#8b5cf6',
  'grants': '#14b8a6',
};

function getProjectColor(tags: string[]): string {
  for (const tag of tags) {
    if (CATEGORY_COLORS[tag]) return CATEGORY_COLORS[tag];
  }
  return '#6366f1';
}

function getProjectIcon(tags: string[]): string {
  if (tags.includes('procurement') || tags.includes('b2b')) return '⚡';
  if (tags.includes('strategy') || tags.includes('control-tower')) return '🧭';
  if (tags.includes('health')) return '❤️';
  if (tags.includes('personal-os')) return '🧬';
  if (tags.includes('youtube') || tags.includes('cashcow')) return '▶️';
  if (tags.includes('demo')) return '🎯';
  if (tags.includes('grants')) return '🏆';
  return '📁';
}

function MaturityBadge({ maturity }: { maturity: string }) {
  const colors: Record<string, string> = {
    nascent: '#f59e0b',
    developing: '#6366f1',
    mature: '#22c55e',
    legacy: '#6b7280',
  };
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: colors[maturity] ?? '#6b7280',
      background: (colors[maturity] ?? '#6b7280') + '22',
      borderRadius: 4,
      padding: '2px 6px',
    }}>
      {maturity}
    </span>
  );
}

export function LauncherPage() {
  const [launching, setLaunching] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus>>({});
  const [toast, setToast] = useState('');

  // Ping health URLs every 10s to detect running projects
  const checkStatuses = useCallback(async () => {
    const updates: Record<string, ProjectStatus> = {};
    await Promise.all(
      MOCK_PROJECTS.map(async (p) => {
        if (!p.healthUrl) {
          updates[p.id] = 'unknown';
          return;
        }
        try {
          const res = await fetch(p.healthUrl, { signal: AbortSignal.timeout(1500) });
          updates[p.id] = res.ok ? 'running' : 'stopped';
        } catch {
          updates[p.id] = 'stopped';
        }
      })
    );
    setStatuses(updates);
  }, []);

  useEffect(() => {
    checkStatuses();
    const interval = setInterval(checkStatuses, 10_000);
    return () => clearInterval(interval);
  }, [checkStatuses]);

  async function handleLaunch(id: string, name: string, launcherScript?: string) {
    setLaunching(id);
    try {
      const res = await fetch(api.projectLaunch(id), { method: 'POST' });
      if (res.ok) {
        const action = launcherScript === 'code' ? `Abriendo VS Code para ${name}...` : `Lanzando ${name}...`;
        setToast(action);
        // Re-check status after 4s
        setTimeout(checkStatuses, 4000);
      } else {
        // Fallback: if API server is down, try to open via browser link
        setToast(`API no disponible — lanza el script manualmente en tu workspace`);
      }
    } catch {
      setToast(`Servidor API caído. Reinicia Connected Strategy.bat primero.`);
    }
    setLaunching(null);
    setTimeout(() => setToast(''), 4000);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚡ Launcher</h1>
        <p className="page-subtitle">Lanza cualquier proyecto desde aquí — sin buscar carpetas</p>
      </div>

      <div className="launcher-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {MOCK_PROJECTS.map(p => {
          const color = getProjectColor(p.tags);
          const icon = getProjectIcon(p.tags);
          const status = statuses[p.id] ?? 'unknown';
          const isLaunching = launching === p.id;
          const isVsCode = p.launcherScript === 'code' || !p.launcherScript;

          return (
            <div
              key={p.id}
              className="launcher-card"
              style={{ borderColor: color + '55', borderTop: `3px solid ${color}` }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 24 }}>{icon}</div>
                <MaturityBadge maturity={p.maturity} />
              </div>

              {/* Name + path */}
              <div className="launcher-card-name" style={{ color, marginBottom: 2 }}>{p.name}</div>
              <div className="launcher-card-path" style={{ marginBottom: 8 }}>{p.path}</div>

              {/* Description */}
              {p.description && (
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                  {p.description}
                </div>
              )}

              {/* Stack badges */}
              <div className="stack-badges" style={{ marginBottom: 12 }}>
                {p.stack.slice(0, 3).map(s => <span key={s} className="badge badge-stack">{s}</span>)}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className={`status-dot ${
                  status === 'running' ? 'status-running' :
                  status === 'stopped' ? 'status-stopped' : 'status-stopped'
                }`} style={status === 'running' ? { background: '#22c55e', boxShadow: '0 0 6px #22c55e88' } : {}} />
                <span style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
                  {status === 'running' ? '● Ejecutándose' : status === 'stopped' ? 'Detenido' : 'Estado desconocido'}
                </span>
              </div>

              {/* Launch button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', background: isLaunching ? undefined : color, border: `1px solid ${color}` }}
                disabled={isLaunching}
                onClick={() => handleLaunch(p.id, p.name, p.launcherScript)}
              >
                {isLaunching
                  ? '⏳ Lanzando...'
                  : isVsCode
                  ? '📂 Abrir en VS Code'
                  : status === 'running'
                  ? '🌐 Abrir en navegador'
                  : '⚡ Launch'}
              </button>
            </div>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
