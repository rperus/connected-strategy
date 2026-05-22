/**
 * Five Forces Page — Porter's 5 Forces Analysis
 * Interactive radar/pentagon chart for industry structure analysis.
 * Source: Wharton Competitive Advantage Module 2
 */
import React, { useState } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

interface Force {
  key: string;
  label: string;
  emoji: string;
  description: string;
  score: number;
  factors: string;
}

const INITIAL_FORCES: Force[] = [
  {
    key: 'rivalry',
    label: 'Rivalidad entre competidores',
    emoji: '⚔️',
    description: 'Intensidad de la competencia directa en tu industria',
    score: 50,
    factors: '',
  },
  {
    key: 'new-entrants',
    label: 'Amenaza de nuevos entrantes',
    emoji: '🚪',
    description: 'Facilidad con la que nuevos competidores pueden entrar al mercado',
    score: 50,
    factors: '',
  },
  {
    key: 'substitutes',
    label: 'Amenaza de sustitutos',
    emoji: '🔄',
    description: 'Productos o servicios alternativos que cumplen la misma función',
    score: 50,
    factors: '',
  },
  {
    key: 'buyers',
    label: 'Poder de negociación de compradores',
    emoji: '🛒',
    description: 'Capacidad de los clientes para presionar precios o exigir más valor',
    score: 50,
    factors: '',
  },
  {
    key: 'suppliers',
    label: 'Poder de negociación de proveedores',
    emoji: '🏭',
    description: 'Capacidad de los proveedores para imponer condiciones',
    score: 50,
    factors: '',
  },
];

const PENTAGON_SIZE = 340;
const CENTER = PENTAGON_SIZE / 2;
const RADIUS = 130;
const RINGS = [0.25, 0.5, 0.75, 1.0];

