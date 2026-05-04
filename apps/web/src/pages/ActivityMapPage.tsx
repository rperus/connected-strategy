/**
 * Activity Map — Interactive force-directed activity system graph
 * Visualizes how business activities reinforce each other.
 * Source: Connected Strategy, Michael Porter's Activity System Maps
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';

interface ActivityNode {
  id: string;
  label: string;
  x: number;
  y: number;
  category: 'operations' | 'technology' | 'customer' | 'data' | 'revenue';
  isCore: boolean;
}

interface ActivityEdge {
  from: string;
  to: string;
  strength: number; // 1-5
}

const CATEGORY_COLORS: Record<string, string> = {
  operations: '#f59e0b',
  technology: '#6366f1',
  customer: '#10b981',
  data: '#3b82f6',
  revenue: '#ec4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  operations: '⚙️ Operaciones',
  technology: '💻 Tecnología',
  customer: '👤 Cliente',
  data: '📊 Datos',
  revenue: '💰 Ingresos',
};

const INITIAL_NODES: ActivityNode[] = [
  { id: 'n1', label: 'IoT Monitoring', x: 250, y: 120, category: 'technology', isCore: true },
  { id: 'n2', label: 'Predictive Maintenance', x: 450, y: 120, category: 'operations', isCore: true },
  { id: 'n3', label: 'Customer Trust', x: 650, y: 120, category: 'customer', isCore: true },
  { id: 'n4', label: 'Data Collection', x: 250, y: 280, category: 'data', isCore: false },
  { id: 'n5', label: 'AI Analysis', x: 450, y: 280, category: 'technology', isCore: true },
  { id: 'n6', label: 'Proactive Support', x: 650, y: 280, category: 'customer', isCore: false },
  { id: 'n7', label: 'PAYG Platform', x: 250, y: 440, category: 'revenue', isCore: true },
  { id: 'n8', label: 'Revenue Model', x: 450, y: 440, category: 'revenue', isCore: false },
  { id: 'n9', label: 'Scale Economics', x: 650, y: 440, category: 'operations', isCore: false },
];

const INITIAL_EDGES: ActivityEdge[] = [
  { from: 'n1', to: 'n2', strength: 4 },
  { from: 'n2', to: 'n3', strength: 3 },
  { from: 'n1', to: 'n4', strength: 5 },
  { from: 'n4', to: 'n5', strength: 5 },
  { from: 'n5', to: 'n6', strength: 3 },
  { from: 'n5', to: 'n2', strength: 4 },
  { from: 'n3', to: 'n6', strength: 3 },
  { from: 'n7', to: 'n8', strength: 4 },
  { from: 'n8', to: 'n9', strength: 3 },
  { from: 'n4', to: 'n7', strength: 3 },
  { from: 'n6', to: 'n3', strength: 2 },
  { from: 'n9', to: 'n3', strength: 2 },
];

const SVG_W = 900;
const SVG_H = 560;

export function ActivityMapPage() {
  const [nodes, setNodes] = useState<ActivityNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<ActivityEdge[]>(INITIAL_EDGES);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityNode['category']>('operations');
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectMode) {
      if (connectMode !== id) {
        const exists = edges.some(ed => (ed.from === connectMode && ed.to === id) || (ed.from === id && ed.to === connectMode));
        if (!exists) {
          setEdges(prev => [...prev, { from: connectMode, to: id, strength: 3 }]);
        }
      }
      setConnectMode(null);
    } else {
      setDragId(id);
      setSelectedNode(id);
    }
  }, [connectMode, edges]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(SVG_W - 30, e.clientX - rect.left));
    const y = Math.max(30, Math.min(SVG_H - 30, e.clientY - rect.top));
    setNodes(prev => prev.map(n => n.id === dragId ? { ...n, x, y } : n));
  }, [dragId]);

  const handleMouseUp = useCallback(() => setDragId(null), []);

  const addNode = () => {
    if (!newLabel.trim()) return;
    const id = `n${Date.now()}`;
    setNodes(prev => [...prev, {
      id, label: newLabel.trim(), x: 100 + Math.random() * 600, y: 100 + Math.random() * 300,
      category: newCategory, isCore: false,
    }]);
    setNewLabel('');
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const removeEdge = (from: string, to: string) => {
    setEdges(prev => prev.filter(e => !(e.from === from && e.to === to)));
  };

  const toggleCore = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, isCore: !n.isCore } : n));
  };

  const fitScore = edges.reduce((sum, e) => sum + e.strength, 0);
  const coreCount = nodes.filter(n => n.isCore).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🕸️ Mapa de Actividades</h1>
        <p className="page-subtitle">
          Diagrama interactivo que muestra cómo tus actividades se refuerzan mutuamente.
          Arrastra los nodos, haz clic para conectar. Mayor coherencia = mayor ventaja competitiva.
        </p>
      </div>
      <ProjectBanner context="Mapa de Actividades" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        {/* Graph */}
        <div className="card" style={{ padding: '16px' }}>
          <svg
            ref={svgRef}
            width={SVG_W} height={SVG_H}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => { setSelectedNode(null); setConnectMode(null); }}
            style={{
              cursor: dragId ? 'grabbing' : connectMode ? 'crosshair' : 'default',
              background: 'var(--cs-surface)', borderRadius: '12px',
            }}
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const from = nodes.find(n => n.id === edge.from);
              const to = nodes.find(n => n.id === edge.to);
              if (!from || !to) return null;
              return (
                <g key={i}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="var(--cs-accent)" strokeWidth={edge.strength * 0.8}
                    opacity={0.3 + edge.strength * 0.1}
                    strokeLinecap="round"
                  />
                  {selectedNode && (edge.from === selectedNode || edge.to === selectedNode) && (
                    <circle
                      cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r={8}
                      fill="#ef4444" opacity={0.6} cursor="pointer"
                      onClick={(e) => { e.stopPropagation(); removeEdge(edge.from, edge.to); }}
                    />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const color = CATEGORY_COLORS[node.category];
              const isSelected = selectedNode === node.id;
              const isConnecting = connectMode === node.id;
              return (
                <g key={node.id}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  style={{ cursor: connectMode ? 'crosshair' : 'grab' }}
                >
                  {/* Selection ring */}
                  {(isSelected || isConnecting) && (
                    <circle cx={node.x} cy={node.y} r={node.isCore ? 32 : 26}
                      fill="none" stroke={isConnecting ? '#f59e0b' : color} strokeWidth={2} strokeDasharray="4,3" />
                  )}
                  {/* Glow */}
                  <circle cx={node.x} cy={node.y} r={node.isCore ? 28 : 22}
                    fill={color} opacity={0.12} />
                  {/* Main circle */}
                  <circle cx={node.x} cy={node.y} r={node.isCore ? 22 : 16}
                    fill={color} opacity={0.85}
                    stroke={node.isCore ? '#fff' : color} strokeWidth={node.isCore ? 2.5 : 1}
                  />
                  {/* Label */}
                  <text x={node.x} y={node.y + (node.isCore ? 34 : 28)}
                    textAnchor="middle" fill="var(--cs-text)" fontSize={11} fontWeight={node.isCore ? 700 : 400}
                  >
                    {node.label}
                  </text>
                  {node.isCore && (
                    <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={700}>★</text>
                  )}
                </g>
              );
            })}

            {/* Connect mode indicator */}
            {connectMode && (
              <text x={SVG_W / 2} y={20} textAnchor="middle" fill="#f59e0b" fontSize={12} fontWeight={600}>
                🔗 Haz clic en otro nodo para conectar
              </text>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>📊 Coherencia del Sistema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--cs-surface)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cs-accent)' }}>{fitScore}</div>
                <div style={{ color: 'var(--cs-text-muted)' }}>Fit Score</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--cs-surface)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{coreCount}</div>
                <div style={{ color: 'var(--cs-text-muted)' }}>Core Activities</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--cs-surface)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{nodes.length}</div>
                <div style={{ color: 'var(--cs-text-muted)' }}>Nodos</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--cs-surface)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{edges.length}</div>
                <div style={{ color: 'var(--cs-text-muted)' }}>Conexiones</div>
              </div>
            </div>
          </div>

          {/* Add node */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>➕ Agregar Actividad</h3>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Nombre de actividad..."
              onKeyDown={e => e.key === 'Enter' && addNode()}
              style={{
                width: '100%', padding: '8px', fontSize: '12px', marginBottom: '8px',
                background: 'var(--cs-bg)', border: '1px solid var(--cs-border)',
                borderRadius: '6px', color: 'var(--cs-text)',
              }}
            />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value as ActivityNode['category'])}
              style={{
                width: '100%', padding: '8px', fontSize: '12px', marginBottom: '8px',
                background: 'var(--cs-bg)', border: '1px solid var(--cs-border)',
                borderRadius: '6px', color: 'var(--cs-text)',
              }}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button onClick={addNode} style={{
              width: '100%', padding: '8px', background: 'var(--cs-accent)', border: 'none',
              borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px',
            }}>Agregar</button>
          </div>

          {/* Selected node actions */}
          {selectedNode && (() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            return (
              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>
                  <span style={{ color: CATEGORY_COLORS[node.category] }}>●</span> {node.label}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button onClick={() => setConnectMode(selectedNode)} style={{
                    padding: '6px', fontSize: '11px', background: 'var(--cs-surface)',
                    border: '1px solid var(--cs-border)', borderRadius: '6px', cursor: 'pointer',
                    color: 'var(--cs-text)',
                  }}>🔗 Conectar con otro</button>
                  <button onClick={() => toggleCore(selectedNode)} style={{
                    padding: '6px', fontSize: '11px', background: 'var(--cs-surface)',
                    border: '1px solid var(--cs-border)', borderRadius: '6px', cursor: 'pointer',
                    color: 'var(--cs-text)',
                  }}>{node.isCore ? '★ Quitar Core' : '☆ Marcar Core'}</button>
                  <button onClick={() => removeNode(selectedNode)} style={{
                    padding: '6px', fontSize: '11px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer',
                    color: '#ef4444',
                  }}>🗑️ Eliminar</button>
                </div>
              </div>
            );
          })()}

          {/* Legend */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px' }}>🎨 Categorías</h3>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '11px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: CATEGORY_COLORS[key], display: 'inline-block' }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 12px' }}>📖 ¿Qué es el Mapa de Actividades?</h3>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--cs-text-muted)', fontSize: '14px' }}>
          El <strong>Activity System Map</strong> (Michael Porter) muestra cómo las actividades de tu empresa se
          <strong> refuerzan mutuamente</strong>. Una estrategia fuerte tiene <em>internal fit</em>: cada actividad
          fortalece a las demás. Esto hace que tu ventaja competitiva sea <strong>muy difícil de copiar</strong>,
          porque un competidor tendría que replicar todo el sistema completo, no solo una actividad.
          <br /><br />
          Las actividades <strong>★ Core</strong> son las más importantes — las que defines como diferenciantes.
          El <strong>Fit Score</strong> es la suma de las fuerzas de conexión. Mayor fit = mayor coherencia estratégica.
          <br /><br />
          <em>Fuente: Porter, "What Is Strategy?" (1996) + Connected Strategy, Capítulo 11.</em>
        </p>
      </div>
    </div>
  );
}
