/**
 * Executive Briefing Page — One-click portfolio intelligence export
 *
 * Generates a structured strategic briefing:
 * - Portfolio health summary
 * - Top 3 strategic priorities (highest impact)
 * - Per-project executive paragraph
 * - Antigravity-ready prompt packet
 */
import React, { useState } from 'react';
import { MOCK_METRICS, MOCK_PROJECTS, MOCK_PROPOSALS } from '../mockData';
import { ProjectBanner } from '../components/ProjectBanner';

function getQuadrant(wtp: number, sci: number): string {
  if (wtp >= 50 && sci >= 50) return 'Trusted Partner 🤝';
  if (wtp >= 50 && sci < 50)  return 'Coach Behavior 🎓';
  if (wtp < 50  && sci >= 50) return 'Curated Offering 📋';
  return 'Respond to Desire 📦';
}

function scoreColor(s: number) {
  if (s >= 70) return '#22c55e';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

export function BriefingPage() {
  const [copied, setCopied] = useState(false);

  const projects = MOCK_PROJECTS;
  const metrics = MOCK_METRICS;
  const proposals = MOCK_PROPOSALS;

  const sorted = [...projects].sort(
    (a, b) => (metrics[b.id]?.strategicAdvantageComposite ?? 0) - (metrics[a.id]?.strategicAdvantageComposite ?? 0),
  );

  const avgSAC = Math.round(
    projects.reduce((s, p) => s + (metrics[p.id]?.strategicAdvantageComposite ?? 0), 0) / projects.length,
  );

  const topProject = sorted[0];
  const weakestProject = sorted[sorted.length - 1];

  const topProposals = [...proposals]
    .filter(p => p.status !== 'implemented')
    .sort((a, b) => {
      const score = (p: typeof a) =>
        (p.strategicMapping.raisesWTP ? 2 : 0) +
        (p.strategicMapping.increasesSwitchingCosts ? 2 : 0) +
        (p.riskLevel === 'low' ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 3);

  // Generate Antigravity prompt
  function generatePrompt(): string {
    const lines: string[] = [
      `# Portfolio Strategic Briefing — Connected Strategy`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      ``,
      `## Portfolio Health`,
      `- Average SAC: ${avgSAC}/100`,
      `- Strongest: ${topProject?.name} (SAC=${metrics[topProject?.id]?.strategicAdvantageComposite})`,
      `- Weakest: ${weakestProject?.name} (SAC=${metrics[weakestProject?.id]?.strategicAdvantageComposite})`,
      ``,
      `## Projects Status`,
      ...sorted.map(p => {
        const m = metrics[p.id];
        if (!m) return '';
        return `- **${p.name}** | SAC=${m.strategicAdvantageComposite} | WTP=${m.wtpUpliftIndex} | SCI=${m.switchingCostIndex} | ${getQuadrant(m.wtpUpliftIndex, m.switchingCostIndex)}`;
      }),
      ``,
      `## Top Priorities`,
      ...topProposals.map((p, i) =>
        `${i + 1}. [${p.projectId}] **${p.title}** — ${p.expectedImpact} (Risk: ${p.riskLevel})`
      ),
      ``,
      `## Instructions for Antigravity`,
      `Execute proposals in priority order above. For each:`,
      `1. Verify acceptance criteria before closing`,
      `2. Re-run pipeline after implementation to measure SAC delta`,
      `3. Target: move all B2B projects to Trusted Partner quadrant (WTP>50, SCI>50)`,
    ];
    return lines.join('\n');
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatePrompt()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Briefing Ejecutivo</h1>
        <p className="page-subtitle">
          Inteligencia estratégica del portfolio · Export listo para Antigravity · Wharton Connected Strategy
        </p>
      </div>
      <ProjectBanner context="Executive Briefing" />

      {/* Portfolio KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'SAC Promedio', value: avgSAC, suffix: '/100', color: scoreColor(avgSAC) },
          { label: 'Proyectos', value: projects.length, suffix: '', color: '#6366f1' },
          { label: 'Propuestas Activas', value: proposals.filter(p => p.status !== 'implemented').length, suffix: '', color: '#f59e0b' },
          { label: 'Mejor SAC', value: metrics[topProject?.id]?.strategicAdvantageComposite ?? 0, suffix: '/100', color: '#22c55e' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color }}>{kpi.value}<span style={{ fontSize: 12 }}>{kpi.suffix}</span></div>
            <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Portfolio ranking */}
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 14 }}>🏆 Ranking del Portfolio</div>
          {sorted.map((p, i) => {
            const m = metrics[p.id];
            if (!m) return null;
            const sac = m.strategicAdvantageComposite;
            const q = getQuadrant(m.wtpUpliftIndex, m.switchingCostIndex);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--cs-surface-2)' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor(sac), minWidth: 28 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(sac) }}>{sac}/100</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--cs-surface-2)', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${sac}%`, borderRadius: 2, background: scoreColor(sac), transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--cs-text-muted)' }}>WTP {m.wtpUpliftIndex} · SCI {m.switchingCostIndex}</span>
                    <span style={{ fontSize: 9, color: '#6366f1' }}>{q}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Top priorities + export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Top 3 proposals */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 14 }}>🎯 Top 3 Prioridades Estratégicas</div>
            {topProposals.map((prop, i) => (
              <div key={prop.id} style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--cs-surface-2)', borderLeft: `3px solid ${i === 0 ? '#22c55e' : i === 1 ? '#f59e0b' : '#6366f1'}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: i === 0 ? '#22c55e' : i === 1 ? '#f59e0b' : '#6366f1', minWidth: 20 }}>P{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{prop.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginBottom: 4, lineHeight: 1.5 }}>{prop.expectedImpact}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>{prop.projectId}</span>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: prop.riskLevel === 'low' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: prop.riskLevel === 'low' ? '#22c55e' : '#f59e0b' }}>
                        riesgo: {prop.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Export */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>⚡ Export para Antigravity</div>
            <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Genera un prompt completo con el estado del portfolio, prioridades y acceptance criteria. Pégalo directamente en Antigravity para ejecutar.
            </div>
            <button
              onClick={handleCopy}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)',
                border: `1px solid ${copied ? '#22c55e' : '#6366f1'}`,
                color: copied ? '#22c55e' : '#6366f1',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✅ Copiado al clipboard!' : '📋 Copiar Prompt para Antigravity'}
            </button>
          </div>

          {/* Strategic narrative */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>📝 Narrativa Estratégica</div>
            <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--cs-text)' }}>{topProject?.name}</strong> lidera el portfolio con SAC={metrics[topProject?.id]?.strategicAdvantageComposite} — única plataforma con revenue real y ML en producción.
              <br /><br />
              <strong style={{ color: '#f59e0b' }}>Brecha crítica:</strong> {weakestProject?.name} con SAC={metrics[weakestProject?.id]?.strategicAdvantageComposite} tiene el mayor gap entre valor del problema y madurez de la solución.
              <br /><br />
              <strong style={{ color: '#22c55e' }}>Próximo milestone:</strong> Migrar todos los proyectos B2B al cuadrante Trusted Partner (WTP &gt; 50, SCI &gt; 50).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
