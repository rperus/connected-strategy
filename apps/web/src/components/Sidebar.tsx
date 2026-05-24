import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ApiStatusIndicator } from './ApiStatus';
import { useProject } from '../context/ProjectContext';
import { ALL_WORKSHEETS } from '@cs/domain';

const NAV = [
  { section: 'Inicio', items: [
    { to: '/', label: 'Inicio', icon: '⌂' },
    { to: '/quick-start', label: 'Guía Rápida', icon: '📖' },
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
    { to: '/causal', label: 'Causal DAG (Pearl)', icon: '🕸️' },
    { to: '/ai-frontier', label: 'AI Frontier', icon: '✦' },
  ]},
  { section: 'Estrategia Wharton', items: [
    { to: '/frontier', label: 'Frontera de Eficiencia', icon: '📈' },
    { to: '/strategy-matrix', label: 'Matriz 5×4', icon: '🧩' },
    { to: '/activity-map', label: 'Mapa de Actividades', icon: '🕸' },
    { to: '/five-forces', label: '5 Fuerzas Porter', icon: '🛡' },
    { to: '/customer-journey', label: 'Customer Journey', icon: '🗺' },
    { to: '/star-matrix', label: 'Matriz STAR', icon: '🔬' },
    { to: '/flywheel', label: 'Flywheel / Loop', icon: '🔄' },
    { to: '/value-chain', label: 'Cadena de Valor', icon: '⛓' },
  ]},
  { section: 'Inteligencia', items: [
    { to: '/matrix', label: 'Matriz de Portfolio', icon: '🗺️' },
    { to: '/briefing', label: 'Briefing Ejecutivo', icon: '📋' },
    { to: '/intel', label: 'Skills & Workflows', icon: '🔌' },
    { to: '/improve', label: 'Mejoras Estratégicas', icon: '🚀' },
    { to: '/swarm-comparator', label: 'Swarm Comparator', icon: '⚖️' },
  ]},
  { section: 'Acción', items: [
    { to: '/agents', label: 'Agentes', icon: '🤖' },
    { to: '/proposals', label: 'Proposals', icon: '◉' },
    { to: '/prompts', label: 'Prompt Packets', icon: '⟡' },
    { to: '/reports', label: 'Reportes', icon: '⎙' },
    { to: '/settings', label: 'Configuración', icon: '⚙️' },
  ]},
  { section: 'Pipeline V3', items: [
    { to: '/v3', label: 'V3 Analysis', icon: '🚀' },
    { to: '/v3/moves', label: 'Antigravity Moves', icon: '🎯' },
  ]},
];

const MATURITY_COLOR: Record<string, string> = {
  nascent: '#f59e0b',
  developing: '#6366f1',
  mature: '#22c55e',
  legacy: '#6b7280',
};

export function Sidebar() {
  const { activeProject, setActiveProject, allProjects } = useProject();
  const [open, setOpen] = useState(false);

  // W3-4: Live worksheet progress badge — reads from localStorage without API call
  const [wsProgress, setWsProgress] = useState(0);
  useEffect(() => {
    function computeProgress() {
      try {
        const stored = JSON.parse(localStorage.getItem('cs_worksheet_answers') ?? '{}');
        const filled = ALL_WORKSHEETS.filter(ws => {
          const ans = stored[ws.id] ?? {};
          return Object.values(ans).some(v => v !== undefined && v !== '');
        }).length;
        setWsProgress(Math.round((filled / ALL_WORKSHEETS.length) * 100));
      } catch { setWsProgress(0); }
    }
    computeProgress();
    // Re-check on storage events (other tabs) and every 10s
    window.addEventListener('storage', computeProgress);
    const id = setInterval(computeProgress, 10000);
    return () => { window.removeEventListener('storage', computeProgress); clearInterval(id); };
  }, []);

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">Connected Strategy</div>
        <div className="sidebar-logo-sub" style={{ color: 'var(--cs-text-muted)', fontSize: 11 }}>
          Torre de Control
        </div>
      </div>

      {/* ─── Project Selector ─── */}
      <div style={{ padding: '0 12px 14px' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--cs-text-muted)',
            marginBottom: 6,
          }}
        >
          Proyecto activo
        </div>

        {/* Selector button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%',
            background: 'var(--cs-surface-2)',
            border: `1px solid ${MATURITY_COLOR[activeProject.maturity] ?? '#6366f1'}55`,
            borderLeft: `3px solid ${MATURITY_COLOR[activeProject.maturity] ?? '#6366f1'}`,
            borderRadius: 8,
            padding: '8px 10px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--cs-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {activeProject.name}
            </div>
            <div style={{
              fontSize: 10,
              color: 'var(--cs-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {activeProject.path.split(/[/\\]/).pop()}
            </div>
          </div>
          <span style={{ color: 'var(--cs-text-muted)', fontSize: 10, flexShrink: 0 }}>
            {open ? '▲' : '▼'}
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            marginTop: 4,
            background: 'var(--cs-surface-2)',
            border: '1px solid var(--cs-border)',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 100,
            position: 'relative',
          }}>
            {allProjects.map(p => (
              <button
                key={p.id}
                onClick={() => { setActiveProject(p); setOpen(false); }}
                style={{
                  width: '100%',
                  background: p.id === activeProject.id ? 'var(--cs-accent)22' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--cs-border)',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--cs-surface-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = p.id === activeProject.id ? 'var(--cs-accent)22' : 'transparent')}
              >
                {/* Color dot */}
                <span style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: MATURITY_COLOR[p.maturity] ?? '#6366f1',
                  flexShrink: 0,
                }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cs-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                    {p.id === activeProject.id && (
                      <span style={{ fontSize: 9, color: 'var(--cs-accent)', marginLeft: 6 }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>
                    {p.stack.slice(0, 2).join(' · ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Nav links ─── */}
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
                // W3-1: title = tooltip for collapsed mobile nav (icon-only mode)
                title={item.label}
                aria-label={item.label}
              >
                <span className="icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {/* W3-4: worksheet progress badge — only on Worksheets nav item */}
                {item.to === '/worksheets' && wsProgress > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: wsProgress === 100
                      ? 'rgba(16,185,129,0.2)'
                      : 'rgba(99,102,241,0.2)',
                    color: wsProgress === 100 ? 'var(--cs-success)' : 'var(--cs-accent-hover)',
                    border: `1px solid ${wsProgress === 100 ? 'var(--cs-success)' : 'var(--cs-accent)'}44`,
                    flexShrink: 0,
                  }}>
                    {wsProgress}%
                  </span>
                )}
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
