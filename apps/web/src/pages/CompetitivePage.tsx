import React from 'react';
import { MOCK_LANDSCAPE } from '../mockData';
import { useFindings } from '../hooks/useFindings';
import { FindingsPanel } from '../components/FindingsPanel';

const AGENT_IDS = ['competitive-advantage-analyst'];

export function CompetitivePage() {
  const { findings, loading, source } = useFindings(AGENT_IDS);
  const { competitors, activitySystem, wtpNarrative, costNarrative, differentiationChoices, convergenceRisks, internalFit, externalFit, dynamicFit } = MOCK_LANDSCAPE;

  const pos: Record<string, string> = { higher: '↑ Higher', similar: '≈ Similar', lower: '↓ Lower' };
  const lvl: Record<string, string> = { high: 'badge-error', medium: 'badge-warning', low: 'badge-success' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚔ Ventaja Competitiva</h1>
        <p className="page-subtitle">Activity system, landscape y posicionamiento diferenciado</p>
      </div>

      {/* Fit summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Internal Fit', val: internalFit, color: '#6366f1' },
          { label: 'External Fit', val: externalFit, color: '#22c55e' },
          { label: 'Dynamic Fit', val: dynamicFit, color: '#f59e0b' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', lineHeight: 1.5 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Competitor table */}
      <div className="section-title" style={{ marginBottom: 12 }}>Landscape Competitivo</div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr><th>Competidor</th><th>Fortalezas</th><th>Debilidades</th><th>WTP</th><th>Costo</th><th>Switching</th></tr>
          </thead>
          <tbody>
            {competitors.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: 12 }}>{c.strengths.join(', ')}</td>
                <td style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>{c.weaknesses.join(', ')}</td>
                <td>{c.wtpPosition ? pos[c.wtpPosition] : '—'}</td>
                <td>{c.costPosition ? pos[c.costPosition] : '—'}</td>
                <td><span className={`badge ${lvl[c.switchingCostLevel ?? 'low']}`}>{c.switchingCostLevel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activity System */}
      <div className="section-title" style={{ marginBottom: 12 }}>Activity System</div>
      <div className="activity-grid" style={{ marginBottom: 28 }}>
        {activitySystem.map(node => (
          <div key={node.id} className={`activity-node${node.isCore ? ' core-node' : ''}`}>
            <div className="activity-node-label">
              {node.isCore && <span className="core-dot" />}{node.label}
            </div>
            <div className="activity-node-desc">{node.description}</div>
            {node.reinforces.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--cs-text-dim)', marginTop: 8 }}>
                Refuerza: {node.reinforces.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* WTP / Cost narratives */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Narrativa WTP</div>
          <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', lineHeight: 1.6 }}>{wtpNarrative}</p>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>Narrativa de Costos</div>
          <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', lineHeight: 1.6 }}>{costNarrative}</p>
        </div>
      </div>

      {/* Choices & risks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-title">✓ Trade-offs Estratégicos</div>
          {differentiationChoices.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#22c55e' }}>✓</span><span>{c}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-title">⚠ Riesgos de Convergencia</div>
          {convergenceRisks.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#ef4444' }}>⚠</span><span style={{ color: 'var(--cs-text-muted)' }}>{r}</span>
            </div>
          ))}
        </div>
      </div>

      <FindingsPanel findings={findings} source={source} loading={loading} title="Hallazgos — Ventaja Competitiva" />
    </div>
  );
}
