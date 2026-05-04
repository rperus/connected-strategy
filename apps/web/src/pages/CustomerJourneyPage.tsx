/**
 * Customer Journey Page — Interactive Timeline Visualization
 * Visualizes the Recognize → Request → Respond phases of connected experiences.
 * Source: Connected Strategy Ch. 4, Figures 4-1 through 4-4, Workshop 2 Step 1
 */
import React, { useState } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

interface JourneyStep {
  id: string;
  label: string;
  description: string;
  painLevel: number; // 0-10
  phase: 'recognize' | 'request' | 'respond' | 'repeat';
  owner: 'customer' | 'firm' | 'shared';
}

const PHASE_CONFIG = {
  recognize: { color: '#6366f1', label: 'Recognize', emoji: '👁️', desc: 'El cliente se da cuenta de su necesidad' },
  request: { color: '#f59e0b', label: 'Request', emoji: '🗣️', desc: 'El cliente identifica y solicita una solución' },
  respond: { color: '#22c55e', label: 'Respond', emoji: '✅', desc: 'La firma entrega la solución deseada' },
  repeat: { color: '#ec4899', label: 'Repeat', emoji: '🔄', desc: 'Aprender y mejorar para la próxima interacción' },
};

const EXPERIENCE_TYPES = [
  { key: 'respond-to-desire', label: 'Respond-to-Desire', desc: 'La firma reacciona rápidamente a pedidos explícitos', firmStart: 'respond', color: '#3b82f6' },
  { key: 'curated-offering', label: 'Curated Offering', desc: 'La firma recomienda opciones proactivamente', firmStart: 'request', color: '#8b5cf6' },
  { key: 'coach-behavior', label: 'Coach Behavior', desc: 'La firma guía al cliente hacia mejores resultados', firmStart: 'recognize', color: '#f59e0b' },
  { key: 'automatic-execution', label: 'Automatic Execution', desc: 'La firma actúa sin esperar que el cliente pida', firmStart: 'recognize', color: '#ef4444' },
];

const INITIAL_STEPS: JourneyStep[] = [
  { id: 's1', label: 'Necesidad latente', description: 'El cliente aún no sabe que necesita algo', painLevel: 0, phase: 'recognize', owner: 'customer' },
  { id: 's2', label: 'Toma de conciencia', description: 'El cliente se da cuenta de la necesidad', painLevel: 3, phase: 'recognize', owner: 'customer' },
  { id: 's3', label: 'Búsqueda de opciones', description: 'El cliente investiga alternativas disponibles', painLevel: 6, phase: 'request', owner: 'customer' },
  { id: 's4', label: 'Selección de opción', description: 'El cliente elige la mejor alternativa', painLevel: 5, phase: 'request', owner: 'shared' },
  { id: 's5', label: 'Solicitud / Compra', description: 'El cliente coloca la orden', painLevel: 4, phase: 'request', owner: 'shared' },
  { id: 's6', label: 'Entrega / Cumplimiento', description: 'La firma provee el producto o servicio', painLevel: 3, phase: 'respond', owner: 'firm' },
  { id: 's7', label: 'Uso / Consumo', description: 'El cliente utiliza lo que recibió', painLevel: 2, phase: 'respond', owner: 'customer' },
  { id: 's8', label: 'Post-compra / Feedback', description: 'Evaluación y aprendizaje de la experiencia', painLevel: 1, phase: 'repeat', owner: 'shared' },
];

const OWNER_STYLE: Record<string, { bg: string; label: string }> = {
  customer: { bg: 'rgba(99,102,241,0.15)', label: '👤 Cliente' },
  firm: { bg: 'rgba(34,197,94,0.15)', label: '🏢 Firma' },
  shared: { bg: 'rgba(245,158,11,0.15)', label: '🤝 Compartido' },
};

