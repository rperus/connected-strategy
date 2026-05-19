import type { ProjectStateV3 } from '../state-store.js';
import type { SwarmFinding } from '../agents/swarm/schema.js';

export function buildChiefStrategistPrompt(state: ProjectStateV3, liveFindings?: SwarmFinding[]): string {
  const formatWS07 = (ws07: any) => {
    if (!ws07) return 'N/A';
    const lines: string[] = [];
    for (const [mode, archs] of Object.entries(ws07.cells)) {
      for (const [arch, cell] of Object.entries(archs as Record<string, any>)) {
        if (cell.isWhitespace) {
          lines.push(`- [WHITESPACE] ${mode} / ${arch}`);
        } else {
           lines.push(`- ${mode} / ${arch}: self=${cell.selfActivities?.length}, comps=${cell.competitorActivities?.length}`);
        }
      }
    }
    return lines.join('\n');
  };

  return `# Strategy Audit — ${state.projectName}

You are the Chief Strategist. Your job is to produce a Wharton-grade strategic
synthesis using ALL the data collected. You have tools to investigate further.

## Pre-collected analysis (read carefully)

### WS01 Customer Journey + WS02 WTP/Pain
${JSON.stringify(state.wharton?.ws01, null, 2)?.slice(0, 6000)}

### WS04 Why-How Ladder + WS06 Repeat Level
${JSON.stringify({ ws04: state.wharton?.ws04, ws06: state.wharton?.ws06 }, null, 2)?.slice(0, 3000)}

### WS07 Existing Matrix (whitespace cells highlighted)
${formatWS07(state.wharton?.ws07)}

### WS08 New Ideas
${JSON.stringify(state.wharton?.ws08?.ideas, null, 2)?.slice(0, 4000)}

### Activity System
- Positioning: ${state.competitive?.activitySystem?.positioning?.join(', ') ?? 'N/A'}
- Imitability score: ${state.competitive?.activitySystem?.imitabilityScore ?? 'N/A'}
- Mermaid: ${state.competitive?.activitySystem?.mermaid?.slice(0, 1500) ?? 'N/A'}

### Frontier
- Self position: ${state.frontier?.selfPosition ?? 'N/A'}
- Pareto front: ${state.frontier?.paretoFront?.join(', ') ?? 'N/A'}
- Top candidate moves (sorted): ${JSON.stringify(state.frontier?.candidateMoves?.slice(0, 5), null, 2) ?? 'N/A'}

### 5 Forces
${JSON.stringify(state.competitive?.fiveForces, null, 2)?.slice(0, 3000)}

### Swarm findings (critical + high only)
${(state.swarm?.findings ?? []).filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 20).map(f => `- [${f.severity}] ${f.title}`).join('\n') || 'N/A'}

${liveFindings && liveFindings.length > 0 ? `### LIVE cross-agent findings from this run (SharedFindingsStore)
⚡ These findings were discovered IN REAL TIME during this pipeline run by specialist agents:
${liveFindings.slice(0, 15).map(f => `- [${f.severity ?? 'medium'}] [${(f as any).agent ?? f.category}] ${f.title}: ${f.description ?? ''}`).join('\n')}
Use these to make your synthesis MORE grounded and specific.
` : ''}

### Competitors
${(state.competitive?.competitors ?? []).map(c => `- ${c.name} — ${c.positioning}`).join('\n') || 'N/A'}

## Your job

Answer the 5 Wharton Strategy Audit questions:

1. **Industry state and evolution.** What forces affect all players in this sector?
   How will they evolve over 12-24 months? Use scenarios from state.competitive.scenarios.

2. **WTP and cost drivers.** What drives WTP and cost for the segment? How is
   ${state.projectName} positioned vs competitors per the frontier analysis?

3. **Competitor movements / convergence.** Where are competitors heading? Is
   strategic convergence happening? Where is white-space?

4. **Best practices vs strategic differentiation.** Of ${state.projectName}'s
   activities, which are mere best practices (replicable easily) vs genuine
   differentiation (system-embedded)? Reference the activity system map and OE-vs-SP
   classification.

5. **Synergies in larger context.** If this project is part of a portfolio, how do
   its actions affect other parts? (Skip if standalone.)

## Three Fits assessment

For each fit (Internal / External / Dynamic), give:
- score 0-100
- 2-3 sentence justification anchored in evidence above
- gaps[] — concrete gaps to close

## Top priorities

Produce 5 priorities, sorted by impact × feasibility. Each priority must:
- Reference at least 1 specific frontier candidate move (by moveId) OR 1 specific swarm finding (by id)
- Have wharton_basis[] (which worksheets/concepts it derives from)
- Have antigravity_prompt_hint — a 2-3 sentence instruction for the Antigravity worker
  (PHASE-G will expand this into the full prompt)

## Output format

Respond with a SINGLE JSON object matching this schema (no prose outside the JSON):

\`\`\`json
{
  "strategyAuditAnswers": {
    "industryStateAndEvolution": "string (200-500 words)",
    "wtpAndCostDrivers": "string",
    "competitorMovements": "string",
    "bestPracticesVsDifferentiation": "string",
    "synergies": "string or null"
  },
  "threeFits": {
    "internal": { "score": 90, "justification": "string", "gaps": ["string"] },
    "external": { "score": 80, "justification": "string", "gaps": ["string"] },
    "dynamic": { "score": 70, "justification": "string", "gaps": ["string"] }
  },
  "topPriorities": [
    {
      "priorityId": "string",
      "title": "string (<=80 chars)",
      "summary": "string (2-3 sentences)",
      "wharton_basis": ["string"],
      "frontierMoveId": "string | null",
      "swarmFindingId": "string | null",
      "antigravityPromptHint": "string",
      "estimatedImpact": "high",
      "estimatedEffort": "days"
    }
  ],
  "executiveSummary": "string (<=1500 chars, written for a C-level reader)",
  "healthScore": { "value": 85, "ci": [80, 90] }
}
\`\`\`

## When to use tools

- If a worksheet field looks suspicious or thin → \`read_worksheet_answer\` to see raw value
- If a swarm finding mentions a file → \`read_file\` to verify the code is as described
- If you suspect a competitor's recent move conflicts with your data → leave it; do NOT
  hallucinate; report the gap in "gaps"
- If you need to know what changed since last run → \`compare_to_history\` with field path

You have a budget of 12 tool calls. Use them wisely.

Begin.
`;
}
