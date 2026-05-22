import React from 'react';
import type { StrategicMetrics } from '@cs/domain';

interface Props { metrics: StrategicMetrics; }

const SCORES: { key: keyof StrategicMetrics; label: string; color: string }[] = [
  { key: 'connectedExperienceScore', label: 'Connected Experience', color: '#6366f1' },
  { key: 'closedLoopMaturity', label: 'Closed Loop Maturity', color: '#a855f7' },
  { key: 'switchingCostIndex', label: 'Switching Costs', color: '#06b6d4' },
  { key: 'wtpUpliftIndex', label: 'WTP Uplift', color: '#22c55e' },
  { key: 'costReductionPotential', label: 'Cost Reduction', color: '#f59e0b' },
  { key: 'competitivePositioningIndex', label: 'Competitive Position', color: '#ec4899' },
  { key: 'businessModelStrength', label: 'Business Model', color: '#f97316' },
  { key: 'dataScienceReadiness', label: 'Data Science', color: '#818cf8' },
  { key: 'architectureResilience', label: 'Arquitectura', color: '#34d399' },
  { key: 'strategicAdvantageComposite', label: 'Ventaja Estratégica', color: '#fbbf24' },
];

function getColor(score: number) {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function ScoreGrid({ metrics }: Props) {
  return (
    <div className="score-grid">
      {SCORES.map(({ key, label, color }) => {
        const val = metrics[key] as number;
        return (
          <div className="score-card" key={key}>
            <div className="score-value" style={{ color }}>{val}</div>
            <div className="score-label">{label}</div>
            <div className="score-bar">
              <div className="score-fill" style={{ transform: `scaleX(${val / 100})`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreCompact({ score, label }: { score: number; label: string }) {
  const c = getColor(score);
  return (
    <span style={{ color: c, fontWeight: 700 }}>{score} <span style={{ color: 'var(--cs-text-muted)', fontWeight: 400, fontSize: 11 }}>{label}</span></span>
  );
}
