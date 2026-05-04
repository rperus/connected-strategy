export * from './api-design-critic.js';
export * from './db-architect.js';
export * from './frontend-perf.js';
export * from './ml-readiness.js';
export * from './observability.js';
export * from './performance-engineer.js';
export * from './schema.js';
export * from './security-auditor.js';

export function mergeSwarmResults(results: any[]): any {
  return {
    combinedFindings: results.flatMap(r => r.data || []),
  };
}
