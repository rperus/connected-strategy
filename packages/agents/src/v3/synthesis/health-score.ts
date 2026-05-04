import type { ProjectStateV3 } from '../state-store.js';

export function computeHealthScoreWithCI(state: ProjectStateV3): { value: number; ci: [number, number] } {
  const positionScore = state.frontier?.selfPosition === 'above' ? 30 : state.frontier?.selfPosition === 'on' ? 15 : 0;
  const imitabilityBonus = (state.competitive?.activitySystem?.imitabilityScore ?? 0) * 25;
  const criticalCount = state.swarm?.findings.filter(f => f.severity === 'critical').length ?? 0;
  const highCount = state.swarm?.findings.filter(f => f.severity === 'high').length ?? 0;
  const repeatBonus = ((state.wharton?.ws06?.currentLevel ?? 1) - 1) * 10;

  let score = 50 + positionScore + imitabilityBonus + repeatBonus
            - Math.min(40, criticalCount * 8)
            - Math.min(15, highCount * 3);
  score = Math.max(0, Math.min(100, score));

  // CI based on data completeness
  let uncertainty = 0;
  if (!state.competitive?.competitors || state.competitive.competitors.length < 3) uncertainty += 8;
  if (!state.frontier) uncertainty += 10;
  if (!state.competitive?.activitySystem) uncertainty += 6;
  if ((state.wharton?.ws08?.ideas?.length ?? 0) < 3) uncertainty += 4;

  return {
    value: Math.round(score),
    ci: [Math.max(0, Math.round(score - uncertainty)), Math.min(100, Math.round(score + uncertainty))],
  };
}
