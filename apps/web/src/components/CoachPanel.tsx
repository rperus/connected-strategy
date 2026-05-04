/**
 * CoachPanel — Proactive Strategic Coach
 *
 * Acts as a Wharton-style strategic advisor that proactively surfaces:
 * - Critical gaps per project (Coach Behavior dimension)
 * - Cross-portfolio benchmarks
 * - Ranked strategic priorities with evidence
 *
 * This component transforms Connected Strategy from a passive dashboard
 * into an active coaching system — closing the loop from Analyze → React.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_METRICS, MOCK_PROJECTS } from '../mockData';
import type { StrategicMetrics, Project } from '@cs/domain';

interface CoachInsight {
  projectId: string;
  projectName: string;
  type: 'critical' | 'warning' | 'opportunity';
  dimension: string;
  score: number;
  message: string;
  action: string;
  actionRoute: string;
  whartonPrinciple: string;
}

function generateInsights(
  projects: Project[],
  metricsMap: Record<string, StrategicMetrics>,
): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const portfolioBestSAC = Math.max(...projects.map(p => metricsMap[p.id]?.strategicAdvantageComposite ?? 0));

  for (const project of projects) {
    const m = metricsMap[project.id];
    if (!m) continue;

    // Critical: No feedback loop (Closed Loop < 30)
    if (m.closedLoopMaturity < 30) {
      insights.push({
        projectId: project.id,
        projectName: project.name,
        type: 'critical',
        dimension: 'Closed Loop',
        score: m.closedLoopMaturity,
        message: `Sin ciclo cerrado — el sistema produce salidas pero no aprende de resultados.`,
        action: 'Diseñar loop de retroalimentación',
        actionRoute: '/worksheets',
        whartonPrinciple: 'Sense→Transmit→Analyze→React (Siggelkow & Terwiesch)',
      });
    }

    // Critical: Coach Behavior < 40
    if (m.connectedExperienceScore < 35) {
      insights.push({
        projectId: project.id,
        projectName: project.name,
        type: 'critical',
        dimension: 'Connected Experience',
        score: m.connectedExperienceScore,
        message: `Experiencia conectada muy débil — no llega al cuadrante de Respond-to-Desire.`,
        action: 'Definir propuesta de valor conectada',
        actionRoute: '/worksheets',
        whartonPrinciple: 'Journey hacia Trusted Partner (CE Framework)',
      });
    }

    // Warning: Business Model < 40 but WTP > 60
    if (m.businessModelStrength < 40 && m.wtpUpliftIndex > 60) {
      insights.push({
        projectId: project.id,
        projectName: project.name,
        type: 'warning',
        dimension: 'Business Model',
        score: m.businessModelStrength,
        message: `Alta disposición a pagar (${m.wtpUpliftIndex}) pero sin modelo de negocio que la capture.`,
        action: 'Diseñar modelo de captura de valor',
        actionRoute: '/business-model',
        whartonPrinciple: 'WTP sin captura = valor destruido (Brandenburger)',
      });
    }

    // Warning: Switching Costs < 30
    if (m.switchingCostIndex < 30) {
      insights.push({
        projectId: project.id,
        projectName: project.name,
        type: 'warning',
        dimension: 'Switching Costs',
        score: m.switchingCostIndex,
        message: `Costos de cambio muy bajos — cualquier competidor puede sustituirte sin fricción.`,
        action: 'Aumentar data lock y habit formation',
        actionRoute: '/competitive',
        whartonPrinciple: 'Switching costs = moat sostenible (Porter)',
      });
    }

    // Opportunity: High WTP + low Competitive Positioning
    if (m.wtpUpliftIndex > 65 && m.competitivePositioningIndex < 40) {
      insights.push({
        projectId: project.id,
        projectName: project.name,
        type: 'opportunity',
        dimension: 'Positioning Gap',
        score: m.competitivePositioningIndex,
        message: `WTP alto (${m.wtpUpliftIndex}) pero posicionamiento débil (${m.competitivePositioningIndex}). Ventana de oportunidad abierta.`,
        action: 'Ver frontera de eficiencia',
        actionRoute: '/frontier',
        whartonPrinciple: 'Activity System Fit (Porter 1996)',
      });
    }

    // Opportunity: SAC below portfolio best by >20
    if (portfolioBestSAC - m.strategicAdvantageComposite > 20) {
      insights.push({
        projectId: project.id,
        projectName: project.name,
        type: 'opportunity',
        dimension: 'SAC Gap',
        score: m.strategicAdvantageComposite,
        message: `Brecha de ${(portfolioBestSAC - m.strategicAdvantageComposite).toFixed(0)} puntos vs el mejor del portfolio (SAC=${portfolioBestSAC}).`,
        action: 'Ver análisis completo',
        actionRoute: '/proposals',
        whartonPrinciple: 'Strategic Advantage Composite — cerrar brechas sistémicamente',
      });
    }
  }

  // Sort: critical first, then warning, then opportunity; within each by score ascending
  return insights.sort((a, b) => {
    const order = { critical: 0, warning: 1, opportunity: 2 };
    if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
    return a.score - b.score;
  });
}

const TYPE_STYLES: Record<CoachInsight['type'], { bg: string; border: string; badge: string; badgeBg: string; icon: string; label: string }> = {
  critical: { bg: '#ef44440a', border: '#ef444433', badge: '#ef4444', badgeBg: '#ef444418', icon: '🚨', label: 'Crítico' },
  warning:  { bg: '#f59e0b0a', border: '#f59e0b33', badge: '#f59e0b', badgeBg: '#f59e0b18', icon: '⚠️', label: 'Alerta' },
  opportunity: { bg: '#22c55e0a', border: '#22c55e33', badge: '#22c55e', badgeBg: '#22c55e18', icon: '💡', label: 'Oportunidad' },
};

interface CoachPanelProps {
  projects?: Project[];
  metricsMap?: Record<string, StrategicMetrics>;
}

export function CoachPanel({ projects = MOCK_PROJECTS, metricsMap = MOCK_METRICS }: CoachPanelProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | CoachInsight['type']>('all');

  const insights = generateInsights(projects, metricsMap);
  const filtered = filter === 'all' ? insights : insights.filter(i => i.type === filter);

  const counts = {
    critical: insights.filter(i => i.type === 'critical').length,
    warning: insights.filter(i => i.type === 'warning').length,
    opportunity: insights.filter(i => i.type === 'opportunity').length,
  };

  if (insights.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.03)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22 }}>🎓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cs-text)' }}>Coach Estratégico</div>
            <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
              {insights.length} alertas · Basado en framework Wharton Connected Strategy
            </div>
          </div>
        </div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'critical', 'warning', 'opportunity'] as const).map(f => {
            const isActive = filter === f;
            const count = f === 'all' ? insights.length : counts[f];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: isActive ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: isActive ? '#6366f1' : 'var(--cs-text-muted)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? `Todos (${count})` : f === 'critical' ? `🚨 ${count}` : f === 'warning' ? `⚠️ ${count}` : `💡 ${count}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insights list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.slice(0, 8).map((insight, idx) => {
          const s = TYPE_STYLES[insight.type];
          const key = `${insight.projectId}-${insight.dimension}`;
          const isOpen = expanded === key;

          return (
            <div
              key={key}
              style={{
                border: `1px solid ${s.border}`,
                borderRadius: 10,
                background: s.bg,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setExpanded(isOpen ? null : key)}
            >
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                {/* Type badge */}
                <span style={{ fontSize: 14 }}>{s.icon}</span>

                {/* Project + dimension */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
                      background: s.badgeBg, color: s.badge, flexShrink: 0,
                    }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1' }}>{insight.projectName}</span>
                    <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>— {insight.dimension}</span>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--cs-text-muted)',
                    }}>
                      score: {insight.score}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 2 }}>
                    {insight.message}
                  </div>
                </div>

                {/* Chevron */}
                <span style={{ fontSize: 10, color: 'var(--cs-text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ padding: '0 14px 12px 14px', borderTop: `1px solid ${s.border}` }}>
                  <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 10, color: '#6366f1', fontStyle: 'italic' }}>
                      📚 {insight.whartonPrinciple}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(insight.actionRoute); }}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: `1px solid ${s.badge}`,
                        background: s.badgeBg,
                        color: s.badge,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      → {insight.action}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length > 8 && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--cs-text-muted)' }}>
          +{filtered.length - 8} alertas adicionales · Ejecuta el pipeline completo para análisis actualizado
        </div>
      )}
    </div>
  );
}
