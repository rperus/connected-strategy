/**
 * Portfolio Strategy Matrix — 2×2 Wharton Positioning Map
 *
 * Plots all projects on: X=Switching Cost Index, Y=WTP Uplift Index
 * Node size = SAC score. Quadrants = Connected Strategy archetypes.
 * Shows trajectory arrows toward optimal position.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_METRICS, MOCK_PROJECTS } from '../mockData';
import { ProjectBanner } from '../components/ProjectBanner';

const QUADRANTS = [
  { x: 0, y: 50, w: 50, h: 50, label: 'Coach Behavior', color: '#6366f1', desc: 'Alto WTP, bajo lock-in. El coach ayuda pero el cliente puede irse.', icon: '🎓' },
  { x: 50, y: 50, w: 50, h: 50, label: 'Trusted Partner', color: '#22c55e', desc: 'Alto WTP + alto lock-in. La posición más poderosa.', icon: '🤝' },
  { x: 0, y: 0, w: 50, h: 50, label: 'Respond to Desire', color: '#f59e0b', desc: 'Bajo WTP y lock-in. Transaccional, sin moat.', icon: '📦' },
  { x: 50, y: 0, w: 50, h: 50, label: 'Curated Offering', color: '#ec4899', desc: 'Alto lock-in, bajo WTP. El cliente no lo valora pero no puede irse.', icon: '📋' },
];

const COLORS: Record<string, string> = {
  'balam-licitaciones': '#22c55e',
  'connected-strategy': '#6366f1',
  'rodrigo-os': '#f59e0b',
  'rodrigo-os-health': '#06b6d4',
  'youtube-cashcow': '#f97316',
  'balam-demo': '#8b5cf6',
  'grant-navigator': '#ec4899',
};

const EMOJIS: Record<string, string> = {
  'balam-licitaciones': '⚖️',
  'connected-strategy': '🧠',
  'rodrigo-os': '🖥️',
  'rodrigo-os-health': '❤️',
  'youtube-cashcow': '▶️',
  'balam-demo': '🏗️',
  'grant-navigator': '🎯',
};

export function PortfolioMatrixPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const projects = MOCK_PROJECTS;
  const metrics = MOCK_METRICS;

  // SVG dimensions
  const SVG = 520;
  const PAD = 48;
  const PLOT = SVG - PAD * 2;

  // Convert score (0-100) to SVG coords
  const toX = (sci: number) => PAD + (sci / 100) * PLOT;
  const toY = (wtp: number) => PAD + PLOT - (wtp / 100) * PLOT; // invert Y
  const toR = (sac: number) => 10 + (sac / 100) * 20; // radius 10-30

  const selectedProject = selected ? projects.find(p => p.id === selected) : null;
  const selectedMetrics = selected ? metrics[selected] : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🗺️ Matriz de Posicionamiento Estratégico</h1>
        <p className="page-subtitle">
          Wharton Connected Strategy · WTP vs Switching Costs · Tamaño = SAC score · Haz clic en un nodo para detalles
        </p>
      </div>
      <ProjectBanner context="Portfolio Matrix" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Matrix */}
        <div className="card" style={{ padding: 20 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {QUADRANTS.map(q => (
              <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: `${q.color}44`, border: `1px solid ${q.color}` }} />
                <span style={{ fontSize: 10, color: 'var(--cs-text-muted)', fontWeight: 600 }}>{q.icon} {q.label}</span>
              </div>
            ))}
          </div>

          <svg width="100%" viewBox={`0 0 ${SVG} ${SVG}`} style={{ display: 'block' }}>
            {/* Quadrant backgrounds */}
            <rect x={PAD} y={PAD} width={PLOT / 2} height={PLOT / 2} fill="#6366f108" stroke="#6366f122" strokeWidth={1} />
            <rect x={PAD + PLOT / 2} y={PAD} width={PLOT / 2} height={PLOT / 2} fill="#22c55e08" stroke="#22c55e22" strokeWidth={1} />
            <rect x={PAD} y={PAD + PLOT / 2} width={PLOT / 2} height={PLOT / 2} fill="#f59e0b08" stroke="#f59e0b22" strokeWidth={1} />
            <rect x={PAD + PLOT / 2} y={PAD + PLOT / 2} width={PLOT / 2} height={PLOT / 2} fill="#ec4899o8" stroke="#ec489922" strokeWidth={1} />

            {/* Quadrant labels */}
            {[
              { cx: PAD + PLOT * 0.25, cy: PAD + PLOT * 0.25, label: '🎓 Coach Behavior', color: '#6366f1' },
              { cx: PAD + PLOT * 0.75, cy: PAD + PLOT * 0.25, label: '🤝 Trusted Partner', color: '#22c55e' },
              { cx: PAD + PLOT * 0.25, cy: PAD + PLOT * 0.75, label: '📦 Respond to Desire', color: '#f59e0b' },
              { cx: PAD + PLOT * 0.75, cy: PAD + PLOT * 0.75, label: '📋 Curated Offering', color: '#ec4899' },
            ].map(q => (
              <text key={q.label} x={q.cx} y={q.cy} textAnchor="middle" fill={q.color} fontSize={10} fontWeight={700} opacity={0.7}>
                {q.label}
              </text>
            ))}

            {/* Axes */}
            <line x1={PAD} y1={PAD + PLOT / 2} x2={PAD + PLOT} y2={PAD + PLOT / 2} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4,3" />
            <line x1={PAD + PLOT / 2} y1={PAD} x2={PAD + PLOT / 2} y2={PAD + PLOT} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4,3" />

            {/* Axis labels */}
            <text x={PAD + PLOT / 2} y={SVG - 8} textAnchor="middle" fill="var(--cs-text-muted)" fontSize={11}>← Switching Cost Index (0-100) →</text>
            <text x={12} y={PAD + PLOT / 2} textAnchor="middle" fill="var(--cs-text-muted)" fontSize={11} transform={`rotate(-90, 12, ${PAD + PLOT / 2})`}>WTP Uplift (0-100)</text>
            <text x={PAD} y={SVG - 8} fill="var(--cs-text-muted)" fontSize={9}>0</text>
            <text x={PAD + PLOT - 8} y={SVG - 8} fill="var(--cs-text-muted)" fontSize={9}>100</text>
            <text x={PAD - 20} y={PAD + PLOT} fill="var(--cs-text-muted)" fontSize={9}>0</text>
            <text x={PAD - 20} y={PAD + 4} fill="var(--cs-text-muted)" fontSize={9}>100</text>

            {/* Project nodes */}
            {projects.map(p => {
              const m = metrics[p.id];
              if (!m) return null;
              const cx = toX(m.switchingCostIndex);
              const cy = toY(m.wtpUpliftIndex);
              const r = toR(m.strategicAdvantageComposite);
              const color = COLORS[p.id] ?? '#6366f1';
              const isHov = hovered === p.id;
              const isSel = selected === p.id;
              const active = isHov || isSel;

              return (
                <g key={p.id}
                  onClick={() => setSelected(isSel ? null : p.id)}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {active && <circle cx={cx} cy={cy} r={r + 6} fill={`${color}20`} />}
                  <circle cx={cx} cy={cy} r={r} fill={`${color}30`} stroke={color} strokeWidth={active ? 2.5 : 1.5} />
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={14}>{EMOJIS[p.id] ?? '⬡'}</text>
                  {active && (
                    <text x={cx} y={cy - r - 6} textAnchor="middle" fill={color} fontSize={10} fontWeight={700}>{p.name}</text>
                  )}
                  {!active && (
                    <text x={cx + r + 4} y={cy + 4} fill={color} fontSize={9} opacity={0.8}>{p.name.split(' ')[0]}</text>
                  )}
                  {/* SAC label inside node */}
                  <text x={cx} y={cy + r + 12} textAnchor="middle" fill="var(--cs-text-muted)" fontSize={8}>SAC {m.strategicAdvantageComposite}</text>
                </g>
              );
            })}

            {/* Target zone indicator */}
            <rect x={PAD + PLOT * 0.55} y={PAD + PLOT * 0.05} width={PLOT * 0.4} height={PLOT * 0.4}
              fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6,4" rx={8} opacity={0.5} />
            <text x={PAD + PLOT * 0.75} y={PAD + PLOT * 0.03} textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight={700}>
              🎯 ZONA OBJETIVO
            </text>
          </svg>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedProject && selectedMetrics ? (
            <div className="card" style={{ borderLeft: `3px solid ${COLORS[selectedProject.id] ?? '#6366f1'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{EMOJIS[selectedProject.id]}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS[selectedProject.id] }}>{selectedProject.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>SAC: {selectedMetrics.strategicAdvantageComposite}/100</div>
                </div>
              </div>

              {/* Position analysis */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cs-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Posición actual</div>
                {[
                  { label: 'WTP Uplift', value: selectedMetrics.wtpUpliftIndex, color: '#22c55e' },
                  { label: 'Switching Cost', value: selectedMetrics.switchingCostIndex, color: '#6366f1' },
                  { label: 'SAC', value: selectedMetrics.strategicAdvantageComposite, color: '#f59e0b' },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: row.color }}>{row.value}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--cs-surface-2)' }}>
                      <div style={{ height: '100%', borderRadius: 2, transform: `scaleX(${row.value / 100})`, background: row.color, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strategic recommendation */}
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--cs-surface-2)', fontSize: 10, color: 'var(--cs-text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
                {selectedMetrics.strategicAdvantageBreakdown.rationale}
              </div>

              <Link
                to="/proposals"
                style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
                  width: '100%', padding: '8px', borderRadius: 8,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
                  color: '#6366f1', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Ver Propuestas →
              </Link>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Selecciona un proyecto</div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', lineHeight: 1.6 }}>
                Haz clic en cualquier nodo para ver su posición estratégica y recomendaciones.
              </div>
            </div>
          )}

          {/* Quadrant guide */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>📐 Guía de Cuadrantes</div>
            {QUADRANTS.map(q => (
              <div key={q.label} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--cs-surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{q.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: q.color }}>{q.label}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', lineHeight: 1.5 }}>{q.desc}</div>
              </div>
            ))}
          </div>

          {/* Insight */}
          <div className="card" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>🎯 Objetivo del Portfolio</div>
            <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', lineHeight: 1.6 }}>
              Todos los proyectos B2B deben migrar hacia <strong style={{ color: '#22c55e' }}>Trusted Partner</strong> (WTP alto + Switching Costs altos). Los proyectos personales se optimizan por WTP personal, no por switching costs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
