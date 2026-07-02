import React from 'react';
import type { AgentNode, Crew } from '../../../config/agents';
import { CREW_COLORS } from '../../../config/agents';

interface OrchestrationCanvasProps {
  selected: AgentNode | null;
  setSelected: (a: AgentNode | null) => void;
  activeAgentId: string | null;
  agents: AgentNode[];
}

export function OrchestrationCanvas({
  selected,
  setSelected,
  activeAgentId,
  agents,
}: OrchestrationCanvasProps) {
  // Virtual canvas — scales with viewBox to fill any container
  const VW = 1600;
  const NW = 152, NH = 56;
  const ROW_GAP = 70, COL_GAP = 14;
  const yInc = NH + COL_GAP;

  // Row Y positions
  const y0 = 28;
  const y1 = y0 + NH + ROW_GAP;
  const y2 = y1 + NH + ROW_GAP;

  // Crew lead horizontal centres
  const cxRecon = 220;
  const cxAnalysis = 800;
  const cxAction = 1380;
  const cxSup = VW / 2;

  const leads = [
    { id: 'recon-lead', cx: cxRecon },
    { id: 'analysis-lead', cx: cxAnalysis },
    { id: 'action-lead', cx: cxAction },
  ];

  // Specialist lists
  const reconSpecs = ['portfolio-scanner', 'competitive-intel-agent'];
  const analysisSpecs = [
    'worksheet-synthesizer',
    'connected-strategy-analyst',
    'competitive-advantage-analyst',
    'business-model-analyst',
    'data-science-opportunity-analyst',
    'architecture-improvement-analyst',
    'ai-frontier-analyst',
    'causal-mapper',
    'frontier-mapper-agent',
    'temporal-analyst',
    'anomaly-detector',
  ];
  const actionSpecs = ['proposal-composer', 'validation-agent', 'cost-estimator-agent'];

  // Build positioned specialist nodes
  const specNodes: { id: string; x: number; y: number; crewId: string }[] = [];

  // Recon: 1 col × 2 rows
  reconSpecs.forEach((id, i) => {
    specNodes.push({ id, x: cxRecon - NW / 2, y: y2 + i * yInc, crewId: 'recon' });
  });

  // Analysis: 3 cols × 4 rows (11 nodes)
  const aCols = 3;
  const aTotalW = aCols * NW + (aCols - 1) * COL_GAP;
  const aStartX = cxAnalysis - aTotalW / 2;
  analysisSpecs.forEach((id, i) => {
    const col = i % aCols,
      row = Math.floor(i / aCols);
    specNodes.push({ id, x: aStartX + col * (NW + COL_GAP), y: y2 + row * yInc, crewId: 'analysis' });
  });

  // Action: 1 col × 3 rows
  actionSpecs.forEach((id, i) => {
    specNodes.push({ id, x: cxAction - NW / 2, y: y2 + i * yInc, crewId: 'action' });
  });

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));
  const maxRows = Math.ceil(analysisSpecs.length / aCols);
  const VH = y2 + maxRows * yInc - COL_GAP + 36;

  // Bézier connector
  const bezier = (
    x1: number,
    y1b: number,
    x2: number,
    y2b: number,
    col: string,
    key: string,
  ) => {
    const my = (y1b + y2b) / 2;
    return (
      <path
        key={key}
        d={`M${x1},${y1b} C${x1},${my} ${x2},${my} ${x2},${y2b}`}
        fill="none"
        stroke={`${col}65`}
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
    );
  };

  const renderNode = (id: string, nx: number, ny: number) => {
    const a = agentMap[id];
    if (!a) return null;
    const col =
      a.tier === 'supervisor'
        ? '#a855f7'
        : a.tier === 'crew-lead'
          ? '#06b6d4'
          : CREW_COLORS[a.crew];
    const isSel = selected?.id === id;
    const isActive = activeAgentId === id;
    const label = a.name.length > 15 ? a.name.slice(0, 15) + '…' : a.name;
    return (
      <g key={id} style={{ cursor: 'pointer' }} onClick={() => setSelected(isSel ? null : a)}>
        <rect
          x={nx}
          y={ny}
          width={NW}
          height={NH}
          rx={8}
          fill={isSel ? `${col}25` : isActive ? `${col}40` : '#131929'}
          stroke={isSel || isActive ? col : `${col}50`}
          strokeWidth={isSel || isActive ? 2 : 1}
        />
        {/* Left accent bar */}
        <rect x={nx} y={ny + 8} width={3} height={NH - 16} rx={1.5} fill={col} />
        {isActive && (
          <circle
            cx={nx + NW - 8}
            cy={ny + 8}
            r={4}
            fill="#10b981"
            style={{ animation: 'pulse 1.5s infinite' }}
          />
        )}
        <text
          x={nx + 12}
          y={ny + 22}
          fontSize={11}
          fontWeight={700}
          fill={isActive ? '#ffffff' : col}
          fontFamily="Inter,system-ui,sans-serif"
        >
          {a.emoji} {label}
        </text>
        <text
          x={nx + 12}
          y={ny + 37}
          fontSize={9}
          fill="#4e5f7a"
          fontFamily="Inter,system-ui,sans-serif"
        >
          {a.crew !== 'none' ? a.crew : 'supervisor'}
        </text>
        {a.llm && (
          <>
            <rect x={nx + NW - 34} y={ny + 8} width={28} height={13} rx={4} fill="#6366f120" />
            <text x={nx + NW - 32} y={ny + 18} fontSize={8} fill="#818cf8" fontWeight={700}>
              ⚡ LLM
            </text>
          </>
        )}
        {a.autonomous && (
          <>
            <rect x={nx + NW - 34} y={ny + NH - 21} width={28} height={13} rx={4} fill="#22c55e20" />
            <text x={nx + NW - 33} y={ny + NH - 12} fontSize={8} fill="#4ade80" fontWeight={700}>
              ⏰ AUTO
            </text>
          </>
        )}
      </g>
    );
  };

  // Crew section labels (above specialist blocks)
  const crewLabels = [
    { label: 'CREW RECON', cx: cxRecon, col: CREW_COLORS.recon },
    { label: 'CREW ANALYSIS + CROSS-CUTTING', cx: cxAnalysis, col: CREW_COLORS.analysis },
    { label: 'CREW ACTION', cx: cxAction, col: CREW_COLORS.action },
  ];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 16px 8px',
          fontSize: 11,
          fontWeight: 700,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        🌳 Organigrama de Mando
        <span style={{ fontSize: 9, color: 'var(--cs-text-muted)', fontWeight: 400 }}>
          Escala automáticamente · Haz clic en cualquier nodo para ver detalles
        </span>
      </div>
      <div style={{ padding: '8px', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          style={{ display: 'block', minWidth: 700 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Supervisor → Crew Leads */}
          {leads.map((l) => bezier(cxSup, y0 + NH, l.cx, y1, '#a855f7', `sup-${l.id}`))}

          {/* Crew Leads → Specialists */}
          {specNodes.map((sn) => {
            const leadCx =
              sn.crewId === 'recon'
                ? cxRecon
                : sn.crewId === 'analysis'
                  ? cxAnalysis
                  : cxAction;
            const col = CREW_COLORS[sn.crewId as Crew] ?? '#888';
            return bezier(leadCx, y1 + NH, sn.x + NW / 2, sn.y, col, `lead-${sn.id}`);
          })}

          {/* Crew section labels */}
          {crewLabels.map((g) => (
            <text
              key={g.label}
              x={g.cx}
              y={y2 - 12}
              textAnchor="middle"
              fontSize={9}
              fontWeight={800}
              fill={`${g.col}80`}
              fontFamily="Inter,system-ui,sans-serif"
              letterSpacing="1.5"
            >
              {g.label}
            </text>
          ))}

          {/* Nodes: Supervisor */}
          {renderNode('strategist-supervisor', cxSup - NW / 2, y0)}
          {/* Crew Leads */}
          {leads.map((l) => renderNode(l.id, l.cx - NW / 2, y1))}
          {/* Specialists */}
          {specNodes.map((sn) => renderNode(sn.id, sn.x, sn.y))}
        </svg>
      </div>
    </div>
  );
}
