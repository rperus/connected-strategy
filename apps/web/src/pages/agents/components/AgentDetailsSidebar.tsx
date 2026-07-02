import React from 'react';
import type { AgentNode, Tier } from '../../../config/agents';
import { TIER_COLORS, TIER_LABELS, CREW_COLORS, TIER_ORDER } from '../../../config/agents';

interface AgentDetailsSidebarProps {
  selected: AgentNode | null;
  setSelected: (a: AgentNode | null) => void;
  agents: AgentNode[];
  byTier: (t: Tier) => AgentNode[];
}

export function AgentDetailsSidebar({
  selected,
  setSelected,
  agents,
  byTier,
}: AgentDetailsSidebarProps) {
  return (
    <div>
      {selected ? (
        <div
          className="card"
          style={{
            borderLeft: `3px solid ${TIER_COLORS[selected.tier]}`,
            position: 'sticky',
            top: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{selected.emoji}</span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: TIER_COLORS[selected.tier],
                }}
              >
                {selected.name}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 8,
                    background: `${TIER_COLORS[selected.tier]}20`,
                    color: TIER_COLORS[selected.tier],
                    fontWeight: 700,
                  }}
                >
                  {selected.tier}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 8,
                    background: `${CREW_COLORS[selected.crew]}20`,
                    color: CREW_COLORS[selected.crew],
                    fontWeight: 700,
                  }}
                >
                  crew:{selected.crew}
                </span>
                {selected.llm && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 8,
                      background: '#6366f120',
                      color: '#6366f1',
                      fontWeight: 700,
                    }}
                  >
                    ⚡LLM
                  </span>
                )}
                {selected.autonomous && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      borderRadius: 8,
                      background: '#22c55e20',
                      color: '#22c55e',
                      fontWeight: 700,
                    }}
                  >
                    ⏰ Autónomo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'var(--cs-text-muted)',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            {selected.role}
          </div>

          {[
            { label: '📥 INPUT', items: selected.input, color: '#6366f1' },
            { label: '📤 OUTPUT', items: selected.output, color: '#22c55e' },
          ].map((s) => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: s.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              {s.items.map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    background: 'var(--cs-surface-2)',
                    borderRadius: 4,
                    marginBottom: 2,
                    fontFamily: 'monospace',
                    color: 'var(--cs-text-muted)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}

          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}
            >
              🧠 MEMORIA
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--cs-text-muted)',
                padding: '6px 8px',
                background: 'var(--cs-surface-2)',
                borderRadius: 4,
                lineHeight: 1.5,
              }}
            >
              {selected.memory}
            </div>
          </div>

          {selected.dependsOn.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#ec4899',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                ⛓️ DEPENDE DE
              </div>
              {selected.dependsOn.map((dep) => {
                const a = agents.find((x) => x.id === dep);
                return (
                  <div
                    key={dep}
                    onClick={() => setSelected(a ?? null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      background: 'var(--cs-surface-2)',
                      borderRadius: 4,
                      marginBottom: 3,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{a?.emoji}</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: a ? TIER_COLORS[a.tier] : 'var(--cs-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {a?.name ?? dep}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Selecciona un agente
          </div>
          <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', lineHeight: 1.6 }}>
            Haz clic en cualquier tarjeta para ver su rol, tier, crew, inputs, outputs y dependencias.
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIER_ORDER.map((t) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: `${TIER_COLORS[t]}10`,
                  border: `1px solid ${TIER_COLORS[t]}30`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: TIER_COLORS[t],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 10, fontWeight: 700, color: TIER_COLORS[t] }}>
                  {TIER_LABELS[t]}
                </span>
                <span style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginLeft: 'auto' }}>
                  {byTier(t).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
