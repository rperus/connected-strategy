import React from 'react';

interface ProjectSelectorProps {
  projectId: string;
  onChange: (id: string) => void;
  availableProjects: Array<{ id: string; name: string }>;
}

export function ProjectSelector({ projectId, onChange, availableProjects }: ProjectSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span style={{ fontSize: 12, color: 'var(--cs-text-muted)', whiteSpace: 'nowrap' }}>Proyecto:</span>
      <select
        value={projectId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--cs-surface)',
          color: 'var(--cs-text)',
          border: '1px solid var(--cs-border)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {availableProjects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
