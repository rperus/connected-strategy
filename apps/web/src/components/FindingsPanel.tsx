import React from 'react';
import type { Finding } from '../hooks/useFindings';

const severityColor = (s: string) => s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#10b981';
const severityBg = (s: string) => s === 'high' ? 'rgba(239,68,68,0.08)' : s === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';

interface Props {
  findings: Finding[];
  source: 'api' | 'empty';
  loading: boolean;
  title?: string;
}

export function FindingsPanel({ findings, source, loading, title = 'Hallazgos del Pipeline' }: Props) {
  if (loading) {
    return (
      <div style={{ padding: '16px 0', fontSize: 12, color: 'var(--cs-text-muted)' }}>
        ⟳ Cargando hallazgos del pipeline...
      </div>
    );
  }

  if (source === 'empty' || findings.length === 0) {
    return (
      <div style={{
        padding: '16px', background: 'var(--cs-surface)', borderRadius: 8,
        fontSize: 12, color: 'var(--cs-text-dim)', textAlign: 'center',
      }}>
        Sin hallazgos del pipeline. Corre 🚀 Pipeline Completo desde Inicio para generar datos reales.
      </div>
    );
  }

  const high = findings.filter(f => f.finding.severity === 'high').length;
  const med = findings.filter(f => f.finding.severity === 'medium').length;
  const low = findings.filter(f => f.finding.severity === 'low').length;

  // Group by project
  const projectMap = new Map<string, Finding[]>();
  for (const f of findings) {
    const arr = projectMap.get(f.projectName) ?? [];
    arr.push(f);
    projectMap.set(f.projectName, arr);
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cs-text)' }}>{title}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
          <span className="badge badge-success" style={{ fontSize: 10 }}>Pipeline real ✓</span>
          {high > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴 {high}</span>}
          {med > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}>🟡 {med}</span>}
          {low > 0 && <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 {low}</span>}
        </div>
      </div>

      {[...projectMap.entries()].map(([projectName, projectFindings]) => (
        <details key={projectName} open={projectMap.size <= 3}>
          <summary style={{
            cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--cs-accent)',
            marginBottom: 8, padding: '6px 0',
          }}>
            {projectName} ({projectFindings.length} hallazgos)
          </summary>

          {projectFindings
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return (order[a.finding.severity] ?? 3) - (order[b.finding.severity] ?? 3);
            })
            .map((f, i) => (
              <div key={i} style={{
                padding: '10px 14px', marginBottom: 6, borderRadius: 6,
                background: severityBg(f.finding.severity),
                borderLeft: `3px solid ${severityColor(f.finding.severity)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{f.finding.title}</span>
                  <span style={{
                    padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                    color: severityColor(f.finding.severity),
                    background: 'rgba(0,0,0,0.06)',
                  }}>
                    {f.finding.severity}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', lineHeight: 1.4 }}>
                  {f.finding.detail}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 10, color: 'var(--cs-text-dim)' }}>
                  <span>📂 {f.finding.category}</span>
                  <span>🔄 {f.finding.loopPhase}</span>
                </div>
              </div>
            ))
          }
        </details>
      ))}
    </div>
  );
}
