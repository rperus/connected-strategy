/**
 * Agent Orchestrator — 3-Tier Hierarchical Swarm View
 * Level 0: Supervisor | Level 1: Crew Leads | Level 2: Specialists
 * Views: hierarchy | orgchart | flow
 */
import React, { useState, useEffect } from 'react';
import { ProjectBanner } from '../components/ProjectBanner';
import { useProject } from '../context/ProjectContext';
import { API_BASE_URL } from '../config';
import {
  Tier,
  Crew,
  AgentNode,
  TIER_COLORS,
  TIER_LABELS,
  CREW_COLORS,
  AGENTS,
  TIER_ORDER,
} from '../config/agents';
import { AgentFilters } from './agents/components/AgentFilters';
import { OrchestrationCanvas } from './agents/components/OrchestrationCanvas';
import { AgentDetailsSidebar } from './agents/components/AgentDetailsSidebar';

export function AgentOrchestratorPage() {
  const { activeProject } = useProject();
  const [selected, setSelected] = useState<AgentNode | null>(null);
  const [filterCrew, setFilterCrew] = useState<Crew | 'all'>('all');
  const [view, setView] = useState<'hierarchy' | 'orgchart' | 'flow'>('hierarchy');
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const [logs, setLogs] = useState<
    { phase?: string; msg?: string; message?: string; type?: string; agentId?: string }[]
  >([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial state to see if auto-mode is enabled
    if (activeProject?.id) {
      fetch(`${API_BASE_URL}/api/pipeline/state/${activeProject.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.state) {
            setAutoMode(!!data.state.runsAutonomously);
          }
        })
        .catch(console.error);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    // Wave 7: Global real-time telemetry stream
    const eventSource = new EventSource(`${API_BASE_URL}/api/telemetry/stream`);

    eventSource.onmessage = (e) => {
      const payloadWrapper = JSON.parse(e.data);
      if (payloadWrapper.event === 'connected') return;

      const { event, data } = payloadWrapper;

      if (event === 'pipeline:started') {
        setStatus('running');
        setRunId(data.runId);
        setLogs((prev) => [
          ...prev,
          { type: 'system', message: `Pipeline arrancado (Run: ${data.runId})` },
        ]);
        setActiveAgentId(null);
      } else if (event === 'pipeline:completed') {
        setStatus(data.status === 'done' ? 'done' : 'failed');
        setLogs((prev) => [
          ...prev,
          { type: 'system', message: `Pipeline completado (${data.status})` },
        ]);
        setActiveAgentId(null);
      } else if (event === 'agent:started') {
        setLogs((prev) => [...prev, { phase: data.phase, message: data.message, type: 'info' }]);
      } else if (event === 'agent:activity') {
        setLogs((prev) => [...prev, data]);
        if (
          data.agentId &&
          (data.message?.includes('started') || data.message?.includes('Starting'))
        ) {
          setActiveAgentId(data.agentId);
        }
      }
    };

    return () => eventSource.close();
  }, []);

  const runPipeline = async () => {
    if (!activeProject?.id) return alert('Selecciona un proyecto primero.');
    setLogs([]);
    setStatus('running');
    setActiveAgentId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/run-v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: [activeProject.id], useGemini: true }),
      });
      const data = await res.json();
      if (!data.ok) setStatus('failed');
    } catch (e) {
      console.error(e);
      setStatus('failed');
    }
  };

  const toggleAutoMode = async () => {
    if (!activeProject?.id) return;
    const nextState = !autoMode;
    setAutoMode(nextState);
    try {
      await fetch(`${API_BASE_URL}/api/pipeline/state/${activeProject.id}/auto-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
    } catch (e) {
      console.error(e);
      setAutoMode(!nextState); // rollback on error
    }
  };

  const crews: Crew[] = ['recon', 'analysis', 'action', 'cross-cutting'];
  const visible =
    filterCrew === 'all'
      ? AGENTS
      : AGENTS.filter((a) => a.crew === filterCrew || a.tier !== 'specialist');

  const byTier = (tier: Tier) => visible.filter((a) => a.tier === tier);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🤖 Orquestador de Agentes — Swarm Jerárquico</h1>
        <p className="page-subtitle">
          20 agentes · 3 niveles · Supervisor → Crew Leads → Especialistas · Haz clic para detalles
        </p>
      </div>
      <ProjectBanner context="Agent Orchestrator" />

      {/* Controls */}
      <AgentFilters
        view={view}
        setView={setView}
        filterCrew={filterCrew}
        setFilterCrew={setFilterCrew}
        crews={crews}
        crewColors={CREW_COLORS}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Main Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Telemetry Bar */}
          <div
            style={{
              padding: '16px',
              background: 'var(--cs-surface-2)',
              borderRadius: 12,
              border: '1px solid var(--cs-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                Control de Ejecución
              </div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 4 }}>
                {status === 'running'
                  ? 'Pipeline ejecutándose...'
                  : status === 'done'
                    ? 'Ejecución completada.'
                    : 'Pipeline en espera.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={toggleAutoMode}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: autoMode ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                  color: autoMode ? '#22c55e' : 'var(--cs-text-muted)',
                  border: `1px solid ${autoMode ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: autoMode ? '#22c55e' : '#4b5563',
                    animation: autoMode ? 'pulse 2s infinite' : 'none',
                  }}
                />
                Auto-Mode: {autoMode ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={runPipeline}
                disabled={status === 'running'}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: status === 'running' ? 'not-allowed' : 'pointer',
                  background:
                    status === 'running'
                      ? '#4b5563'
                      : 'linear-gradient(135deg, var(--cs-accent), var(--cs-violet))',
                  color: 'white',
                  border: 'none',
                  boxShadow: status === 'running' ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
                }}
              >
                {status === 'running' ? '⏳ Ejecutando...' : '🚀 Iniciar V3 Swarm'}
              </button>
            </div>
          </div>

          {logs.length > 0 && (
            <div
              style={{
                padding: 12,
                background: '#0a0d14',
                border: '1px solid #1f2937',
                borderRadius: 8,
                maxHeight: 150,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: 10,
              }}
            >
              {logs.map((l, i) => (
                <div
                  key={i}
                  style={{
                    color:
                      l.type === 'telemetry'
                        ? '#a855f7'
                        : l.type === 'system'
                          ? '#06b6d4'
                          : '#10b981',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: '#6b7280' }}>[{new Date().toLocaleTimeString()}]</span>{' '}
                  {l.agentId ? `<${l.agentId}> ` : ''}
                  {l.msg || l.message}
                </div>
              ))}
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
            </div>
          )}

          {/* ── ORGCHART VIEW ─────────────────────────────────────── */}
          {view === 'orgchart' && (
            <OrchestrationCanvas
              selected={selected}
              setSelected={setSelected}
              activeAgentId={activeAgentId}
              agents={AGENTS}
            />
          )}

          {/* ── HIERARCHY VIEW ────────────────────────────────────── */}
          {view !== 'orgchart' &&
            TIER_ORDER.map((tier) => {
              const agents = byTier(tier);
              if (!agents.length) return null;
              const color = TIER_COLORS[tier];
              return (
                <div
                  key={tier}
                  style={{
                    border: `1px solid ${color}30`,
                    borderRadius: 12,
                    background: `${color}06`,
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color }}>{TIER_LABELS[tier]}</div>
                    <div
                      style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: `${color}20`,
                        color,
                      }}
                    >
                      {agents.length} agente{agents.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {agents.map((agent) => {
                      const isSel = selected?.id === agent.id;
                      const crewColor = CREW_COLORS[agent.crew];
                      return (
                        <div
                          key={agent.id}
                          onClick={() => setSelected(isSel ? null : agent)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 9,
                            cursor: 'pointer',
                            background: isSel
                              ? `${color}20`
                              : activeAgentId === agent.id
                                ? `${color}40`
                                : '#1e2433',
                            border: `1px solid ${
                              isSel || activeAgentId === agent.id ? color : `${color}33`
                            }`,
                            borderLeft: `3px solid ${crewColor}`,
                            transition: 'all 0.15s',
                            position: 'relative',
                          }}
                        >
                          {activeAgentId === agent.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#10b981',
                                animation: 'pulse 1.5s infinite',
                              }}
                            />
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 18 }}>{agent.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: isSel ? color : 'var(--cs-text)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {agent.name}
                              </div>
                              <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: 8,
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    background: `${crewColor}20`,
                                    color: crewColor,
                                    fontWeight: 700,
                                  }}
                                >
                                  {agent.crew}
                                </span>
                                {agent.llm && (
                                  <span
                                    style={{
                                      fontSize: 8,
                                      padding: '1px 5px',
                                      borderRadius: 6,
                                      background: '#6366f120',
                                      color: '#6366f1',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ⚡LLM
                                  </span>
                                )}
                                {agent.autonomous && (
                                  <span
                                    style={{
                                      fontSize: 8,
                                      padding: '1px 5px',
                                      borderRadius: 6,
                                      background: '#22c55e20',
                                      color: '#22c55e',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ⏰AUTO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: 'var(--cs-text-muted)',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {agent.role}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* Execution flow diagram */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
              🔄 Flujo de Ejecución (Strategist Plan)
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '① Strategist\nPlans', color: '#a855f7', agents: 1 },
                { label: '② Recon Lead\n+ Crew', color: '#6366f1', agents: 3 },
                { label: '③ Temporal\n+ Anomaly', color: '#ec4899', agents: 2 },
                { label: '④ Analysis Lead\n+ 8 Analysts', color: '#f59e0b', agents: 9 },
                { label: '⑤ Causal\nMapper', color: '#06b6d4', agents: 1 },
                { label: '⑥ Action Lead\n+ Validation', color: '#22c55e', agents: 4 },
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: `${step.color}15`,
                      border: `1px solid ${step.color}40`,
                      minWidth: 90,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: step.color,
                        whiteSpace: 'pre-line',
                        lineHeight: 1.4,
                      }}
                    >
                      {step.label}
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--cs-text-muted)', marginTop: 3 }}>
                      {step.agents} agente{step.agents > 1 ? 's' : ''}
                    </div>
                  </div>
                  {i < arr.length - 1 && <div style={{ color: 'var(--cs-text-muted)', fontSize: 14 }}>→</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <AgentDetailsSidebar
          selected={selected}
          setSelected={setSelected}
          agents={AGENTS}
          byTier={byTier}
        />
      </div>
    </div>
  );
}
