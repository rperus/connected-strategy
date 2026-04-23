import React from 'react';
import { NavLink } from 'react-router-dom';
import { ApiStatusIndicator } from './ApiStatus';

const NAV = [
  { section: 'Inicio', items: [
    { to: '/', label: 'Inicio', icon: '⌂' },
    { to: '/health', label: 'Salud', icon: '🏥' },
  ]},
  { section: 'Proyectos', items: [
    { to: '/portfolio', label: 'Portfolio', icon: '▦' },
    { to: '/launcher', label: 'Launcher', icon: '⚡' },
  ]},
  { section: 'Análisis', items: [
    { to: '/worksheets', label: 'Worksheets', icon: '✎' },
    { to: '/competitive', label: 'Ventaja Competitiva', icon: '⚔' },
    { to: '/business-model', label: 'Business Model', icon: '◈' },
    { to: '/data-science', label: 'Data Science', icon: '∑' },
    { to: '/architecture', label: 'Arquitectura', icon: '⬡' },
    { to: '/ai-frontier', label: 'AI Frontier', icon: '✦' },
  ]},
  { section: 'Acción', items: [
    { to: '/proposals', label: 'Proposals', icon: '◉' },
    { to: '/prompts', label: 'Prompt Packets', icon: '⟡' },
    { to: '/reports', label: 'Reportes', icon: '⎙' },
  ]},
];

interface Props { projectName: string; }

export function Sidebar({ projectName }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">Connected Strategy</div>
        <div className="sidebar-logo-sub">{projectName}</div>
      </div>
      {NAV.map(group => (
        <div className="sidebar-section" key={group.section}>
          <div className="sidebar-section-label">{group.section}</div>
          <div className="sidebar-nav">
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: '12px 16px', marginTop: 'auto', borderTop: '1px solid var(--cs-border)' }}>
        <ApiStatusIndicator />
      </div>
    </nav>
  );
}
