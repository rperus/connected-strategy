/**
 * Flywheel Page — Connected Loop & Feedback Visualization
 * Interactive SVG flywheel showing Sense → Transmit → Analyze → React → Repeat cycle.
 * Source: Connected Strategy Ch. 5, Figure 5-5
 */
import React, { useState } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

interface LoopNode {
  key: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
  score: number;
  detail: string;
}

const INITIAL_NODES: LoopNode[] = [
  { key: 'sense', label: 'Sense', emoji: '📡', color: '#6366f1', description: 'Detectar señales del cliente', score: 50, detail: '' },
  { key: 'transmit', label: 'Transmit', emoji: '📶', color: '#3b82f6', description: 'Enviar datos al sistema', score: 50, detail: '' },
  { key: 'analyze', label: 'Analyze', emoji: '🧠', color: '#f59e0b', description: 'Procesar para generar insights', score: 50, detail: '' },
  { key: 'react', label: 'React', emoji: '⚡', color: '#22c55e', description: 'Actuar sobre los insights', score: 50, detail: '' },
];

const FEEDBACK_LOOPS = [
  { id: 'individual', label: 'Individual Learning', desc: 'Cada interacción mejora el servicio para ESE cliente', color: '#6366f1' },
  { id: 'population', label: 'Population Learning', desc: 'Datos agregados mejoran el modelo para TODOS', color: '#ec4899' },
];

const LEVELS = [
  { level: 1, label: 'Unified Experience', desc: 'Integrar episodios previamente aislados en una experiencia coherente', color: '#3b82f6' },
  { level: 2, label: 'Personalized Offering', desc: 'Usar datos pasados para personalizar productos y servicios', color: '#6366f1' },
  { level: 3, label: 'Efficient Delivery', desc: 'Agregar información de muchos clientes para optimizar cumplimiento', color: '#f59e0b' },
  { level: 4, label: 'Trusted Partner', desc: 'Abordar necesidades fundamentales — no solo transacciones', color: '#22c55e' },
];

const SVG_SIZE = 360;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const LOOP_R = 120;

