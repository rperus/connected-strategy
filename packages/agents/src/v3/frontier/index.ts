import type { ProjectStateV3 } from '../state-store.js';
import type { FrontierAnalysis } from '@cs/domain';
import { computeFrontier } from './engine.js';
import { discoverMoves } from './discover-moves.js';
import { evaluateMove } from './candidate-moves.js';

export async function runFrontierPhase(state: ProjectStateV3): Promise<FrontierAnalysis> {
  if (!state.competitive?.wtpDrivers || !state.competitive?.costDrivers) {
    throw new Error('Frontier requires competitive.wtpDrivers and costDrivers');
  }

  const baseFrontier = computeFrontier({
    self: {
      name: state.projectName,
      wtpDrivers: state.competitive.wtpDrivers,
      costDrivers: state.competitive.costDrivers,
    },
    competitors: (state.competitive.competitors ?? []).map(c => ({ name: c.name })),
  });

  const moves = discoverMoves(state);
  const selfPoint = baseFrontier.points.find(p => p.entity === 'self')!;
  const competitorsPoints = baseFrontier.points.filter(p => p.entity !== 'self');

  const evaluated = moves.map((m, i) => {
    const evaluation = evaluateMove(
      selfPoint,
      competitorsPoints,
      m,
      { wtp: state.competitive!.wtpDrivers!, cost: state.competitive!.costDrivers! },
      state.competitive!.activitySystem
    );
    
    return {
      moveId: `move-${i + 1}`,
      name: m.name,
      description: m.description,
      currentPoint: { wtp: selfPoint.wtp, cost: selfPoint.cost },
      projectedPoint: evaluation.projectedPoint,
      breaksTradeOffs: evaluation.breaksTradeOffs,
      dominatesAll: evaluation.dominatesAll,
      imitabilityScore: evaluation.imitabilityScore,
      requiredActivities: m.requiredActivities,
      wharton_basis: m.wharton_basis,
    };
  });

  evaluated.sort((a, b) => {
    if (a.dominatesAll !== b.dominatesAll) return a.dominatesAll ? -1 : 1;
    if (a.breaksTradeOffs !== b.breaksTradeOffs) return a.breaksTradeOffs ? -1 : 1;
    return b.imitabilityScore - a.imitabilityScore;
  });

  return { 
    ...baseFrontier, 
    candidateMoves: evaluated.slice(0, 12) 
  };
}