function polarToXY(angle: number, r: number): [number, number] {
  // Start from top (-90°)
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

function getVertexAngle(i: number): number {
  return (360 / 5) * i;
}

export function FiveForcesPage() {
  const [forces, setForces] = useState<Force[]>(INITIAL_FORCES);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const updateForce = (idx: number, updates: Partial<Force>) => {
    setForces(prev => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const avgScore = Math.round(forces.reduce((s, f) => s + f.score, 0) / forces.length);
  const attractiveness = avgScore <= 35 ? 'Alta' : avgScore <= 65 ? 'Media' : 'Baja';
  const attractivenessColor = avgScore <= 35 ? '#22c55e' : avgScore <= 65 ? '#f59e0b' : '#ef4444';

  // Pentagon ring paths
  const ringPaths = RINGS.map(scale => {
    const pts = Array.from({ length: 5 }, (_, i) => {
      const [x, y] = polarToXY(getVertexAngle(i), RADIUS * scale);
      return `${x},${y}`;
    });
    return pts.join(' ');
  });

  // Data polygon
  const dataPoints = forces.map((f, i) => {
    const [x, y] = polarToXY(getVertexAngle(i), (f.score / 100) * RADIUS);
    return `${x},${y}`;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🛡️ 5 Fuerzas de Porter</h1>
        <p className="page-subtitle">
          Análisis de estructura de la industria — evalúa la intensidad competitiva y atractivo del mercado.
          <span style={{ marginLeft: 12, padding: '4px 10px', borderRadius: 12, background: `${attractivenessColor}22`, color: attractivenessColor, fontSize: 12, fontWeight: 700 }}>
            Atractivo: {attractiveness} ({100 - avgScore}/100)
          </span>
        </p>
      </div>
      <ProjectBanner context="5 Fuerzas de Porter" />

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, marginBottom: 28 }}>
        {/* Pentagon Chart */}
        <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <svg width={PENTAGON_SIZE} height={PENTAGON_SIZE} viewBox={`0 0 ${PENTAGON_SIZE} ${PENTAGON_SIZE}`}>
            {/* Grid rings */}
            {ringPaths.map((pts, ri) => (
              <polygon
                key={ri}
                points={pts}
                fill="none"
                stroke="var(--cs-border)"
                strokeWidth={ri === ringPaths.length - 1 ? 1.5 : 0.5}
                strokeDasharray={ri < ringPaths.length - 1 ? '3,3' : 'none'}
              />
            ))}

            {/* Axis lines */}
            {forces.map((_, i) => {
              const [x, y] = polarToXY(getVertexAngle(i), RADIUS);
              return (
                <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--cs-border)" strokeWidth={0.5} />
              );
            })}

            {/* Data polygon */}
            <polygon
              points={dataPoints.join(' ')}
              fill="rgba(99,102,241,0.2)"
              stroke="#6366f1"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Data points + labels */}
            {forces.map((f, i) => {
              const [x, y] = polarToXY(getVertexAngle(i), (f.score / 100) * RADIUS);
              const [lx, ly] = polarToXY(getVertexAngle(i), RADIUS + 24);
              return (
                <g key={f.key}>
                  <circle cx={x} cy={y} r={5} fill="#6366f1" stroke="#fff" strokeWidth={1.5} />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--cs-text)"
                    fontSize={10}
                    fontWeight={600}
                  >
                    {f.emoji} {f.score}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Summary cards */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: attractivenessColor }}>{100 - avgScore}</div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>Atractivo de Industria</div>
              <div style={{ fontSize: 10, color: 'var(--cs-text-dim)', marginTop: 4 }}>100 = altamente atractiva, 0 = guerra de precios</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#6366f1' }}>{avgScore}</div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>Presión Competitiva Promedio</div>
              <div style={{ fontSize: 10, color: 'var(--cs-text-dim)', marginTop: 4 }}>Promedio de las 5 fuerzas</div>
            </div>
          </div>

          {/* Force ranking */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 12 }}>Ranking de Fuerzas</div>
            {[...forces].sort((a, b) => b.score - a.score).map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14, width: 24 }}>{f.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cs-text)' }}>{f.label}</div>
                  <div className="score-bar" style={{ height: 6, marginTop: 3 }}>
                    <div
                      className="score-fill"
                      style={{
                        transform: `scaleX(${f.score / 100})`,
                        background: f.score > 65 ? '#ef4444' : f.score > 35 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text-muted)', width: 30, textAlign: 'right' }}>{f.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Force detail editors */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Evalúa cada fuerza
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {forces.map((f, idx) => (
          <div
            key={f.key}
            className="card"
            style={{
              borderLeft: `3px solid ${f.score > 65 ? '#ef4444' : f.score > 35 ? '#f59e0b' : '#22c55e'}`,
              cursor: 'pointer',
            }}
            onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{f.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cs-text)' }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>{f.description}</div>
              </div>
            </div>

            {/* Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: '#22c55e' }}>Bajo</span>
              <input
                type="range"
                min={0}
                max={100}
                value={f.score}
                onClick={e => e.stopPropagation()}
                onChange={e => updateForce(idx, { score: Number(e.target.value) })}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ fontSize: 10, color: '#ef4444' }}>Alto</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--cs-text)', width: 32, textAlign: 'right' }}>{f.score}</span>
            </div>

            {/* Expanded detail */}
            {editingIdx === idx && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--cs-border)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cs-text-muted)', marginBottom: 6 }}>Factores clave:</div>
                <textarea
                  value={f.factors}
                  onChange={e => updateForce(idx, { factors: e.target.value })}
                  placeholder="¿Qué factores determinan la intensidad de esta fuerza? (ej: barreras de entrada, costos de cambio, concentración)"
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--cs-surface-2)',
                    border: '1px solid var(--cs-border)',
                    borderRadius: 6,
                    padding: 8,
                    fontSize: 12,
                    color: 'var(--cs-text)',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Strategic notes */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 8 }}>📝 Notas Estratégicas</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="¿Qué implican estas fuerzas para tu estrategia conectada? ¿Dónde puedes usar la conectividad para reducir el poder de estas fuerzas?"
          rows={4}
          style={{
            width: '100%',
            background: 'var(--cs-surface-2)',
            border: '1px solid var(--cs-border)',
            borderRadius: 6,
            padding: 10,
            fontSize: 12,
            color: 'var(--cs-text)',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
}
