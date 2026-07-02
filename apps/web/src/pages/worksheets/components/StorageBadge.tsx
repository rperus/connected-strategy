import React from 'react';

export type StorageMode = 'loading' | 'sqlite' | 'localstorage';

interface StorageBadgeProps {
  mode: StorageMode;
}

export function StorageBadge({ mode }: StorageBadgeProps) {
  if (mode === 'loading') {
    return <span className="badge badge-cyan">Cargando…</span>;
  }
  if (mode === 'sqlite') {
    return <span className="badge badge-success">SQLite ✓</span>;
  }
  return <span className="badge badge-warning">localStorage</span>;
}
