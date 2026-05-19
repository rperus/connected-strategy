import { describe, it, expect } from 'vitest';
import { computeFrontier } from '../engine.js';
import { evaluateMove } from '../candidate-moves.js';
import { discoverMoves } from '../discover-moves.js';
import type { DriverScore, ActivitySystemMap } from '@cs/domain';

describe('computeFrontier', () => {
  it('detecta single-Pareto-optimal correctly', () => {
    const input = {
      self: {
        name: 'self',
        wtpDrivers: [{ name: 'A', selfScore: 2, competitorScores: { comp_a: 0, comp_b: 1 }, weight: 1 }] as DriverScore[],
        costDrivers: [{ name: 'B', selfScore: -2, competitorScores: { comp_a: 1, comp_b: 0 }, weight: 1 }] as DriverScore[]
      },
      competitors: [{ name: 'comp_a' }, { name: 'comp_b' }]
    };

    // self: wtp=2, cost=-(-2)=2  (higher cost score = better in math logic)
    // comp_a: wtp=0, cost=-(1)=-1
    // comp_b: wtp=1, cost=-(0)=0
    // self dominates all
    
    const result = computeFrontier(input);
    expect(result.paretoFront).toEqual(['self']);
    expect(result.selfPosition).toBe('above');
  });

  it('detecta self below frontier', () => {
    const input = {
      self: {
        name: 'self',
        wtpDrivers: [{ name: 'A', selfScore: -1, competitorScores: { comp: 2 }, weight: 1 }] as DriverScore[],
        costDrivers: [{ name: 'B', selfScore: 1, competitorScores: { comp: -2 }, weight: 1 }] as DriverScore[]
      },
      competitors: [{ name: 'comp' }]
    };
    // self: wtp=-1, cost=-1
    // comp: wtp=2, cost=-(-2)=2
    const result = computeFrontier(input);
    expect(result.selfPosition).toBe('below');
    const selfPoint = result.points.find(p => p.entity === 'self');
    expect(selfPoint?.dominatedBy).toContain('comp');
  });

  it('detecta self above frontier (raro)', () => {
    const input = {
      self: {
        name: 'self',
        wtpDrivers: [{ name: 'A', selfScore: 2, competitorScores: { comp_a: 1, comp_b: 0 }, weight: 1 }] as DriverScore[],
        costDrivers: [{ name: 'B', selfScore: -2, competitorScores: { comp_a: -1, comp_b: 0 }, weight: 1 }] as DriverScore[]
      },
      competitors: [{ name: 'comp_a' }, { name: 'comp_b' }]
    };
    const result = computeFrontier(input);
    expect(result.selfPosition).toBe('above');
    expect(result.paretoFront).toEqual(['self']);
  });

  it('handles empty competitors', () => {
    const input = {
      self: {
        name: 'self',
        wtpDrivers: [{ name: 'A', selfScore: 2, competitorScores: {}, weight: 1 }] as DriverScore[],
        costDrivers: [{ name: 'B', selfScore: -1, competitorScores: {}, weight: 1 }] as DriverScore[]
      },
      competitors: []
    };
    const result = computeFrontier(input);
    expect(result.paretoFront.length).toBe(1);
    expect(result.selfPosition).toBe('above');
  });

  it('respects custom weights', () => {
    const input = {
      self: {
        name: 'self',
        wtpDrivers: [{ name: 'A', selfScore: 2, competitorScores: { comp: 2 }, weight: 1 }] as DriverScore[],
        costDrivers: [{ name: 'B', selfScore: 1, competitorScores: { comp: 1 }, weight: 1 }] as DriverScore[]
      },
      competitors: [{ name: 'comp' }],
      segment: { name: 'seg', weights: { 'A': 2 } }
    };
    const result = computeFrontier(input);
    const selfPoint = result.points.find(p => p.entity === 'self');
    expect(selfPoint?.wtp).toBe(4); // 2 * 2
  });
});

