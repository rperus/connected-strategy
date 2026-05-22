import React from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { MOCK_METRICS } from '../mockData';
import { useFindings } from '../hooks/useFindings';
import { FindingsPanel } from '../components/FindingsPanel';

const AGENT_IDS = ['data-science-opportunity-analyst'];

export function DataSciencePage() {
  const { findings, loading, source } = useFindings(AGENT_IDS);
  const m = MOCK_METRICS['balam-licitaciones'];
  const { score, inputs, rationale } = m.dataScienceBreakdown;

  const areas = [
    { label: 'Disponibilidad de Datos', score: inputs.dataAvailability ?? 0, desc: 'Qué tan ricos y limpios son los datos para análisis' },
    { label: 'Cobertura de Instrumentación', score: inputs.instrumentationCoverage ?? 0, desc: 'Qué % de eventos clave son capturados' },
    { label: 'Capacidad de Modelado', score: inputs.modelingCapability ?? 0, desc: 'ML / estadística aplicada actualmente' },
    { label: 'Rigor Causal', score: inputs.rigorLevel ?? 0, desc: 'Distinción correlación vs causalidad (MITx DS standard)' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">∑ Data Science Readiness</h1>
        <p className="page-subtitle">Rigor analítico basado en MITx MicroMasters in Data Science</p>
      </div>
      <ProjectBanner context="Data Science" />

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444' }}>{score}</div>
          <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginTop: 4 }}>DS Readiness Score</div>
          <div className="score-bar" style={{ marginTop: 12 }}>
            <div className="score-fill" style={{ transform: `scaleX(${score / 100})`, background: '#a855f7' }} />
          </div>
        </div>
        <div className="card">
          <div className="section-title">Evaluación</div>
          <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', lineHeight: 1.7 }}>{rationale}</p>
          <div style={{ marginTop: 16, padding: 12, background: 'var(--cs-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--cs-text-muted)', borderLeft: '3px solid #a855f7' }}>
            <strong style={{ color: 'var(--cs-text)' }}>Principio MITx DS:</strong> No asumir correlación como causalidad.
            Toda mejora de data science debe justificar método, datos requeridos y nivel de rigor.
          </div>
        </div>
      </div>

      <div className="section-title">Áreas de Mejora</div>
      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        {areas.map(a => (
          <div key={a.label} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: a.score >= 70 ? '#22c55e' : a.score >= 50 ? '#f59e0b' : '#ef4444' }}>{a.score}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 10 }}>{a.desc}</div>
            <div className="score-bar">
              <div className="score-fill" style={{ transform: `scaleX(${a.score / 100})`, background: '#a855f7' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">Próximas Mejoras Recomendadas</div>
        {[
          { label: 'Módulo de análisis causal', phase: 'Analyze', impact: 'Alto — reduce riesgo de decisiones erróneas' },
          { label: 'Pipeline de embeddings con fine-tuning', phase: 'Transmit', impact: 'Alto — mejora recall en búsqueda semántica' },
          { label: 'A/B testing framework', phase: 'React', impact: 'Medio — habilita experimentación controlada' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cs-border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>{r.impact}</div>
            </div>
            <span className={`loop-phase phase-${r.phase.toLowerCase()}`}>{r.phase}</span>
          </div>
        ))}
      </div>

      <FindingsPanel findings={findings} source={source} loading={loading} title="Hallazgos — Data Science" />
    </div>
  );
}
