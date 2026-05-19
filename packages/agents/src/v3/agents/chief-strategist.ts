import type { AgentV3Context, AgentV3Result } from '../types.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { SwarmFinding } from '../agents/swarm/schema.js';
import { buildChiefStrategistPrompt } from '../synthesis/prompt-builder.js';
import { runToolLoop } from '../synthesis/tool-loop.js';
import { computeHealthScoreWithCI } from '../synthesis/health-score.js';
import { synthesisSchema } from '@cs/domain';

export async function runChiefStrategist(
  input: { state: ProjectStateV3; liveFindings?: SwarmFinding[] },
  ctx: AgentV3Context & { priorRunId?: string }
): Promise<AgentV3Result<ProjectStateV3['synthesis']>> {
  const start = Date.now();
  const prompt = buildChiefStrategistPrompt(input.state, input.liveFindings);

  let toolCallCount = 0;
  let iterations = 0;
  let parsedSynthesis: ProjectStateV3['synthesis'] | undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const loopPrompt = prompt + (attempt > 1 ? `\n\nPrevious attempt failed schema validation. Return strictly valid JSON matching the schema.` : '');
    
    // We add state and priorRunId to context for tools
    const toolCtx = { ...ctx, state: input.state };
    
    const { finalText, toolCallCount: tc, iterations: it } = await runToolLoop(
      loopPrompt,
      toolCtx,
      { maxIterations: 10, maxToolCalls: 12, onProgress: (msg) => ctx.log(msg) }
    );
    
    toolCallCount += tc;
    iterations += it;

    let json = finalText;
    const match = finalText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      json = match[1].trim();
    }

    try {
      const parsedRaw = JSON.parse(json);
      const parsed = synthesisSchema.safeParse(parsedRaw);
      if (parsed.success) {
        parsedSynthesis = parsed.data;
        break;
      } else {
        ctx.log(`Validation failed: ${parsed.error.message}`);
        if (attempt === 3) {
          return {
            success: false,
            error: `Synthesis schema validation failed: ${parsed.error.message}`,
            durationMs: Date.now() - start,
            tokensUsed: 0,
            llmCalls: iterations,
            filesRead: [],
          };
        }
      }
    } catch (e: any) {
      ctx.log(`JSON parse failed: ${e.message}`);
      if (attempt === 3) {
        return {
          success: false,
          error: `JSON parse failed: ${e.message}`,
          durationMs: Date.now() - start,
          tokensUsed: 0,
          llmCalls: iterations,
          filesRead: [],
        };
      }
    }
  }

  if (!parsedSynthesis!.healthScore) {
    parsedSynthesis!.healthScore = computeHealthScoreWithCI(input.state);
  }

  parsedSynthesis!.activitySystemMermaid = input.state.competitive?.activitySystem?.mermaid ?? '';

  return { 
    success: true, 
    data: parsedSynthesis!, 
    durationMs: Date.now() - start, 
    tokensUsed: 0, 
    llmCalls: iterations, 
    filesRead: [] 
  };
}
