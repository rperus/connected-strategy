/**
 * STAR Matrix Page — Interactive 4×4 Deconstruction Grid
 * Visualizes STAR (Sense/Transmit/Analyze/React) × Customer Journey (Recognize/Request/Respond/Repeat).
 * Source: Connected Strategy Ch. 9, Workshop 3 Steps 4-5, Worksheet 10-3
 */
import React, { useState } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

const STAR_PHASES = [
  { key: 'sense', label: 'SENSE', emoji: '📡', color: '#6366f1', desc: 'Detectar necesidades o eventos del cliente' },
  { key: 'transmit', label: 'TRANSMIT', emoji: '📶', color: '#3b82f6', desc: 'Enviar datos al sistema' },
  { key: 'analyze', label: 'ANALYZE', emoji: '🧠', color: '#f59e0b', desc: 'Procesar datos para generar insights' },
  { key: 'react', label: 'REACT', emoji: '⚡', color: '#22c55e', desc: 'Actuar en base a los insights' },
];

const JOURNEY_PHASES = [
  { key: 'recognize', label: 'RECOGNIZE', emoji: '👁️', desc: '¿Cómo detectas la necesidad?' },
  { key: 'request', label: 'REQUEST', emoji: '🗣️', desc: '¿Cómo se expresa y canaliza?' },
  { key: 'respond', label: 'RESPOND', emoji: '✅', desc: '¿Cómo entregas la solución?' },
  { key: 'repeat', label: 'REPEAT', emoji: '🔄', desc: '¿Cómo aprendes y mejoras?' },
];

interface CellData {
  current: string;
  opportunity: string;
  maturity: number; // 0-100
}

type MatrixState = Record<string, CellData>;

function cellKey(star: string, journey: string): string {
  return `${star}__${journey}`;
}

