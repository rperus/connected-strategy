/**
 * Portfolio Strategy Matrix — 2×2 Wharton Positioning Map
 *
 * Plots all projects on: X=Switching Cost Index, Y=WTP Uplift Index
 * Node size = SAC score. Quadrants = Connected Strategy archetypes.
 * Shows trajectory arrows toward optimal position.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
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

          <ReactECharts
            option={{
              grid: { left: 40, right: 40, top: 40, bottom: 40 },
              tooltip: { show: false },
              xAxis: {
                type: 'value', min: 0, max: 100,
                name: 'Switching Cost Index (0-100)', nameLocation: 'middle', nameGap: 25,
                nameTextStyle: { color: 'var(--cs-text-muted)' },
                axisLabel: { color: 'var(--cs-text-muted)', fontSize: 9 },
                splitLine: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } }
              },
              yAxis: {
                type: 'value', min: 0, max: 100,
                name: 'WTP Uplift (0-100)', nameLocation: 'middle', nameGap: 25,
                nameTextStyle: { color: 'var(--cs-text-muted)' },
                axisLabel: { color: 'var(--cs-text-muted)', fontSize: 9 },
                splitLine: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } }
              },
              series: [{
                type: 'scatter',
                data: projects.map(p => {
                  const m = metrics[p.id];
                  if (!m) return null;
                  return {
                    name: p.name,
                    value: [m.switchingCostIndex, m.wtpUpliftIndex, m.strategicAdvantageComposite, p.id],
                    itemStyle: { color: COLORS[p.id] ?? '#6366f1', opacity: 0.8 },
                    symbolSize: (data: any) => 20 + (data[2] / 100) * 40,
                  };
                }).filter(Boolean),
                label: {
                  show: true,
                  formatter: (params: any) => EMOJIS[params.value[3]] ?? '⬡',
                  fontSize: 16,
                  position: 'inside',
                  color: '#fff'
                },
                markArea: {
                  silent: true,
                  data: [
                    [{ xAxis: 0, yAxis: 50, itemStyle: { color: '#6366f111' } }, { xAxis: 50, yAxis: 100 }],
                    [{ xAxis: 50, yAxis: 50, itemStyle: { color: '#22c55e11' } }, { xAxis: 100, yAxis: 100 }],
                    [{ xAxis: 0, yAxis: 0, itemStyle: { color: '#f59e0b11' } }, { xAxis: 50, yAxis: 50 }],
                    [{ xAxis: 50, yAxis: 0, itemStyle: { color: '#ec489911' } }, { xAxis: 100, yAxis: 50 }],
                  ]
                },
                markLine: {
                  silent: true,
                  symbol: ['none', 'none'],
                  lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.15)' },
                  data: [{ xAxis: 50 }, { yAxis: 50 }]
                }
              }]
            }}
            style={{ width: '100%', height: SVG }}
            onEvents={{
              click: (params: any) => { if(params.componentType === 'series') setSelected(selected === params.value[3] ? null : params.value[3]); }
            }}
          />
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
