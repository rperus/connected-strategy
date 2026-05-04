/**
 * Strategy Matrix Page — Connected Strategy Matrix 5×4
 * WS13 visual implementation: 4 experiences × 5 architectures
 * Source: Connected Strategy, Chapter 7, Figure 7-6, Workshop 3 Steps 1-2
 */
import React, { useState } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

const EXPERIENCES = [
  { key: 'respond-to-desire', label: 'Respond-to-Desire', emoji: '🎯', desc: 'Reaccionas cuando el cliente pide algo explícitamente' },
  { key: 'curated-offering', label: 'Curated Offering', emoji: '✨', desc: 'Filtras y presentas opciones relevantes proactivamente' },
  { key: 'coach-behavior', label: 'Coach Behavior', emoji: '🏋️', desc: 'Guías al cliente hacia mejores resultados con nudges' },
  { key: 'automatic-execution', label: 'Automatic Execution', emoji: '⚡', desc: 'Actúas automáticamente sin que el cliente lo pida' },
];

const ARCHITECTURES = [
  { key: 'connected-producer', label: 'Connected Producer', emoji: '🏭', desc: 'Fabricas y conectas directamente al cliente (ej: Disney, Nike)' },
  { key: 'connected-retailer', label: 'Connected Retailer', emoji: '🛒', desc: 'Vendes productos de otros con experiencia conectada (ej: Amazon, Netflix)' },
  { key: 'connected-market-maker', label: 'Market Maker', emoji: '🔗', desc: 'Conectas compradores con vendedores existentes (ej: Expedia, OpenTable)' },
  { key: 'crowd-orchestrator', label: 'Crowd Orchestrator', emoji: '👥', desc: 'Movilizas personas como proveedores (ej: Uber, Airbnb, Kickstarter)' },
  { key: 'p2p-network', label: 'P2P Network', emoji: '🌐', desc: 'Creas red donde todos son productores y consumidores (ej: Venmo, LinkedIn)' },
];

interface CellData {
  occupants: Array<{ name: string; isOwn: boolean }>;
  notes: string;
}

type MatrixState = Record<string, CellData>;

function cellKey(exp: string, arch: string): string {
  return `${exp}__${arch}`;
}