export function STARMatrixPage() {
  const [matrix, setMatrix] = useState<MatrixState>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const getCell = (key: string): CellData => matrix[key] || { current: '', opportunity: '', maturity: 0 };

  const updateCell = (key: string, updates: Partial<CellData>) => {
    const cell = getCell(key);
    setMatrix(prev => ({ ...prev, [key]: { ...cell, ...updates } }));
  };

  // Stats
  const totalCells = STAR_PHASES.length * JOURNEY_PHASES.length;
  const filledCells = Object.values(matrix).filter(c => c.current.trim() || c.opportunity.trim()).length;
  const avgMaturity = filledCells > 0
    ? Math.round(Object.values(matrix).reduce((s, c) => s + c.maturity, 0) / filledCells)
    : 0;

  // Heatmap color for maturity
  const maturityColor = (m: number) => {
    if (m === 0) return 'transparent';
    if (m >= 70) return 'rgba(34,197,94,0.2)';
    if (m >= 40) return 'rgba(245,158,11,0.2)';
    return 'rgba(239,68,68,0.2)';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔬 Deconstrucción STAR (4×4)</h1>
        <p className="page-subtitle">
          Mapea cada subfunción tecnológica cruzando STAR con las fases del viaje del cliente.
          Las celdas vacías revelan oportunidades tecnológicas.
          <span style={{ marginLeft: 12, padding: '4px 8px', borderRadius: 12, background: 'rgba(99,102,241,0.15)', fontSize: 12 }}>
            {filledCells}/{totalCells} celdas mapeadas · Madurez promedio: {avgMaturity}%
          </span>
        </p>
      </div>
      <ProjectBanner context="STAR Matrix" />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {STAR_PHASES.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>{s.emoji} {s.label}</span>
          </div>
        ))}
      </div>

      {/* Matrix Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: 120, padding: 10, textAlign: 'left', fontSize: 10, color: 'var(--cs-text-muted)' }}>
                STAR ↓ / Journey →
              </th>
              {JOURNEY_PHASES.map(j => (
                <th key={j.key} style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontSize: 11,
                  color: 'var(--cs-text)',
                  fontWeight: 700,
                  background: 'var(--cs-surface-2)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 16 }}>{j.emoji}</div>
                  {j.label}
                  <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', fontWeight: 400, marginTop: 2 }}>{j.desc}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAR_PHASES.map(star => (
              <tr key={star.key}>
                <td style={{
                  padding: '12px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: star.color,
                  background: `${star.color}10`,
                  borderRadius: 8,
                  verticalAlign: 'top',
                }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{star.emoji}</div>
                  {star.label}
                  <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', fontWeight: 400, marginTop: 4 }}>{star.desc}</div>
                </td>
                {JOURNEY_PHASES.map(journey => {
                  const key = cellKey(star.key, journey.key);
                  const cell = getCell(key);
                  const isActive = activeCell === key;
                  const isEmpty = !cell.current.trim() && !cell.opportunity.trim();
                  return (
                    <td
                      key={key}
                      onClick={() => setActiveCell(isActive ? null : key)}
                      style={{
                        padding: 0,
                        verticalAlign: 'top',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        background: isEmpty ? 'var(--cs-surface-2)' : maturityColor(cell.maturity),
                        borderRadius: 8,
                        padding: isActive ? '12px' : '10px',
                        minHeight: isActive ? 200 : 80,
                        border: isActive
                          ? `2px solid ${star.color}`
                          : isEmpty
                            ? '1px dashed var(--cs-border)'
                            : '1px solid var(--cs-border)',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}>
                        {isEmpty && !isActive && (
                          <div style={{ fontSize: 20, textAlign: 'center', color: 'var(--cs-border)', marginTop: 16 }}>+</div>
                        )}

                        {!isEmpty && !isActive && (
                          <>
                            <div style={{ fontSize: 10, color: 'var(--cs-text)', lineHeight: 1.4, marginBottom: 6 }}>
                              {cell.current.substring(0, 60)}{cell.current.length > 60 ? '…' : ''}
                            </div>
                            <div style={{
                              fontSize: 9,
                              color: cell.maturity >= 70 ? '#22c55e' : cell.maturity >= 40 ? '#f59e0b' : '#ef4444',
                              fontWeight: 700,
                            }}>
                              {cell.maturity}% madurez
                            </div>
                          </>
                        )}

                        {isActive && (
                          <div onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: star.color, marginBottom: 6 }}>
                              {star.label} × {journey.label}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', marginBottom: 6 }}>Solución actual:</div>
                            <textarea
                              value={cell.current}
                              onChange={e => updateCell(key, { current: e.target.value })}
                              placeholder="¿Cómo lo haces hoy?"
                              rows={2}
                              style={{ width: '100%', fontSize: 10, padding: 6, background: 'var(--cs-surface)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)', resize: 'vertical', marginBottom: 6 }}
                            />
                            <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', marginBottom: 4 }}>Oportunidad tecnológica:</div>
                            <textarea
                              value={cell.opportunity}
                              onChange={e => updateCell(key, { opportunity: e.target.value })}
                              placeholder="¿Qué tecnología nueva lo haría mejor?"
                              rows={2}
                              style={{ width: '100%', fontSize: 10, padding: 6, background: 'var(--cs-surface)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)', resize: 'vertical', marginBottom: 6 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 9, color: 'var(--cs-text-muted)' }}>Madurez:</span>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={cell.maturity}
                                onChange={e => updateCell(key, { maturity: Number(e.target.value) })}
                                style={{ flex: 1, accentColor: star.color }}
                              />
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cs-text)', width: 30 }}>{cell.maturity}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STAR Legend with tech examples */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 12 }}>Tecnologías de Referencia por Fase STAR</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { phase: 'SENSE', techs: ['IoT Sensors', 'Voice/Gesture UI', 'Wearables', 'AR/VR', 'Computer Vision'] },
            { phase: 'TRANSMIT', techs: ['5G / LoRa', 'Bluetooth LE', 'Blockchain', 'API Gateway', 'Event Streaming'] },
            { phase: 'ANALYZE', techs: ['Cloud ML', 'Deep Learning', 'Predictive Analytics', 'NLP', 'Graph DB'] },
            { phase: 'REACT', techs: ['AI Chatbots', '3D Printing', 'Autonomous Delivery', 'Robotic Process', 'AR Response'] },
          ].map(({ phase, techs }, i) => (
            <div key={phase}>
              <div style={{ fontSize: 11, fontWeight: 700, color: STAR_PHASES[i].color, marginBottom: 6 }}>{STAR_PHASES[i].emoji} {phase}</div>
              {techs.map(t => (
                <div key={t} style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginBottom: 3 }}>• {t}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
