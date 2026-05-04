/**
 * Value Chain Page — Porter's Value Chain Analysis
 * Interactive visualization of primary and support activities.
 * Source: Wharton Competitive Advantage Module, Porter's Value Chain
 */
import React, { useState } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

interface Activity {
  id: string;
  name: string;
  description: string;
  costShare: number; // 0-100
  valueAdd: number;  // 0-100
  connectedOpportunity: string;
}

const PRIMARY_ACTIVITIES: Activity[] = [
  { id: 'inbound', name: 'Logística de Entrada', description: 'Recepción, almacenamiento y distribución de insumos', costShare: 15, valueAdd: 20, connectedOpportunity: '' },
  { id: 'operations', name: 'Operaciones', description: 'Transformación de insumos en producto final', costShare: 30, valueAdd: 35, connectedOpportunity: '' },
  { id: 'outbound', name: 'Logística de Salida', description: 'Distribución del producto al cliente', costShare: 15, valueAdd: 15, connectedOpportunity: '' },
  { id: 'marketing', name: 'Marketing y Ventas', description: 'Promoción, fuerza de ventas, canales', costShare: 25, valueAdd: 20, connectedOpportunity: '' },
  { id: 'service', name: 'Servicio', description: 'Soporte post-venta, instalación, garantías', costShare: 15, valueAdd: 10, connectedOpportunity: '' },
];

const SUPPORT_ACTIVITIES: Activity[] = [
  { id: 'infrastructure', name: 'Infraestructura', description: 'Administración, finanzas, legal, planeación', costShare: 20, valueAdd: 15, connectedOpportunity: '' },
  { id: 'hr', name: 'Gestión de RRHH', description: 'Reclutamiento, capacitación, compensación', costShare: 15, valueAdd: 10, connectedOpportunity: '' },
  { id: 'tech', name: 'Desarrollo Tecnológico', description: 'I+D, automatización, innovación de procesos', costShare: 25, valueAdd: 40, connectedOpportunity: '' },
  { id: 'procurement', name: 'Aprovisionamiento', description: 'Compras de materiales, servicios y activos', costShare: 40, valueAdd: 35, connectedOpportunity: '' },
];

const barColor = (score: number) => score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#6366f1';

