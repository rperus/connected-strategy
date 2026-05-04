import type { ProjectStateV3 } from '../state-store.js';
import type { MoveCandidate } from './candidate-moves.js';

function estimateWtpDeltas(idea: any, state: ProjectStateV3): Record<string, number> {
  return idea.feasibility >= 4 ? { differentiation: 1, innovation: 0.5 } : { innovation: 0.5 };
}

function estimateCostDeltas(idea: any, state: ProjectStateV3): Record<string, number> {
  return idea.feasibility >= 4 ? { efficiency: 0.5 } : { efficiency: 0 };
}

export function discoverMoves(state: ProjectStateV3): MoveCandidate[] {
  const moves: MoveCandidate[] = [];

  if (state.wharton?.ws08) {
    for (const idea of state.wharton.ws08.ideas) {
      moves.push({
        source: 'ws08_idea',
        name: idea.description.slice(0, 80),
        description: idea.description,
        wharton_basis: [`WS08:${idea.cell.mode}/${idea.cell.architecture}`],
        wtpDriverDeltas: estimateWtpDeltas(idea, state),
        costDriverDeltas: estimateCostDeltas(idea, state),
        requiredActivities: idea.requiredConnections || [],
      });
    }
  }

  if (state.swarm) {
    for (const f of state.swarm.findings) {
      if (f.severity === 'critical' || f.severity === 'high') {
        if (f.whartonImpact.raisesWtp || f.whartonImpact.reducesCost) {
          moves.push({
            source: 'swarm_finding',
            name: f.title,
            description: f.remediation,
            wharton_basis: [f.id],
            wtpDriverDeltas: f.whartonImpact.raisesWtp ? { 'quality': 1 } : {},
            costDriverDeltas: f.whartonImpact.reducesCost ? { 'maintenance': 1 } : {},
            requiredActivities: [],
          });
        }
      }
    }
  }

  return moves;
}
