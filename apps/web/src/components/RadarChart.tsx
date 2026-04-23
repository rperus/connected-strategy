import React from 'react';

interface Props { metrics: Record<string, number>; size?: number; }

const LABELS = [
  'CE', 'CL', 'SC', 'WTP', 'CR', 'CP', 'BM', 'DS', 'AR', 'SAC',
];

export function RadarChart({ metrics, size = 260 }: Props) {
  const values = Object.values(metrics).slice(0, 10).map(v => v / 100);
  const n = values.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const angleStep = (Math.PI * 2) / n;
  const toXY = (i: number, ratio: number) => {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPath = values.map((v, i) => {
    const p = toXY(i, v);
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ') + 'Z';

  return (
    <div className="radar-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridLevels.map(level => {
          const pts = Array.from({ length: n }, (_, i) => toXY(i, level));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
          return <path key={level} d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}
        {/* Axes */}
        {Array.from({ length: n }, (_, i) => {
          const outer = toXY(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
        })}
        {/* Data area */}
        <path d={dataPath} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2" />
        {/* Data points */}
        {values.map((v, i) => {
          const p = toXY(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#818cf8" />;
        })}
        {/* Labels */}
        {Array.from({ length: n }, (_, i) => {
          const p = toXY(i, 1.18);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
              fill="#7b7f9a" fontSize="10" fontFamily="Inter, sans-serif">
              {LABELS[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
