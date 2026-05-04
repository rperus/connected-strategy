import type { DriverScore, ActivitySystemMap } from '@cs/domain';

export interface MoveCandidate {
  source: 'ws08_idea' | 'wharton_finding' | 'swarm_finding' | 'manual';
  name: string;
  description: string;
  wharton_basis: string[];
  wtpDriverDeltas: Record<string, number>;
  costDriverDeltas: Record<string, number>;
  requiredActivities: string[];
}

function sumDeltas(deltas: Record<string, number>, baseDrivers: DriverScore[]): number {
  return baseDrivers.reduce((sum, d) => {
    const delta = deltas[d.name] ?? 0;
    const w = d.weight ?? (baseDrivers.length > 0 ? 1 / baseDrivers.length : 1);
    return sum + delta * w;
  }, 0);
}

function computeMoveImitability(move: MoveCandidate, sys: ActivitySystemMap): number {
  if (!sys || !sys.coreChoices || sys.coreChoices.length === 0) return 0;
  
  const total = move.requiredActivities.reduce((acc, aid) => {
    const choice = sys.coreChoices.find(c => c.id === aid);
    const isSP = sys.oeVsSp?.[aid] === 'SP';
    const centrality = choice?.centrality ?? 1;
    return acc + (isSP ? centrality : centrality * 0.3);
  }, 0);

  const maxCentrality = sys.coreChoices.reduce((a, c) => a + (c.centrality ?? 1), 0);
  return Math.min(1, total / Math.max(1, maxCentrality));
}

export function evaluateMove(
  current: { wtp: number; cost: number },
  competitors: Array<{ entity: string; wtp: number; cost: number }>,
  move: MoveCandidate,
  baseDrivers: { wtp: DriverScore[]; cost: DriverScore[] },
  activitySystem: ActivitySystemMap | undefined
): {
  projectedPoint: { wtp: number; cost: number };
  breaksTradeOffs: boolean;
  dominatesAll: boolean;
  imitabilityScore: number;
} {
  const newWtp = current.wtp + sumDeltas(move.wtpDriverDeltas, baseDrivers.wtp);
  // Cost logic expects cost to be inverted: lower real cost = higher 'cost' score in math
  // So costDriver deltas that are positive (e.g. +1 maintenance cost savings) should be ADDED to current.cost
  // Assuming deltas are positive when improving:
  const newCost = current.cost + sumDeltas(move.costDriverDeltas, baseDrivers.cost);

  const breaksTradeOffs = newWtp > current.wtp && newCost > current.cost;

  const dominatesAll = competitors.every(
    c => newWtp >= c.wtp && newCost >= c.cost && (newWtp > c.wtp || newCost > c.cost)
  );

  const imitabilityScore = activitySystem ? computeMoveImitability(move, activitySystem) : 0;

  return {
    projectedPoint: { wtp: newWtp, cost: newCost },
    breaksTradeOffs,
    dominatesAll,
    imitabilityScore
  };
}