export function StrategyMatrixPage() {
  const [matrix, setMatrix] = useState<MatrixState>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isOwn, setIsOwn] = useState(false);

  const getCell = (key: string): CellData => matrix[key] || { occupants: [], notes: '' };

  const addOccupant = (key: string) => {
    if (!newName.trim()) return;
    const cell = getCell(key);
    setMatrix(prev => ({
      ...prev,
      [key]: {
        ...cell,
        occupants: [...cell.occupants, { name: newName.trim(), isOwn }],
      },
    }));
    setNewName('');
    setIsOwn(false);
  };

  const removeOccupant = (key: string, idx: number) => {
    const cell = getCell(key);
    setMatrix(prev => ({
      ...prev,
      [key]: {
        ...cell,
        occupants: cell.occupants.filter((_, i) => i !== idx),
      },
    }));
  };

  const updateNotes = (key: string, notes: string) => {
    const cell = getCell(key);
    setMatrix(prev => ({ ...prev, [key]: { ...cell, notes } }));
  };

  const filledCount = Object.values(matrix).filter(c => c.occupants.length > 0).length;
  const totalCells = EXPERIENCES.length * ARCHITECTURES.length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🧩 Matriz de Estrategia Conectada (5×4)</h1>
        <p className="page-subtitle">
          Mapea tu posición y la de tus competidores. Las celdas vacías son <strong>oportunidades de innovación</strong>.
          <span style={{ marginLeft: '12px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', fontSize: '12px' }}>
            {filledCount}/{totalCells} celdas ocupadas
          </span>
        </p>
      </div>
      <ProjectBanner context="Matriz 5×4" />

      {/* Matrix Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'separate', borderSpacing: '4px',
          fontSize: '12px',
        }}>
          <thead>
            <tr>
              <th style={{ width: '140px', padding: '12px', textAlign: 'left', color: 'var(--cs-text-muted)', fontSize: '11px' }}>
                Experiencia ↓ / Arquitectura →
              </th>
              {ARCHITECTURES.map(a => (
                <th key={a.key} style={{
                  padding: '10px', textAlign: 'center', borderRadius: '8px 8px 0 0',
                  background: 'var(--cs-surface)', border: '1px solid var(--cs-border)',
                  fontSize: '11px', fontWeight: 600,
                }}>
                  <div>{a.emoji}</div>
                  <div>{a.label}</div>
                  <div style={{ fontWeight: 400, color: 'var(--cs-text-muted)', fontSize: '10px', marginTop: '4px' }}>{a.desc}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXPERIENCES.map(exp => (
              <tr key={exp.key}>
                <td style={{
                  padding: '12px', background: 'var(--cs-surface)', borderRadius: '8px 0 0 8px',
                  border: '1px solid var(--cs-border)', fontWeight: 600, verticalAlign: 'top',
                }}>
                  <div>{exp.emoji} {exp.label}</div>
                  <div style={{ fontWeight: 400, color: 'var(--cs-text-muted)', fontSize: '10px', marginTop: '4px' }}>{exp.desc}</div>
                </td>
                {ARCHITECTURES.map(arch => {
                  const key = cellKey(exp.key, arch.key);
                  const cell = getCell(key);
                  const isActive = activeCell === key;
                  const isEmpty = cell.occupants.length === 0;
                  const hasOwn = cell.occupants.some(o => o.isOwn);

                  return (
                    <td key={arch.key} onClick={() => setActiveCell(isActive ? null : key)} style={{
                      padding: '10px', verticalAlign: 'top', cursor: 'pointer',
                      borderRadius: '8px', minHeight: '80px', minWidth: '120px',
                      background: hasOwn ? 'rgba(99,102,241,0.08)' : isEmpty ? 'rgba(16,185,129,0.04)' : 'var(--cs-surface)',
                      border: isActive ? '2px solid var(--cs-accent)' : `1px solid ${isEmpty ? 'rgba(16,185,129,0.2)' : 'var(--cs-border)'}`,
                      transition: 'all 0.15s ease',
                    }}>
                      {isEmpty ? (
                        <div style={{ textAlign: 'center', color: '#10b981', fontSize: '18px', opacity: 0.5 }}>
                          💡
                          <div style={{ fontSize: '10px', marginTop: '2px' }}>Oportunidad</div>
                        </div>
                      ) : (
                        <div>
                          {cell.occupants.map((o, i) => (
                            <div key={i} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 6px', marginBottom: '4px', marginRight: '4px',
                              borderRadius: '10px', fontSize: '10px',
                              background: o.isOwn ? 'rgba(99,102,241,0.2)' : 'rgba(239,68,68,0.1)',
                              color: o.isOwn ? 'var(--cs-accent)' : '#ef4444',
                              border: `1px solid ${o.isOwn ? 'var(--cs-accent)' : '#fca5a5'}`,
                            }}>
                              {o.isOwn ? '⭐' : '🏢'} {o.name}
                              {isActive && (
                                <span onClick={(e) => { e.stopPropagation(); removeOccupant(key, i); }}
                                  style={{ cursor: 'pointer', marginLeft: '2px' }}>✕</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline editor */}
                      {isActive && (
                        <div onClick={e => e.stopPropagation()} style={{ marginTop: '8px', borderTop: '1px solid var(--cs-border)', paddingTop: '8px' }}>
                          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                            <input
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              placeholder="Nombre..."
                              onKeyDown={e => e.key === 'Enter' && addOccupant(key)}
                              style={{
                                flex: 1, padding: '4px 6px', fontSize: '11px',
                                background: 'var(--cs-bg)', border: '1px solid var(--cs-border)',
                                borderRadius: '4px', color: 'var(--cs-text)',
                              }}
                            />
                            <button onClick={() => addOccupant(key)} style={{
                              padding: '4px 8px', fontSize: '10px', background: 'var(--cs-accent)',
                              border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer',
                            }}>+</button>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--cs-text-muted)' }}>
                            <input type="checkbox" checked={isOwn} onChange={e => setIsOwn(e.target.checked)} />
                            Es mi empresa
                          </label>
                          <textarea
                            value={cell.notes}
                            onChange={e => updateNotes(key, e.target.value)}
                            placeholder="Notas de oportunidad..."
                            rows={2}
                            style={{
                              width: '100%', marginTop: '6px', padding: '4px 6px', fontSize: '10px',
                              background: 'var(--cs-bg)', border: '1px solid var(--cs-border)',
                              borderRadius: '4px', color: 'var(--cs-text)', resize: 'vertical',
                            }}
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanation */}
      <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 12px' }}>📖 ¿Para qué sirve esta matriz?</h3>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--cs-text-muted)', fontSize: '14px' }}>
          La <strong>Connected Strategy Matrix</strong> cruza las 4 experiencias conectadas del cliente con las 5 arquitecturas
          de conexión. Cada celda representa una posible estrategia. <strong>Las celdas vacías son oportunidades de innovación:</strong>
          pregúntate "¿Qué pasaría si operáramos en esta celda?"
          <br /><br />
          Las empresas pueden ocupar múltiples celdas (ej: Amazon es Connected Retailer + Connected Market Maker, con experiencias
          desde Respond-to-Desire hasta Automatic Execution). El ejercicio te fuerza a pensar fuera de tu columna actual.
          <br /><br />
          <em>Fuente: Connected Strategy, Siggelkow & Terwiesch, Capítulo 7 Fig. 7-6, Workshop 3 Steps 1-2.</em>
        </p>
      </div>
    </div>
  );
}
