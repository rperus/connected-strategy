import type { AgentV3Context, AgentV3Result } from '../types.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { SwarmFinding } from '../agents/swarm/schema.js';
import { buildChiefStrategistPrompt } from '../synthesis/prompt-builder.js';
import { runToolLoop } from '../synthesis/tool-loop.js';
import { computeHealthScoreWithCI } from '../synthesis/health-score.js';
import { synthesisSchema } from '@cs/domain';
import { EventHub } from "../hub/event-hub.js";

export function registerChiefStrategist(hub: EventHub, ctx: any): void {
    hub.subscribe<{ state: ProjectStateV3; liveFindings?: SwarmFinding[] }>('RUN_CHIEF_STRATEGIST', async (event) => {
          const input = event.payload;
          const start = Date.now();
    try {
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
              await hub.publish({
                domain: 'lifecycle',
                type: 'CHIEF_STRATEGIST_FAILED',
                projectId: event.projectId,
                payload: { success: false, error: `Synthesis schema validation failed: ${parsed.error.message}`, durationMs: Date.now() - start },
                timestamp: Date.now()
              });
              return;
            }
          }
        } catch (e: any) {
          ctx.log(`JSON parse failed: ${e.message}`);
          if (attempt === 3) {
            await hub.publish({
              domain: 'lifecycle',
              type: 'CHIEF_STRATEGIST_FAILED',
              projectId: event.projectId,
              payload: { success: false, error: `JSON parse failed: ${e.message}`, durationMs: Date.now() - start },
              timestamp: Date.now()
            });
            return;
          }
        }
      }

      if (!parsedSynthesis!.healthScore) {
        parsedSynthesis!.healthScore = computeHealthScoreWithCI(input.state);
      }

      parsedSynthesis!.activitySystemMermaid = input.state.competitive?.activitySystem?.mermaid ?? '';

      await hub.publish({
        domain: 'lifecycle',
        type: 'CHIEF_STRATEGIST_COMPLETED',
        projectId: event.projectId,
        payload: { success: true, data: parsedSynthesis!, durationMs: Date.now() - start },
        timestamp: Date.now()
      });
    } catch (e: any) {
      ctx.log(`ChiefStrategist fatal error: ${e.message}`);
      await hub.publish({
        domain: 'lifecycle',
        type: 'CHIEF_STRATEGIST_FAILED',
        projectId: event.projectId,
        payload: { success: false, error: e.message, durationMs: Date.now() - start },
        timestamp: Date.now()
      });
    }
  });
}
