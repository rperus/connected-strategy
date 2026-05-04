import React from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { MOCK_METRICS } from '../mockData';
import { useFindings } from '../hooks/useFindings';
import { FindingsPanel } from '../components/FindingsPanel';

const AGENT_IDS = ['architecture-improvement-analyst'];

export function ArchitecturePage() {
  const { findings, loading, source } = useFindings(AGENT_IDS);
  const m = MOCK_METRICS['balam-licitaciones'];
  const { score, inputs, rationale } = m.architectureResilienceBreakdown;

  const dims = [
    { label: 'Modularidad', score: inputs.modularity ?? 0, icon: '⬡', desc: 'Componentes acotados con contratos claros' },
    { label: 'Test Coverage', score: inputs.testCoverage ?? 0, icon: '✓', desc: '% de paths críticos con tests automatizados' },
    { label: 'Observabilidad', score: inputs.observability ?? 0, icon: '◎', desc: 'Logging, tracing y alertas' },
    { label: 'Recoverability', score: inputs.recoverability ?? 0, icon: '↺', desc: 'Velocidad de recuperación ante fallas' },
  ];

  const risks = [
    { risk: 'Test coverage < 60%', level: 'medium', mitigation: 'Añadir suite de integración para rutas críticas' },
    { risk: 'Sin circuit breakers en integraciones externas', level: 'high', mitigation: 'Implementar retry + fallback en conectores' },
    { risk: 'Logging sin correlación de request IDs', level: 'low', mitigation: 'Añadir traceId en middleware' },
  ];

  const lvlColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⬡ Arquitectura & Resiliencia</h1>
        <p className="page-subtitle">Modularidad, cobertura de tests, observabilidad y recuperación</p>
      </div>
      <ProjectBanner context="Arquitectura" />

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: score >= 70 ? '#22c55e' : '#f59e0b' }}>{score}</div>
          <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginTop: 4 }}>Resilience Score</div>
          <div className="score-bar" style={{ marginTop: 12 }}>
            <div className="score-fill" style={{ width: `${score}%`, background: '#34d399' }} />
          </div>
        </div>
        <div className="card">
          <div className="section-title">Evaluación</div>
          <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', lineHeight: 1.7 }}>{rationale}</p>
        </div>
      </div>

      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        {dims.map(d => (
          <div key={d.label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.icon} {d.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: d.score >= 70 ? '#22c55e' : d.score >= 50 ? '#f59e0b' : '#ef4444' }}>{d.score}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 10 }}>{d.desc}</div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${d.score}%`, background: '#34d399' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Lista de Riesgos</div>
      <div className="card">
        {risks.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < risks.length - 1 ? '1px solid var(--cs-border)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: lvlColor[r.level], marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.risk}</div>
              <div style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>Mitigación: {r.mitigation}</div>
            </div>
            <span className={`badge badge-${r.level === 'high' ? 'error' : r.level === 'medium' ? 'warning' : 'success'}`}>{r.level}</span>
          </div>
        ))}
      </div>

      <FindingsPanel findings={findings} source={source} loading={loading} title="Hallazgos — Arquitectura" />
    </div>
  );
}
