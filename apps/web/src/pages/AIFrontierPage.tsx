import React from 'react';
import { useFindings } from '../hooks/useFindings';
import { FindingsPanel } from '../components/FindingsPanel';

const AGENT_IDS = ['ai-frontier-analyst'];

const MATRIX = [
  { opportunity: 'Embeddings semánticos fine-tuned en dominio legal', value: 'Alto', feasibility: 'Alto', priority: 1 },
  { opportunity: 'Agente de monitoreo continuo de portales', value: 'Alto', feasibility: 'Medio', priority: 2 },
  { opportunity: 'Síntesis automática de licitaciones con LLM', value: 'Alto', feasibility: 'Alto', priority: 3 },
  { opportunity: 'Análisis de riesgo de propuesta con RAG', value: 'Medio', feasibility: 'Medio', priority: 4 },
  { opportunity: 'Predicción de adjudicación con histórico', value: 'Alto', feasibility: 'Bajo', priority: 5 },
  { opportunity: 'Recomendaciones de socios estratégicos via grafo', value: 'Medio', feasibility: 'Bajo', priority: 6 },
];

const CLR: Record<string, string> = { Alto: '#22c55e', Medio: '#f59e0b', Bajo: '#ef4444' };

export function AIFrontierPage() {
  const { findings, loading, source } = useFindings(AGENT_IDS);
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">✦ AI Frontier</h1>
        <p className="page-subtitle">Oportunidades de IA priorizadas por valor real, no por novedad</p>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--cs-surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #6366f1', fontSize: 12, color: 'var(--cs-text-muted)' }}>
        <strong style={{ color: 'var(--cs-text)' }}>Principio:</strong> Toda mejora de IA frontier debe ser priorizada por valor real, no por novedad.
        Requiere: contexto, evidencia, impacto esperado, riesgo, criterio de aceptación.
      </div>

      <div className="section-title" style={{ marginBottom: 12 }}>Matriz de Oportunidades</div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr><th>#</th><th>Oportunidad</th><th>Valor Estratégico</th><th>Factibilidad</th><th>Prioridad</th></tr>
          </thead>
          <tbody>
            {MATRIX.map(row => (
              <tr key={row.priority}>
                <td style={{ color: 'var(--cs-text-dim)' }}>{row.priority}</td>
                <td style={{ fontWeight: 500 }}>{row.opportunity}</td>
                <td><span style={{ color: CLR[row.value], fontWeight: 600 }}>● {row.value}</span></td>
                <td><span style={{ color: CLR[row.feasibility], fontWeight: 600 }}>● {row.feasibility}</span></td>
                <td>
                  <span className={`badge ${row.priority <= 2 ? 'badge-success' : row.priority <= 4 ? 'badge-warning' : 'badge-neutral'}`}>
                    {row.priority <= 2 ? 'Alta' : row.priority <= 4 ? 'Media' : 'Baja'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {['Corto Plazo (0-3m)', 'Mediano Plazo (3-6m)', 'Largo Plazo (6-12m)'].map((period, idx) => {
          const items = MATRIX.filter((_, i) => Math.floor(i / 2) === idx);
          return (
            <div key={period} className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cs-accent-hover)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{period}</div>
              {items.map(item => (
                <div key={item.priority} style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--cs-border)' }}>
                  {item.opportunity}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <FindingsPanel findings={findings} source={source} loading={loading} title="Hallazgos — AI Frontier" />
    </div>
  );
}
