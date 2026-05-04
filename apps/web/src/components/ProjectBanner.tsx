/**
 * ProjectBanner — Always shows the active project context at the top of every analysis page.
 * Lets the user know instantly which project they're analyzing.
 */
import React from 'react';
import { useProject } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';

const MATURITY_COLOR: Record<string, string> = {
  nascent: '#f59e0b',
  developing: '#6366f1',
  mature: '#22c55e',
  legacy: '#6b7280',
};

const MATURITY_LABEL: Record<string, string> = {
  nascent: 'Incipiente',
  developing: 'En desarrollo',
  mature: 'Maduro',
  legacy: 'Legado',
};

interface Props {
  /** Optional override for what this page is showing (e.g. "Análisis estratégico") */
  context?: string;
}

export function ProjectBanner({ context }: Props) {
  const { activeProject, allProjects, setActiveProject } = useProject();
  const navigate = useNavigate();
  const color = MATURITY_COLOR[activeProject.maturity] ?? '#6366f1';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: `${color}11`,
      border: `1px solid ${color}44`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 10,
      padding: '10px 16px',
      marginBottom: 24,
    }}>
      {/* Color dot + project name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}88`,
          flexShrink: 0,
        }} />
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cs-text)' }}>
            {activeProject.name}
          </span>
          {context && (
            <span style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginLeft: 8 }}>
              — {context}
            </span>
          )}
          <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 1 }}>
            {activeProject.path}
          </div>
        </div>
      </div>

      {/* Stack badges */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {activeProject.stack.slice(0, 3).map(s => (
          <span key={s} className="badge badge-stack" style={{ fontSize: 10 }}>{s}</span>
        ))}
      </div>

      {/* Maturity badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color,
        background: `${color}22`,
        borderRadius: 4, padding: '2px 7px',
        flexShrink: 0,
      }}>
        {MATURITY_LABEL[activeProject.maturity] ?? activeProject.maturity}
      </span>

      {/* Switch project quicklink */}
      <select
        value={activeProject.id}
        onChange={e => {
          const p = allProjects.find(x => x.id === e.target.value);
          if (p) setActiveProject(p);
        }}
        style={{
          background: 'var(--cs-surface-2)',
          border: '1px solid var(--cs-border)',
          borderRadius: 6,
          color: 'var(--cs-text-muted)',
          fontSize: 11,
          padding: '4px 8px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Cambiar proyecto"
      >
        {allProjects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
