import { useState, useEffect } from 'react';
import { api } from '../config';

export interface Finding {
  projectId: string;
  projectName: string;
  agentId: string;
  finding: {
    category: string;
    title: string;
    detail: string;
    severity: 'high' | 'medium' | 'low';
    loopPhase: string;
    impactOnWTP: string;
    impactOnCost: string;
    impactOnSwitchingCosts: string;
    evidence?: string[];
  };
}

/**
 * Fetch findings from the pipeline cache, filtered by agent IDs.
 * Returns { findings, loading, source }
 */
export function useFindings(agentIds: string[]) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'empty'>('empty');

  useEffect(() => {
    fetch(api.pipelineFindings)
      .then(r => r.json() as Promise<{ ok: boolean; data: Finding[] }>)
      .then(body => {
        if (body.ok && body.data?.length > 0) {
          const filtered = body.data.filter(f => agentIds.includes(f.agentId));
          setFindings(filtered);
          setSource('api');
        }
      })
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false));
  }, [agentIds.join(',')]);

  return { findings, loading, source };
}
