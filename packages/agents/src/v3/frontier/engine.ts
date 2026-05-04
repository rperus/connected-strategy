import type { DriverScore, FrontierAnalysis } from '@cs/domain';

export interface FrontierInput {
  self: { name: string; wtpDrivers: DriverScore[]; costDrivers: DriverScore[] };
  competitors: Array<{ name: string }>;
  segment?: { name: string; weights?: Record<string, number> };
}

function aggregate(entityName: string, drivers: DriverScore[], weights: Record<string, number>): number {
  return drivers.reduce((sum, d) => {
    const score = entityName === 'self' ? d.selfScore : (d.competitorScores[entityName] ?? 0);
    const w = weights[d.name] ?? d.weight ?? (drivers.length > 0 ? 1 / drivers.length : 1);
    return sum + score * w;
  }, 0);
}

export function computeFrontier(input: FrontierInput): FrontierAnalysis {
  const wtpWeights = input.segment?.weights ?? {};
  const costWeights = input.segment?.weights ?? {};

  const entities = ['self', ...input.competitors.map(c => c.name)];
  
  const points = entities.map(name => {
    const wtp = aggregate(name, input.self.wtpDrivers, wtpWeights);
    // Lower cost is better in analysis, but we represent it such that cost logic expects:
    // If score > 0 (meaning higher cost), it's worse. So we negate it to make "higher is better" for frontier math.
    const cost = -aggregate(name, input.self.costDrivers, costWeights);
    return {
      entity: name,
      wtp,
      cost,
      dominatedBy: [] as string[]
    };
  });

  for (const p of points) {
    for (const q of points) {
      if (p.entity === q.entity) continue;
      // q dominates p if q is better or equal in both and strictly better in at least one
      if (q.wtp >= p.wtp && q.cost >= p.cost && (q.wtp > p.wtp || q.cost > p.cost)) {
        p.dominatedBy.push(q.entity);
      }
    }
  }

  const paretoFront = points.filter(p => p.dominatedBy.length === 0).map(p => p.entity);

  const selfPoint = points.find(p => p.entity === 'self')!;
  let selfPosition: 'below' | 'on' | 'above';
  
  if (selfPoint.dominatedBy.length === 0 && paretoFront.length === 1 && paretoFront[0] === 'self') {
    selfPosition = 'above';
  } else if (selfPoint.dominatedBy.length === 0) {
    selfPosition = 'on';
  } else {
    selfPosition = 'below';
  }

  return {
    axes: {
      wtpDrivers: input.self.wtpDrivers.map(d => d.name),
      costDrivers: input.self.costDrivers.map(d => d.name)
    },
    points: points.map(p => ({
      entity: p.entity,
      wtp: p.wtp,
      cost: p.cost,
      dominatedBy: p.dominatedBy
    })),
    paretoFront,
    selfPosition,
    candidateMoves: []
  };
}
