/**
 * Efficiency Frontier — Interactive WTP vs Cost scatter plot
 * WS12 visual implementation with Pareto frontier and CA calculator.
 * Source: Connected Strategy Workshop 1, Step 4
 */
import React, { useState, useCallback, useMemo } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

interface Entity {
  id: string;
  name: string;
  wtp: number;
  cost: number;
  isOwn: boolean;
}

const DEFAULT_ENTITIES: Entity[] = [
  { id: 'own', name: 'Mi Empresa', wtp: 65, cost: 40, isOwn: true },
  { id: 'c1', name: 'Competidor A', wtp: 55, cost: 50, isOwn: false },
  { id: 'c2', name: 'Competidor B', wtp: 75, cost: 65, isOwn: false },
  { id: 'c3', name: 'Competidor C', wtp: 45, cost: 30, isOwn: false },
];

function computePareto(entities: Entity[]): string[] {
  const sorted = [...entities].sort((a, b) => a.cost - b.cost);
  const frontier: string[] = [];
  let maxWtp = -1;
  for (const e of sorted) {
    if (e.wtp > maxWtp) {
      frontier.push(e.id);
      maxWtp = e.wtp;
    }
  }
  return frontier;
}

const CHART_W = 560;
const CHART_H = 400;
const PAD = 50;

function scaleX(cost: number): number {
  return PAD + ((100 - cost) / 100) * (CHART_W - 2 * PAD);
}
function scaleY(wtp: number): number {
  return CHART_H - PAD - (wtp / 100) * (CHART_H - 2 * PAD);
}