export function FlywheelPage() {
  const [nodes, setNodes] = useState<LoopNode[]>(INITIAL_NODES);
  const [selectedFeedback, setSelectedFeedback] = useState('individual');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [notes, setNotes] = useState('');

  const updateNode = (key: string, updates: Partial<LoopNode>) => {
    setNodes(prev => prev.map(n => (n.key === key ? { ...n, ...updates } : n)));
  };

  const avgScore = Math.round(nodes.reduce((s, n) => s + n.score, 0) / nodes.length);
  const flywheel = avgScore >= 70 ? 'Fuerte' : avgScore >= 40 ? 'En desarrollo' : 'Débil';
  const fwColor = avgScore >= 70 ? '#22c55e' : avgScore >= 40 ? '#f59e0b' : '#ef4444';

  // Node positions around circle
  const nodePositions = nodes.map((_, i) => {
    const angle = ((360 / nodes.length) * i - 90) * (Math.PI / 180);
    return {
      x: CX + LOOP_R * Math.cos(angle),
      y: CY + LOOP_R * Math.sin(angle),
    };
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔄 Connected Loop & Flywheel</h1>
        <p className="page-subtitle">
          Visualiza el ciclo de aprendizaje conectado y los feedback loops que crean ventaja competitiva sostenible.
          Fuente: Connected Strategy Cap. 5, Figura 5-5.
        </p>
      </div>
      <ProjectBanner context="Flywheel" />

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, marginBottom: 28 }}>
        {/* Flywheel SVG */}
        <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
            {/* Outer ring */}
            <circle cx={CX} cy={CY} r={LOOP_R + 20} fill="none" stroke="var(--cs-border)" strokeWidth={1} strokeDasharray="4,4" />
            <circle cx={CX} cy={CY} r={LOOP_R} fill="none" stroke="var(--cs-border)" strokeWidth={0.5} />

            {/* Arrow arcs between nodes */}
            {nodes.map((_, i) => {
              const startAngle = ((360 / nodes.length) * i - 90 + 20) * (Math.PI / 180);
              const endAngle = ((360 / nodes.length) * ((i + 1) % nodes.length) - 90 - 20) * (Math.PI / 180);
              const sx = CX + LOOP_R * Math.cos(startAngle);
              const sy = CY + LOOP_R * Math.sin(startAngle);
              const ex = CX + LOOP_R * Math.cos(endAngle);
              const ey = CY + LOOP_R * Math.sin(endAngle);
              const midAngle = (startAngle + endAngle) / 2;
              const mx = CX + (LOOP_R + 8) * Math.cos(midAngle);
              const my = CY + (LOOP_R + 8) * Math.sin(midAngle);
              return (
                <g key={i}>
                  <path
                    d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                    fill="none"
                    stroke={nodes[i].color}
                    strokeWidth={2.5}
                    opacity={0.6}
                    markerEnd={`url(#arrow-${i})`}
                  />
                  <defs>
                    <marker id={`arrow-${i}`} markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill={nodes[i].color} opacity={0.8} />
                    </marker>
                  </defs>
                </g>
              );
            })}

            {/* Center label */}
            <text x={CX} y={CY - 8} textAnchor="middle" fill={fwColor} fontSize={28} fontWeight={800}>
              {avgScore}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--cs-text-muted)" fontSize={10}>
              {flywheel}
            </text>

            {/* Node circles */}
            {nodes.map((n, i) => {
              const pos = nodePositions[i];
              return (
                <g key={n.key}>
                  <circle cx={pos.x} cy={pos.y} r={28} fill={`${n.color}22`} stroke={n.color} strokeWidth={2} />
                  <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontSize={16}>
                    {n.emoji}
                  </text>
                  <text x={pos.x} y={pos.y + 14} textAnchor="middle" fill={n.color} fontSize={8} fontWeight={700}>
                    {n.label}
                  </text>
                </g>
              );
            })}

            {/* Feedback arrows */}
            {selectedFeedback === 'individual' && (
              <>
                <path d={`M ${CX - 40} ${CY + 35} C ${CX - 60} ${CY + 70} ${CX + 60} ${CY + 70} ${CX + 40} ${CY + 35}`} fill="none" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4,2" />
                <text x={CX} y={CY + 55} textAnchor="middle" fill="#6366f1" fontSize={8} fontWeight={600}>Individual ↻</text>
              </>
            )}
            {selectedFeedback === 'population' && (
              <>
                <path d={`M ${CX - 40} ${CY - 35} C ${CX - 60} ${CY - 70} ${CX + 60} ${CY - 70} ${CX + 40} ${CY - 35}`} fill="none" stroke="#ec4899" strokeWidth={1.5} strokeDasharray="4,2" />
                <text x={CX} y={CY - 55} textAnchor="middle" fill="#ec4899" fontSize={8} fontWeight={600}>Population ↻</text>
              </>
            )}
          </svg>
        </div>

        {/* Right panel */}
        <div>
          {/* Feedback loop selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {FEEDBACK_LOOPS.map(fl => (
              <button
                key={fl.id}
                onClick={() => setSelectedFeedback(fl.id)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `2px solid ${selectedFeedback === fl.id ? fl.color : 'var(--cs-border)'}`,
                  background: selectedFeedback === fl.id ? `${fl.color}15` : 'transparent',
                  color: selectedFeedback === fl.id ? fl.color : 'var(--cs-text-muted)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>{fl.label}</div>
                <div style={{ fontSize: 10, fontWeight: 400, marginTop: 4, opacity: 0.8 }}>{fl.desc}</div>
              </button>
            ))}
          </div>

          {/* 4 Levels of Customization */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 10 }}>
              🏔️ 4 Niveles de Personalización → Trusted Partner
            </div>
            {LEVELS.map(l => (
              <div
                key={l.level}
                onClick={() => setCurrentLevel(l.level)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: 'pointer',
                  background: currentLevel >= l.level ? `${l.color}15` : 'transparent',
                  border: currentLevel === l.level ? `2px solid ${l.color}` : '1px solid transparent',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: currentLevel >= l.level ? l.color : 'var(--cs-surface-2)',
                  color: currentLevel >= l.level ? '#fff' : 'var(--cs-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>
                  {l.level}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: currentLevel >= l.level ? l.color : 'var(--cs-text-muted)' }}>{l.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--cs-text-dim)' }}>{l.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Node detail editors */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Evalúa cada fase del loop
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {nodes.map(n => (
          <div key={n.key} className="card" style={{ borderTop: `3px solid ${n.color}` }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{n.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: n.color, marginBottom: 4 }}>{n.label}</div>
            <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginBottom: 8 }}>{n.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={n.score}
                onChange={e => updateNode(n.key, { score: Number(e.target.value) })}
                style={{ flex: 1, accentColor: n.color }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, width: 28, textAlign: 'right' }}>{n.score}</span>
            </div>
            <textarea
              value={n.detail}
              onChange={e => updateNode(n.key, { detail: e.target.value })}
              placeholder={`¿Cómo funciona ${n.label} en tu plataforma?`}
              rows={2}
              style={{ width: '100%', fontSize: 10, padding: 6, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)', resize: 'vertical' }}
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 8 }}>📝 Notas del Flywheel</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="¿Cómo se fortalece tu flywheel con cada ciclo? ¿Qué datos se acumulan? ¿Cómo mejora la experiencia?"
          rows={3}
          style={{ width: '100%', fontSize: 12, padding: 10, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 6, color: 'var(--cs-text)', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
