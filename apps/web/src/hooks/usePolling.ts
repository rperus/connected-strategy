/**
 * usePolling — Generic polling hook for live data refresh.
 *
 * Fetches URL every `intervalMs` milliseconds and returns latest data.
 * Stops polling when component unmounts.
 * Includes status tracking: 'idle' | 'loading' | 'live' | 'error'.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type PollStatus = 'idle' | 'loading' | 'live' | 'error';

interface UsePollResult<T> {
  data: T | null;
  status: PollStatus;
  error: string | null;
  /** Force an immediate refetch */
  refetch: () => void;
  /** Timestamp of last successful fetch */
  lastUpdated: number | null;
}

export function usePolling<T>(
  url: string,
  intervalMs = 5000,
  enabled = true,
): UsePollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<PollStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setStatus((prev) => (prev === 'idle' ? 'loading' : prev));
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const payload = json.data ?? json;
      setData(payload as T);
      setStatus('live');
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Set up polling
    timerRef.current = setInterval(fetchData, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [url, intervalMs, enabled, fetchData]);

  return { data, status, error, refetch: fetchData, lastUpdated };
}
