import { z } from 'zod';
import type { WS07_ExistingMatrix, WS08_NewIdeasMatrix } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import type { RevenueModelArchitectOutput } from '../state-types.js';
import { EventHub } from "../hub/event-hub.js";

interface RevenueModelArchitectInput {
  ws07Output: WS07_ExistingMatrix;
  ws08Output: WS08_NewIdeasMatrix;
  competitorPricing: string[];
}

const outSchema = z.object({
  connectionArchitecture: z.string(),
  revenueModel: z.object({
    what: z.string(),
    when: z.string(),
    who: z.string(),
    why: z.string(),
    currency: z.string(),
  }),
  alternatives: z.array(z.string())
});

export function registerRevenueModelArchitect(hub: EventHub, ctx: any): void {
    hub.subscribe<RevenueModelArchitectInput>('_R_U_N__REVENUE_MODEL_ARCHITECT', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const prompt = `
Aplica los 5 levers de precision pricing (WHAT/WHEN/WHO/WHY/CURRENCY) basándote en:
WS07: ${JSON.stringify(input.ws07Output)}
WS08: ${JSON.stringify(input.ws08Output)}
Competitor Pricing: ${input.competitorPricing.join(', ')}
`;

        const result = await callLLMValidated(
          ctx.llm,
          prompt,
          outSchema,
          { temperature: 0.5, maxOutputTokens: 6000 }
        );

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__REVENUE_MODEL_ARCHITECT_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result as RevenueModelArchitectOutput },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__REVENUE_MODEL_ARCHITECT_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
