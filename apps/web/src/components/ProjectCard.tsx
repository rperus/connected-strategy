import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '@cs/domain';
import { StatusBadge } from './Badges';

const MATURITY_PCT: Record<string, number> = { nascent: 20, developing: 50, mature: 80, legacy: 95 };
const MATURITY_CLR: Record<string, string> = {
  nascent: '#f59e0b', developing: '#06b6d4', mature: '#22c55e', legacy: '#7b7f9a',
};

interface Props { project: Project; composite?: number; }

export function ProjectCard({ project, composite }: Props) {
  const pct = MATURITY_PCT[project.maturity] ?? 0;
  const clr = MATURITY_CLR[project.maturity] ?? '#7b7f9a';
  return (
    <Link to={`/project/${project.id}`} className="project-card" style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
      <div className="project-card-name">{project.name}</div>
      <div className="project-card-desc">{project.description ?? 'Sin descripción'}</div>
      <div className="stack-badges">
        {project.stack.slice(0, 4).map(s => (
          <span key={s} className="badge badge-stack">{s}</span>
        ))}
        {project.stack.length > 4 && <span className="badge badge-neutral">+{project.stack.length - 4}</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <StatusBadge status={project.maturity} />
        {composite !== undefined && (
          <span style={{ fontSize: 13, fontWeight: 700, color: composite >= 60 ? '#22c55e' : composite >= 40 ? '#f59e0b' : '#ef4444' }}>
            {composite} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--cs-text-muted)' }}>SAC</span>
          </span>
        )}
      </div>
      {project.lastScanned && (
        <div style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Escaneado: {new Date(project.lastScanned).toLocaleDateString('es-MX')}</span>
          {project.health_score !== undefined && (
            <span style={{ color: project.health_score > 80 ? '#22c55e' : project.health_score > 50 ? '#f59e0b' : '#ef4444' }}>
              ♥ {project.health_score}%
            </span>
          )}
        </div>
      )}
      <div className="maturity-bar">
        <div className="maturity-fill" style={{ transform: `scaleX(${pct / 100})`, background: clr }} />
      </div>
    </Link>
  );
}
