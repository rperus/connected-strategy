import path from 'path';
import fs from 'fs/promises';
import type { ProjectStateV3 } from '../state-store.js';
import type { AgentV3Context } from '../types.js';
import { buildManifest } from './manifest-builder.js';
import { buildAcceptanceTests } from './acceptance-builder.js';
import { buildStrategyDoc } from './strategy-builder.js';
import { buildAntigravityPrompt } from './prompt-builder-handoff.js';

function generateIndex(state: ProjectStateV3, moves: Array<{ moveId: string; title: string; effort: string; impact: string }>): string {
  return `# Antigravity Moves — ${state.projectName}

Generated: ${state.lastRunAt}
Run ID: ${state.lastRunId}
Health Score: ${state.synthesis?.healthScore?.value} (CI ${state.synthesis?.healthScore?.ci?.join('-')})

## Executive Summary

${state.synthesis?.executiveSummary}

## Moves (sorted by impact)

${moves.map((m) => `### ${m.moveId}: ${m.title}

- Impact: **${m.impact}** | Effort: **${m.effort}**
- Files: [manifest.json](./${m.moveId}/manifest.json)
- Why: [strategy.md](./${m.moveId}/strategy.md)
- Tests: [acceptance-tests.md](./${m.moveId}/acceptance-tests.md)
- Antigravity prompt: [prompt.md](./${m.moveId}/prompt.md)

`).join('\n')}

---

## How to use

1. Pick a move (highest impact / lowest effort first usually)
2. Open its prompt.md
3. Paste into Antigravity
4. Antigravity reads the other 3 files and implements
5. After commit, mark complete in state.json:userContext.completedPriorities

Re-run \`POST /api/pipeline/run-v3\` after completing moves to get fresh analysis.
`;
}

export async function runHandoffPhase(
  state: ProjectStateV3,
  ctx: AgentV3Context
): Promise<{ movesGenerated: number; indexPath: string }> {
  if (!state.synthesis?.topPriorities) {
    throw new Error('No topPriorities to handoff');
  }

  const baseDir = path.join('data', 'projects', state.projectId, 'antigravity');
  await fs.mkdir(baseDir, { recursive: true });

  const movesGenerated: Array<{ moveId: string; title: string; effort: string; impact: string }> = [];

  for (let i = 0; i < state.synthesis.topPriorities.length; i++) {
    const priority = state.synthesis.topPriorities[i];
    const moveId = `move-${i + 1}`;
    const moveDir = path.join(baseDir, moveId);
    await fs.mkdir(moveDir, { recursive: true });

    ctx.log(`[handoff] generating ${moveId}: ${priority.title}`);

    const manifest = await buildManifest(priority, state, ctx);
    await fs.writeFile(path.join(moveDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    const acceptanceMd = await buildAcceptanceTests(priority, manifest, state, ctx);
    await fs.writeFile(path.join(moveDir, 'acceptance-tests.md'), acceptanceMd);

    const strategyMd = await buildStrategyDoc(priority, state, ctx);
    await fs.writeFile(path.join(moveDir, 'strategy.md'), strategyMd);

    const promptMd = buildAntigravityPrompt(moveId, state.projectId, manifest);
    await fs.writeFile(path.join(moveDir, 'prompt.md'), promptMd);

    movesGenerated.push({
      moveId,
      title: priority.title,
      effort: priority.estimatedEffort,
      impact: priority.estimatedImpact,
    });
  }

  // Generate INDEX.md
  const indexMd = generateIndex(state, movesGenerated);
  const indexPath = path.join(baseDir, 'INDEX.md');
  await fs.writeFile(indexPath, indexMd);

  return { movesGenerated: movesGenerated.length, indexPath };
}
