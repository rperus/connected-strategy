import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../config';

interface HealthResponse {
  ok: boolean;
  status: string;
}

/**
 * Small dot + label showing if the API server is reachable.
 * Polls /api/health every 10s.
 */
export function ApiStatusIndicator() {
  const { data, error } = usePolling<HealthResponse>(api.health, 10_000);

  const isUp = data?.ok === true;
  const color = error ? '#ef4444' : isUp ? '#10b981' : '#f59e0b';
  const label = error ? 'API offline' : isUp ? 'API ✓' : '...';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10, color: 'var(--cs-text-dim)', padding: '4px 0',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color,
        boxShadow: isUp ? '0 0 4px rgba(16,185,129,0.5)' : undefined,
      }} />
      <span>{label}</span>
    </div>
  );
}