describe('evaluateMove', () => {
  const baseDrivers = { wtp: [{ name: 'A', weight: 1 }] as DriverScore[], cost: [{ name: 'B', weight: 1 }] as DriverScore[] };
  const current = { wtp: 1, cost: 1 };
  const competitors = [{ entity: 'comp', wtp: 0, cost: 0 }];

  it('breaksTradeOffs=true cuando ambos ejes mejoran', () => {
    const move = {
      source: 'manual' as const, name: 'M1', description: '', wharton_basis: [],
      wtpDriverDeltas: { 'A': 1 }, costDriverDeltas: { 'B': 1 }, requiredActivities: []
    };
    const res = evaluateMove(current, competitors, move, baseDrivers, undefined);
    expect(res.breaksTradeOffs).toBe(true);
  });

  it('breaksTradeOffs=false cuando sólo mejora WTP a costa de Cost', () => {
    const move = {
      source: 'manual' as const, name: 'M1', description: '', wharton_basis: [],
      wtpDriverDeltas: { 'A': 1 }, costDriverDeltas: { 'B': -1 }, requiredActivities: []
    };
    const res = evaluateMove(current, competitors, move, baseDrivers, undefined);
    expect(res.breaksTradeOffs).toBe(false);
  });

  it('imitabilityScore alto cuando required activities son SP + alta centralidad', () => {
    const sys: ActivitySystemMap = {
      positioning: [], imitabilityScore: 0,
      coreChoices: [{ id: '1', label: '', centrality: 5, valueChainStage: 'operations' }, { id: '2', label: '', centrality: 1, valueChainStage: 'operations' }],
      supportingActivities: [], reinforcementMatrix: {}, oeVsSp: { '1': 'SP', '2': 'OE' }, mermaid: ''
    };
    const move = {
      source: 'manual' as const, name: 'M1', description: '', wharton_basis: [],
      wtpDriverDeltas: {}, costDriverDeltas: {}, requiredActivities: ['1']
    };
    const res = evaluateMove(current, competitors, move, baseDrivers, sys);
    expect(res.imitabilityScore).toBeGreaterThan(0.5); 
  });

  it('imitabilityScore bajo cuando required activities son OE', () => {
    const sys: ActivitySystemMap = {
      positioning: [], imitabilityScore: 0,
      coreChoices: [{ id: '1', label: '', centrality: 5, valueChainStage: 'operations' }, { id: '2', label: '', centrality: 1, valueChainStage: 'operations' }],
      supportingActivities: [], reinforcementMatrix: {}, oeVsSp: { '1': 'OE', '2': 'OE' }, mermaid: ''
    };
    const move = {
      source: 'manual' as const, name: 'M1', description: '', wharton_basis: [],
      wtpDriverDeltas: {}, costDriverDeltas: {}, requiredActivities: ['1']
    };
    const res = evaluateMove(current, competitors, move, baseDrivers, sys);
    expect(res.imitabilityScore).toBeLessThan(0.5); 
  });
});

describe('discoverMoves', () => {
  it('mapea cada WS08 idea a un MoveCandidate', () => {
    const state = {
      wharton: {
        ws08: {
          ideas: [{
            cell: { mode: 'recognize', architecture: 'respond-to-desire' },
            description: 'Idea 1',
            feasibility: 5,
            requiredConnections: ['act1']
          }]
        }
      }
    } as any;
    
    const moves = discoverMoves(state);
    expect(moves.length).toBe(1);
    expect(moves[0].source).toBe('ws08_idea');
    expect(moves[0].requiredActivities).toEqual(['act1']);
  });

  it('filtra swarm findings por severity y whartonImpact', () => {
    const state = {
      swarm: {
        findings: [
          { severity: 'critical', title: 'Critical', remediation: 'Fix', id: 'F1', whartonImpact: { raisesWtp: true, reducesCost: false } },
          { severity: 'low', title: 'Low', remediation: 'Fix', id: 'F2', whartonImpact: { raisesWtp: true, reducesCost: false } }
        ]
      }
    } as any;
    
    const moves = discoverMoves(state);
    expect(moves.length).toBe(1);
    expect(moves[0].name).toBe('Critical');
    expect(moves[0].source).toBe('swarm_finding');
  });
});