export function EfficiencyFrontierPage() {
  const [entities, setEntities] = useState<Entity[]>(DEFAULT_ENTITIES);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const frontierIds = useMemo(() => computePareto(entities), [entities]);
  const own = entities.find(e => e.isOwn);

  const advantages = useMemo(() => {
    if (!own) return [];
    const ownValue = own.wtp - own.cost;
    return entities.filter(e => !e.isOwn).map(c => ({
      ...c,
      ownValue,
      compValue: c.wtp - c.cost,
      advantage: ownValue - (c.wtp - c.cost),
    }));
  }, [entities, own]);

  const handleMouseDown = useCallback((id: string) => setDragId(id), []);
  const handleMouseUp = useCallback(() => setDragId(null), []);
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragId) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cost = 100 - ((x - PAD) / (CHART_W - 2 * PAD)) * 100;
    const wtp = ((CHART_H - PAD - y) / (CHART_H - 2 * PAD)) * 100;
    setEntities(prev => prev.map(en =>
      en.id === dragId
        ? { ...en, wtp: Math.max(0, Math.min(100, Math.round(wtp))), cost: Math.max(0, Math.min(100, Math.round(cost))) }
        : en
    ));
  }, [dragId]);

  const addCompetitor = () => {
    const id = `c${Date.now()}`;
    setEntities(prev => [...prev, { id, name: `Nuevo ${prev.length}`, wtp: 50, cost: 50, isOwn: false }]);
  };

  const removeEntity = (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
  };

  const updateName = (id: string, name: string) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, name } : e));
  };

  // Build frontier line
  const frontierEntities = entities.filter(e => frontierIds.includes(e.id))
    .sort((a, b) => a.cost - b.cost);
  const frontierPath = frontierEntities.length > 1
    ? 'M ' + frontierEntities.map(e => `${scaleX(e.cost)},${scaleY(e.wtp)}`).join(' L ')
    : '';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📈 Frontera de Eficiencia</h1>
        <p className="page-subtitle">
          Posiciona tu empresa y competidores en WTP vs Costo. Arrastra los puntos para simular escenarios.
          <br /><strong>CA = (WTP - Cost)<sub>Tú</sub> − (WTP - Cost)<sub>Competidor</sub></strong>
        </p>
      </div>
      <ProjectBanner context="Frontera de Eficiencia" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <svg
            width={CHART_W} height={CHART_H}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: dragId ? 'grabbing' : 'default', background: 'var(--cs-surface)', borderRadius: '12px' }}
          >
            {/* Grid */}
            {[0, 25, 50, 75, 100].map(v => (
              <React.Fragment key={v}>
                <line x1={scaleX(v)} y1={PAD} x2={scaleX(v)} y2={CHART_H - PAD} stroke="var(--cs-border)" strokeWidth={0.5} strokeDasharray="4,4" />
                <line x1={PAD} y1={scaleY(v)} x2={CHART_W - PAD} y2={scaleY(v)} stroke="var(--cs-border)" strokeWidth={0.5} strokeDasharray="4,4" />
                <text x={scaleX(v)} y={CHART_H - PAD + 18} textAnchor="middle" fill="var(--cs-text-muted)" fontSize={10}>{100 - v}</text>
                <text x={PAD - 8} y={scaleY(v) + 4} textAnchor="end" fill="var(--cs-text-muted)" fontSize={10}>{v}</text>
              </React.Fragment>
            ))}

            {/* Axis labels */}
            <text x={CHART_W / 2} y={CHART_H - 5} textAnchor="middle" fill="var(--cs-text)" fontSize={12} fontWeight={600}>
              ← Menor Costo (mejor) — Fulfillment Cost — Mayor Costo (peor) →
            </text>
            <text x={12} y={CHART_H / 2} textAnchor="middle" fill="var(--cs-text)" fontSize={12} fontWeight={600}
              transform={`rotate(-90, 12, ${CHART_H / 2})`}>
              WTP (Willingness-to-Pay) →
            </text>

            {/* Frontier line */}
            {frontierPath && (
              <path d={frontierPath} fill="none" stroke="var(--cs-accent)" strokeWidth={2.5} strokeDasharray="8,4" opacity={0.7} />
            )}

            {/* Frontier area fill */}
            {frontierEntities.length > 1 && (
              <path
                d={`${frontierPath} L ${scaleX(frontierEntities[frontierEntities.length - 1].cost)},${PAD} L ${scaleX(frontierEntities[0].cost)},${PAD} Z`}
                fill="var(--cs-accent)" opacity={0.06}
              />
            )}

            {/* Points */}
            {entities.map(e => {
              const onFrontier = frontierIds.includes(e.id);
              const cx = scaleX(e.cost);
              const cy = scaleY(e.wtp);
              return (
                <g key={e.id} onMouseDown={() => handleMouseDown(e.id)} style={{ cursor: 'grab' }}>
                  {/* Glow for own */}
                  {e.isOwn && <circle cx={cx} cy={cy} r={18} fill="var(--cs-accent)" opacity={0.15} />}
                  <circle
                    cx={cx} cy={cy}
                    r={e.isOwn ? 10 : 7}
                    fill={e.isOwn ? 'var(--cs-accent)' : onFrontier ? '#10b981' : '#ef4444'}
                    stroke={e.isOwn ? '#fff' : onFrontier ? '#059669' : '#dc2626'}
                    strokeWidth={2}
                    opacity={0.9}
                  />
                  <text
                    x={cx} y={cy - 14}
                    textAnchor="middle" fill="var(--cs-text)" fontSize={11} fontWeight={e.isOwn ? 700 : 400}
                  >
                    {e.name}
                  </text>
                  <text
                    x={cx} y={cy + 22}
                    textAnchor="middle" fill="var(--cs-text-muted)" fontSize={9}
                  >
                    V={e.wtp - e.cost}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <circle cx={CHART_W - 140} cy={PAD + 10} r={6} fill="var(--cs-accent)" />
            <text x={CHART_W - 128} y={PAD + 14} fill="var(--cs-text)" fontSize={10}>Tu empresa</text>
            <circle cx={CHART_W - 140} cy={PAD + 28} r={5} fill="#10b981" />
            <text x={CHART_W - 128} y={PAD + 32} fill="var(--cs-text)" fontSize={10}>En frontera</text>
            <circle cx={CHART_W - 140} cy={PAD + 46} r={5} fill="#ef4444" />
            <text x={CHART_W - 128} y={PAD + 50} fill="var(--cs-text)" fontSize={10}>Dominado</text>
          </svg>
        </div>

        {/* Sidebar controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Entity list */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>🏢 Entidades</h3>
            {entities.map(e => (
              <div key={e.id} style={{
                padding: '8px', marginBottom: '8px', borderRadius: '8px',
                background: e.isOwn ? 'rgba(99,102,241,0.1)' : 'var(--cs-surface)',
                border: '1px solid var(--cs-border)',
              }}>
                {editingId === e.id ? (
                  <input
                    value={e.name}
                    onChange={ev => updateName(e.id, ev.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={ev => ev.key === 'Enter' && setEditingId(null)}
                    autoFocus
                    style={{ width: '100%', padding: '4px', fontSize: '12px', background: 'var(--cs-bg)', border: '1px solid var(--cs-accent)', borderRadius: '4px', color: 'var(--cs-text)' }}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: e.isOwn ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}
                      onClick={() => setEditingId(e.id)}>
                      {e.isOwn ? '⭐ ' : ''}{e.name}
                    </span>
                    {!e.isOwn && (
                      <button onClick={() => removeEntity(e.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11px', color: 'var(--cs-text-muted)' }}>
                  <span>WTP: <strong style={{ color: 'var(--cs-text)' }}>{e.wtp}</strong></span>
                  <span>Cost: <strong style={{ color: 'var(--cs-text)' }}>{e.cost}</strong></span>
                  <span>Value: <strong style={{ color: e.wtp - e.cost > 0 ? '#10b981' : '#ef4444' }}>{e.wtp - e.cost}</strong></span>
                </div>
              </div>
            ))}
            <button onClick={addCompetitor}
              style={{
                width: '100%', padding: '8px', background: 'var(--cs-surface)', border: '1px dashed var(--cs-border)',
                borderRadius: '8px', color: 'var(--cs-text-muted)', cursor: 'pointer', fontSize: '12px',
              }}>
              + Agregar Competidor
            </button>
          </div>

          {/* CA Calculator */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>🏆 Ventaja Competitiva</h3>
            {advantages.map(a => (
              <div key={a.id} style={{
                padding: '8px', marginBottom: '8px', borderRadius: '8px',
                background: a.advantage > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${a.advantage > 0 ? '#10b981' : '#ef4444'}`,
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>vs {a.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--cs-text-muted)', marginTop: '4px' }}>
                  Tú: {a.ownValue} − Ellos: {a.compValue} = <strong style={{
                    color: a.advantage > 0 ? '#10b981' : '#ef4444', fontSize: '14px'
                  }}>{a.advantage > 0 ? '+' : ''}{a.advantage}</strong>
                </div>
                <div style={{ fontSize: '10px', marginTop: '2px', color: a.advantage > 0 ? '#10b981' : '#ef4444' }}>
                  {a.advantage > 0 ? '✅ GANANDO' : '❌ PERDIENDO'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 12px' }}>📖 ¿Qué es la Frontera de Eficiencia?</h3>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--cs-text-muted)', fontSize: '14px' }}>
          La <strong>frontera de eficiencia</strong> muestra las empresas que no están "dominadas" por nadie — es decir,
          no existe otra empresa que sea <em>simultáneamente</em> mejor en WTP y menor en costo.
          Si estás <span style={{ color: '#ef4444' }}>debajo de la frontera</span>, hay un competidor que te supera en ambas dimensiones.
          Tu objetivo es <strong>empujar la frontera hacia arriba-izquierda</strong>: más valor para el cliente a menor costo.
          <br /><br />
          <strong>Fórmula:</strong> Value Created = WTP − Cost. Competitive Advantage = Value<sub>Tú</sub> − Value<sub>Competidor</sub>
          <br /><br />
          <em>Fuente: Connected Strategy, Siggelkow & Terwiesch, Workshop 1 Step 4, Capítulo 2.</em>
        </p>
      </div>
    </div>
  );
}
