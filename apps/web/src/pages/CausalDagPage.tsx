import React, { useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { API_BASE_URL } from '../config';

const NODE_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  architectureResilience:     { x: 100,  y: 150, label: 'Arch. Resilience' },
  costReductionPotential:     { x: 100,  y: 350, label: 'Cost Reduction' },
  connectedExperienceScore:   { x: 100,  y: 550, label: 'Connected Exp.' },
  dataScienceReadiness:       { x: 400,  y: 150, label: 'Data Science' },
  closedLoopMaturity:         { x: 400,  y: 350, label: 'Closed Loop' },
  wtpUpliftIndex:             { x: 700,  y: 250, label: 'WTP Uplift' },
  switchingCostIndex:         { x: 700,  y: 450, label: 'Switching Costs' },
  competitivePositioningIndex:{ x: 1000, y: 250, label: 'Comp. Positioning' },
  businessModelStrength:      { x: 1000, y: 450, label: 'Business Model' },
};

export function CausalDagPage() {
  const { activeProject } = useProject();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<any>(null);

  useEffect(() => {
    if (!activeProject?.id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/pipeline/causal/${activeProject.id}`)
      .then(r => r.json())
      .then(res => { if (res.ok) setData(res.causal); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeProject?.id]);

  if (!activeProject) return <div>No project selected.</div>;
  if (loading) return <div className="page-container">Calculando modelo causal de Pearl...</div>;
  if (!data) return <div className="page-container">Error cargando DAG.</div>;

  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Causal DAG (Judea Pearl)</h1>
          <p className="page-subtitle">Grafo acíclico dirigido de dependencias estratégicas y SAC condicionado</p>
        </div>
        <div style={{ display: 'flex', gap: 20, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>SAC Plano</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8' }}>{data.flatSAC}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cs-accent)', textTransform: 'uppercase' }}>SAC Causal</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--cs-accent)', textShadow: '0 0 20px rgba(99,102,241,0.5)' }}>{data.causalSAC}</div>
          </div>
        </div>
      </header>

      <div style={{ background: 'var(--cs-surface-2)', borderRadius: 16, border: '1px solid var(--cs-border)', padding: 24, overflowX: 'auto', position: 'relative' }}>
        <svg width="1200" height="700" style={{ minWidth: 1200 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(148, 163, 184, 0.4)" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--cs-accent)" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {data.dag.map((edge: any, i: number) => {
            const p1 = NODE_POSITIONS[edge.from];
            const p2 = NODE_POSITIONS[edge.to];
            if (!p1 || !p2) return null;

            const isHovered = hoveredNode === edge.from || hoveredNode === edge.to || hoveredEdge === edge;
            const opacity = hoveredNode ? (isHovered ? 1 : 0.1) : 0.4;
            const stroke = isHovered ? 'var(--cs-accent)' : 'rgba(148, 163, 184, 0.4)';
            const marker = isHovered ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)';
            const bezier = `M ${p1.x} ${p1.y} C ${p1.x + 150} ${p1.y}, ${p2.x - 150} ${p2.y}, ${p2.x} ${p2.y}`;

            return (
              <g key={i} onMouseEnter={() => setHoveredEdge(edge)} onMouseLeave={() => setHoveredEdge(null)} style={{ cursor: 'pointer' }}>
                <path d={bezier} fill="none" stroke="transparent" strokeWidth="20" />
                <path d={bezier} fill="none" stroke={stroke} strokeWidth={isHovered ? 3 : 2} opacity={opacity} markerEnd={marker} style={{ transition: 'all 0.3s' }} filter={isHovered ? 'url(#glow)' : 'none'} />
              </g>
            );
          })}

          {/* Nodes */}
          {data.dimensions.map((dim: any, i: number) => {
            const pos = NODE_POSITIONS[dim.dimension];
            if (!pos) return null;

            const isHovered = hoveredNode === dim.dimension;
            const opacity = hoveredNode ? (isHovered ? 1 : 0.2) : 1;
            const tx = `translate(${pos.x}, ${pos.y})`;

            return (
              <g key={i} transform={tx} onMouseEnter={() => setHoveredNode(dim.dimension)} onMouseLeave={() => setHoveredNode(null)} style={{ transition: 'opacity 0.3s', opacity, cursor: 'pointer' }}>
                <circle r="35" fill="var(--cs-surface-1)" stroke={isHovered ? 'var(--cs-accent)' : 'var(--cs-border)'} strokeWidth="2" filter={isHovered ? 'url(#glow)' : 'none'} />
                <text x="0" y="5" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" style={{ fontFamily: 'Outfit, sans-serif' }}>{Math.round(dim.causalScore)}</text>
                {dim.causalBoost !== 0 && (
                  <text x="0" y="22" textAnchor="middle" fill={dim.causalBoost > 0 ? '#22c55e' : '#ef4444'} fontSize="10" fontWeight="bold">
                    {dim.causalBoost > 0 ? '+' : ''}{dim.causalBoost.toFixed(1)}
                  </text>
                )}
                <text x="0" y="-45" textAnchor="middle" fill="var(--cs-text-muted)" fontSize="12" fontWeight="600">{pos.label}</text>
              </g>
            );
          })}
        </svg>

        {/* Hover Panel — Edge */}
        {hoveredEdge && (
          <div style={{ position: 'absolute', bottom: 24, left: 24, background: 'rgba(10,13,20,0.9)', backdropFilter: 'blur(10px)', padding: 16, borderRadius: 12, border: '1px solid var(--cs-accent)', width: 400, color: 'white', zIndex: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--cs-accent)', fontWeight: 700, marginBottom: 4 }}>RELACIÓN CAUSAL</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{NODE_POSITIONS[hoveredEdge.from]?.label} ➔ {NODE_POSITIONS[hoveredEdge.to]?.label}</div>
            <div style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>{hoveredEdge.explanation}</div>
            <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', color: '#818cf8' }}>
              Weight: {hoveredEdge.weight} | Type: {hoveredEdge.type}
            </div>
          </div>
        )}

        {/* Hover Panel — Node */}
        {hoveredNode && !hoveredEdge && (() => {
          const dim = data.dimensions.find((d: any) => d.dimension === hoveredNode);
          return dim ? (
            <div style={{ position: 'absolute', bottom: 24, left: 24, background: 'rgba(10,13,20,0.9)', backdropFilter: 'blur(10px)', padding: 16, borderRadius: 12, border: '1px solid var(--cs-border)', width: 400, color: 'white', zIndex: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--cs-text-muted)', fontWeight: 700, marginBottom: 4 }}>DIMENSIÓN</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{NODE_POSITIONS[hoveredNode]?.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 12 }}>
                <div><div style={{ fontSize: 10, color: '#6b7280' }}>Raw Score</div><div style={{ fontSize: 14, fontWeight: 'bold' }}>{dim.rawScore}</div></div>
                <div><div style={{ fontSize: 10, color: '#6b7280' }}>Causal Score</div><div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--cs-accent)' }}>{dim.causalScore}</div></div>
                <div><div style={{ fontSize: 10, color: '#6b7280' }}>Boost</div><div style={{ fontSize: 14, fontWeight: 'bold', color: dim.causalBoost > 0 ? '#22c55e' : '#ef4444' }}>{dim.causalBoost.toFixed(1)}</div></div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>{dim.explanation}</div>
            </div>
          ) : null;
        })()}
      </div>

      <div style={{ marginTop: 20, padding: 16, background: 'var(--cs-surface-2)', borderRadius: 12, border: '1px solid var(--cs-border)', color: 'var(--cs-text)' }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Insight Causal</h3>
        <p style={{ fontSize: 13, color: 'var(--cs-text-muted)', lineHeight: 1.6 }}>{data.insight}</p>
      </div>
    </div>
  );
}
