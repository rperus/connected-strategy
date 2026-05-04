import React from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { MOCK_BM } from '../mockData';
import { useFindings } from '../hooks/useFindings';
import { FindingsPanel } from '../components/FindingsPanel';

const AGENT_IDS = ['business-model-analyst'];

export function BusinessModelPage() {
  const { findings, loading, source } = useFindings(AGENT_IDS);
  const bm = MOCK_BM;
  type Cell = { title: string; items: string[]; cls?: string; col?: string; row?: string };
  const cells: Cell[] = [
    { title: 'Partners Clave', items: bm.keyPartners },
    { title: 'Actividades Clave', items: bm.keyActivities },
    { title: 'Propuesta de Valor', items: [bm.valueProposition], cls: 'bmc-vp' },
    { title: 'Relación con Clientes', items: bm.customerRelationships },
    { title: 'Segmentos', items: bm.targetCustomerSegments },
    { title: '', items: [] },
    { title: 'Recursos Clave', items: bm.keyResources },
    { title: '', items: [] },
    { title: 'Canales', items: bm.channels },
    { title: '', items: [] },
    { title: 'Estructura de Costos', items: bm.costStructure },
    { title: '', items: [] },
    { title: 'Fuentes de Ingresos', items: bm.revenueStreams },
  ];

  const rows1 = [
    { title: 'Partners Clave', items: bm.keyPartners },
    { title: 'Actividades Clave', items: bm.keyActivities },
    { title: 'Recursos Clave', items: bm.keyResources },
  ];
  const rows2 = [
    { title: 'Relación con Clientes', items: bm.customerRelationships },
    { title: 'Canales', items: bm.channels },
    { title: 'Segmentos de Clientes', items: bm.targetCustomerSegments },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">◈ Business Model Canvas</h1>
        <p className="page-subtitle">
          Tipo Connected Strategy: <strong style={{ color: 'var(--cs-accent-hover)' }}>{bm.connectedStrategyType}</strong>
        </p>
      </div>
      <ProjectBanner context="Business Model" />

      {/* BMC simplified grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1fr 1fr', gap: 8, marginBottom: 28 }}>
        {/* Row 1 */}
        {rows1.map(cell => (
          <div key={cell.title} className="bmc-cell">
            <div className="bmc-cell-title">{cell.title}</div>
            <ul className="bmc-cell-list">{cell.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        ))}
        {/* Value Prop spans 2 rows */}
        <div className="bmc-cell" style={{ gridRow: '1 / 3', borderColor: 'var(--cs-accent)' }}>
          <div className="bmc-cell-title">Propuesta de Valor</div>
          <p style={{ fontSize: 12, color: 'var(--cs-text)', lineHeight: 1.6 }}>{bm.valueProposition}</p>
          <div style={{ marginTop: 12 }}>
            <div className="bmc-cell-title">Moat Sources</div>
            <ul className="bmc-cell-list">{bm.moatSources.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        </div>
        {/* Row 2 right */}
        {rows2.map(cell => (
          <div key={cell.title} className="bmc-cell">
            <div className="bmc-cell-title">{cell.title}</div>
            <ul className="bmc-cell-list">{cell.items.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        ))}
      </div>

      {/* Cost / Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="bmc-cell">
          <div className="bmc-cell-title">Estructura de Costos</div>
          <ul className="bmc-cell-list">{bm.costStructure.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        <div className="bmc-cell">
          <div className="bmc-cell-title">Fuentes de Ingresos</div>
          <ul className="bmc-cell-list">{bm.revenueStreams.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      </div>

      <FindingsPanel findings={findings} source={source} loading={loading} title="Hallazgos — Business Model" />
    </div>
  );
}