export function ValueChainPage() {
  const [primaries, setPrimaries] = useState<Activity[]>(PRIMARY_ACTIVITIES);
  const [supports, setSupports] = useState<Activity[]>(SUPPORT_ACTIVITIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [marginNotes, setMarginNotes] = useState('');

  const updatePrimary = (id: string, updates: Partial<Activity>) => {
    setPrimaries(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const updateSupport = (id: string, updates: Partial<Activity>) => {
    setSupports(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const totalMargin = Math.round(
    [...primaries, ...supports].reduce((s, a) => s + (a.valueAdd - a.costShare), 0) / ([...primaries, ...supports].length)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⛓️ Cadena de Valor (Porter)</h1>
        <p className="page-subtitle">
          Analiza actividades primarias y de soporte para identificar fuentes de ventaja competitiva y oportunidades de conectividad.
          <span style={{ marginLeft: 12, padding: '4px 10px', borderRadius: 12, background: `${totalMargin >= 0 ? '#22c55e' : '#ef4444'}22`, color: totalMargin >= 0 ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
            Margen Neto: {totalMargin > 0 ? '+' : ''}{totalMargin}
          </span>
        </p>
      </div>
      <ProjectBanner context="Value Chain" />

      {/* Visual chain diagram */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        {/* Support activities (top bar) */}
        <div style={{ marginBottom: 4, fontSize: 10, fontWeight: 700, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Actividades de Soporte
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${supports.length}, 1fr)`, gap: 4, marginBottom: 8 }}>
          {supports.map(a => (
            <div
              key={a.id}
              onClick={() => setEditingId(editingId === a.id ? null : a.id)}
              style={{
                padding: '10px 12px',
                background: `rgba(139,92,246,0.08)`,
                borderRadius: 8,
                borderLeft: '3px solid #8b5cf6',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: editingId === a.id ? '2px solid #8b5cf6' : undefined,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>{a.name}</div>
              <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', marginTop: 2 }}>{a.description}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#ef4444' }}>Costo: {a.costShare}%</div>
                  <div className="score-bar" style={{ height: 4, marginTop: 2 }}>
                    <div className="score-fill" style={{ width: `${a.costShare}%`, background: '#ef4444' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#22c55e' }}>Valor: {a.valueAdd}%</div>
                  <div className="score-bar" style={{ height: 4, marginTop: 2 }}>
                    <div className="score-fill" style={{ width: `${a.valueAdd}%`, background: '#22c55e' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Primary activities (chevron flow) */}
        <div style={{ marginBottom: 4, fontSize: 10, fontWeight: 700, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Actividades Primarias
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
          {primaries.map((a, i) => (
            <div
              key={a.id}
              onClick={() => setEditingId(editingId === a.id ? null : a.id)}
              style={{
                flex: 1,
                padding: '14px 12px',
                background: 'rgba(99,102,241,0.08)',
                borderRadius: i === 0 ? '8px 0 0 8px' : i === primaries.length - 1 ? '0 8px 8px 0' : 0,
                borderRight: i < primaries.length - 1 ? '2px solid var(--cs-surface)' : undefined,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s',
                border: editingId === a.id ? '2px solid #6366f1' : undefined,
              }}
            >
              {/* Arrow indicator */}
              {i < primaries.length - 1 && (
                <div style={{
                  position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--cs-text-dim)', fontSize: 14, zIndex: 1,
                }}>→</div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{a.name}</div>
              <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', marginTop: 2, lineHeight: 1.3 }}>{a.description}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#ef4444' }}>Costo</div>
                  <div className="score-bar" style={{ height: 4, marginTop: 2 }}>
                    <div className="score-fill" style={{ width: `${a.costShare}%`, background: '#ef4444' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#22c55e' }}>Valor</div>
                  <div className="score-bar" style={{ height: 4, marginTop: 2 }}>
                    <div className="score-fill" style={{ width: `${a.valueAdd}%`, background: '#22c55e' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Margin arrow */}
          <div style={{
            width: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: `${totalMargin >= 0 ? '#22c55e' : '#ef4444'}15`,
            borderRadius: '0 8px 8px 0', padding: 8,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalMargin >= 0 ? '#22c55e' : '#ef4444' }}>
              {totalMargin > 0 ? '▲' : '▼'}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--cs-text-muted)', textAlign: 'center' }}>Margen</div>
          </div>
        </div>
      </div>

      {/* Detail editor for selected activity */}
      {editingId && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid #6366f1' }}>
          {(() => {
            const allActs = [...primaries, ...supports];
            const act = allActs.find(a => a.id === editingId);
            if (!act) return null;
            const isPrimary = primaries.some(p => p.id === editingId);
            const updater = isPrimary ? updatePrimary : updateSupport;
            return (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 12 }}>{act.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#ef4444' }}>Costo (%): {act.costShare}</label>
                    <input type="range" min={0} max={100} value={act.costShare} onChange={e => updater(act.id, { costShare: Number(e.target.value) })} style={{ width: '100%', accentColor: '#ef4444' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>Valor Agregado (%): {act.valueAdd}</label>
                    <input type="range" min={0} max={100} value={act.valueAdd} onChange={e => updater(act.id, { valueAdd: Number(e.target.value) })} style={{ width: '100%', accentColor: '#22c55e' }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#6366f1' }}>Oportunidad de Conectividad:</label>
                  <textarea
                    value={act.connectedOpportunity}
                    onChange={e => updater(act.id, { connectedOpportunity: e.target.value })}
                    placeholder="¿Cómo puede la conectividad mejorar esta actividad? (ej: IoT, automatización, datos en tiempo real)"
                    rows={2}
                    style={{ width: '100%', fontSize: 11, padding: 8, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)', resize: 'vertical', marginTop: 4 }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Margin notes */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cs-text)', marginBottom: 8 }}>📝 Análisis de Margen</div>
        <textarea
          value={marginNotes}
          onChange={e => setMarginNotes(e.target.value)}
          placeholder="¿Dónde están las mayores oportunidades de reducir costos o aumentar valor? ¿Qué actividades deberían priorizarse para conectividad?"
          rows={3}
          style={{ width: '100%', fontSize: 12, padding: 10, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 6, color: 'var(--cs-text)', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