export function CustomerJourneyPage() {
  const [steps, setSteps] = useState<JourneyStep[]>(INITIAL_STEPS);
  const [selectedType, setSelectedType] = useState('respond-to-desire');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const activeType = EXPERIENCE_TYPES.find(t => t.key === selectedType)!;
  const phases = ['recognize', 'request', 'respond', 'repeat'] as const;

  const addStep = () => {
    if (!newLabel.trim()) return;
    const newStep: JourneyStep = {
      id: `s${Date.now()}`,
      label: newLabel.trim(),
      description: '',
      painLevel: 5,
      phase: 'request',
      owner: 'customer',
    };
    setSteps(prev => [...prev, newStep]);
    setNewLabel('');
  };

  const updateStep = (id: string, updates: Partial<JourneyStep>) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const maxPain = Math.max(...steps.map(s => s.painLevel), 1);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🗺️ Customer Journey Map</h1>
        <p className="page-subtitle">
          Visualiza el viaje del cliente a través de las fases Recognize → Request → Respond → Repeat.
          Fuente: Connected Strategy Cap. 4, Figuras 4-1 a 4-4.
        </p>
      </div>
      <ProjectBanner context="Customer Journey" />

      {/* Experience type selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {EXPERIENCE_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => setSelectedType(t.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `2px solid ${selectedType === t.key ? t.color : 'var(--cs-border)'}`,
              background: selectedType === t.key ? `${t.color}18` : 'transparent',
              color: selectedType === t.key ? t.color : 'var(--cs-text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active type description */}
      <div className="card" style={{ marginBottom: 24, borderLeft: `3px solid ${activeType.color}`, padding: '14px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: activeType.color }}>{activeType.label}</div>
        <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginTop: 4 }}>{activeType.desc}</div>
        <div style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginTop: 4 }}>
          La firma se involucra desde la fase <strong>{PHASE_CONFIG[activeType.firmStart as keyof typeof PHASE_CONFIG].label}</strong>
        </div>
      </div>

      {/* Phase headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 6 }}>
        {phases.map(p => {
          const cfg = PHASE_CONFIG[p];
          const phaseIdx = phases.indexOf(p);
          const firmStartIdx = phases.indexOf(activeType.firmStart as typeof phases[number]);
          const isFirmActive = phaseIdx >= firmStartIdx;
          return (
            <div
              key={p}
              style={{
                background: `${cfg.color}18`,
                borderRadius: 8,
                padding: '10px 14px',
                borderBottom: `3px solid ${isFirmActive ? cfg.color : 'transparent'}`,
              }}
            >
              <div style={{ fontSize: 16 }}>{cfg.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
              <div style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{cfg.desc}</div>
              {isFirmActive && (
                <div style={{ fontSize: 9, color: activeType.color, fontWeight: 700, marginTop: 4 }}>🏢 FIRMA ACTIVA</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline visualization */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        {/* SVG Pain chart */}
        <svg width="100%" height={120} style={{ marginBottom: 4 }}>
          <defs>
            <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          {/* Pain area */}
          {steps.length > 1 && (
            <path
              d={
                `M ${(0 / (steps.length - 1)) * 100}%,${100 - (steps[0].painLevel / maxPain) * 80} ` +
                steps.map((s, i) => `L ${(i / (steps.length - 1)) * 100}%,${100 - (s.painLevel / maxPain) * 80}`).join(' ') +
                ` L 100%,100 L 0,100 Z`
              }
              fill="url(#painGrad)"
            />
          )}
          {/* Pain line */}
          {steps.length > 1 && (
            <polyline
              points={steps.map((s, i) => `${((i / (steps.length - 1)) * 100)}%,${100 - (s.painLevel / maxPain) * 80}`).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
            />
          )}
          {/* Pain dots */}
          {steps.map((s, i) => {
            const xPct = steps.length === 1 ? 50 : (i / (steps.length - 1)) * 100;
            return (
              <circle
                key={s.id}
                cx={`${xPct}%`}
                cy={100 - (s.painLevel / maxPain) * 80}
                r={4}
                fill={s.painLevel > 6 ? '#ef4444' : s.painLevel > 3 ? '#f59e0b' : '#22c55e'}
                stroke="#fff"
                strokeWidth={1.5}
              />
            );
          })}
          <text x={8} y={14} fill="var(--cs-text-muted)" fontSize={10}>Pain Level</text>
        </svg>

        {/* Step cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, 1fr)`, gap: 6 }}>
          {steps.map(s => {
            const phaseCfg = PHASE_CONFIG[s.phase];
            const ownerCfg = OWNER_STYLE[s.owner];
            return (
              <div
                key={s.id}
                className="card"
                style={{
                  padding: '10px 12px',
                  borderTop: `3px solid ${phaseCfg.color}`,
                  cursor: 'pointer',
                  background: ownerCfg.bg,
                  position: 'relative',
                  minHeight: 90,
                }}
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cs-text)', lineHeight: 1.3 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 4, lineHeight: 1.4 }}>{s.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: phaseCfg.color, fontWeight: 600 }}>{phaseCfg.label}</span>
                  <span style={{ fontSize: 9, color: 'var(--cs-text-dim)' }}>{ownerCfg.label}</span>
                </div>
                <div style={{ fontSize: 9, color: s.painLevel > 6 ? '#ef4444' : 'var(--cs-text-muted)', marginTop: 4 }}>
                  Pain: {s.painLevel}/10
                </div>

                {editingId === s.id && (
                  <div style={{ marginTop: 8, borderTop: '1px solid var(--cs-border)', paddingTop: 8 }} onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={s.label}
                      onChange={e => updateStep(s.id, { label: e.target.value })}
                      style={{ width: '100%', fontSize: 11, padding: '4px 6px', marginBottom: 4, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)' }}
                    />
                    <textarea
                      value={s.description}
                      onChange={e => updateStep(s.id, { description: e.target.value })}
                      rows={2}
                      style={{ width: '100%', fontSize: 10, padding: '4px 6px', marginBottom: 4, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>Pain:</label>
                      <input type="range" min={0} max={10} value={s.painLevel} onChange={e => updateStep(s.id, { painLevel: Number(e.target.value) })} style={{ flex: 1, accentColor: '#ef4444' }} />
                      <span style={{ fontSize: 10, width: 16 }}>{s.painLevel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select value={s.phase} onChange={e => updateStep(s.id, { phase: e.target.value as JourneyStep['phase'] })} style={{ fontSize: 10, padding: '2px 4px', background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)' }}>
                        {phases.map(p => <option key={p} value={p}>{PHASE_CONFIG[p].label}</option>)}
                      </select>
                      <select value={s.owner} onChange={e => updateStep(s.id, { owner: e.target.value as JourneyStep['owner'] })} style={{ fontSize: 10, padding: '2px 4px', background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 4, color: 'var(--cs-text)' }}>
                        <option value="customer">👤 Cliente</option>
                        <option value="firm">🏢 Firma</option>
                        <option value="shared">🤝 Compartido</option>
                      </select>
                      <button onClick={() => removeStep(s.id)} style={{ fontSize: 10, padding: '2px 6px', background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add step */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStep()}
          placeholder="Nuevo paso del journey..."
          style={{ flex: 1, padding: '8px 12px', fontSize: 12, background: 'var(--cs-surface-2)', border: '1px solid var(--cs-border)', borderRadius: 8, color: 'var(--cs-text)' }}
        />
        <button onClick={addStep} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Agregar</button>
      </div>
    </div>
  );
}
