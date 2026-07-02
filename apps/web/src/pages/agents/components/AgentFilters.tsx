import React from 'react';
import type { Crew } from '../../../config/agents';

interface AgentFiltersProps {
  view: 'hierarchy' | 'orgchart' | 'flow';
  setView: (v: 'hierarchy' | 'orgchart' | 'flow') => void;
  filterCrew: Crew | 'all';
  setFilterCrew: (c: Crew | 'all') => void;
  crews: Crew[];
  crewColors: Record<string, string>;
}

export function AgentFilters({
  view,
  setView,
  filterCrew,
  setFilterCrew,
  crews,
  crewColors,
}: AgentFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['hierarchy', 'orgchart', 'flow'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: view === v ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
              color: view === v ? '#6366f1' : 'var(--cs-text-muted)',
            }}
          >
            {v === 'hierarchy' ? '🏗️ Jerarquía' : v === 'orgchart' ? '🌳 Organigrama' : '🔄 Flujo'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['all', ...crews] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCrew(c)}
            style={{
              padding: '4px 10px',
              borderRadius: 14,
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              background: filterCrew === c ? `${crewColors[c] ?? '#6366f1'}22` : 'transparent',
              border: filterCrew === c ? `1px solid ${crewColors[c] ?? '#6366f1'}` : '1px solid rgba(255,255,255,0.08)',
              color: filterCrew === c ? (crewColors[c] ?? '#6366f1') : 'var(--cs-text-muted)',
            }}
          >
            {c === 'all' ? 'Todos' : c}
          </button>
        ))}
      </div>
      {/* Stats */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        {[
          { label: 'Total', val: 20, color: '#6366f1' },
          { label: 'LLM', val: 2, color: '#ec4899' },
          { label: 'Auto', val: 1, color: '#22c55e' },
          { label: 'Crews', val: 4, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: 'var(--cs-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
