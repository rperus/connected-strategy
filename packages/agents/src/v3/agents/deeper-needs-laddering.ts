import { z } from 'zod';
import { ws04Schema, ws06Schema } from '@cs/domain';
import type { WS01_JourneyMap, WS04_WhyHowLadder, WS06_RepeatLearning } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import { EventHub } from "../hub/event-hub.js";

interface DeeperNeedsLadderingInput {
  ws01Output: WS01_JourneyMap;
  projectName: string;
}

interface DeeperNeedsLadderingOutput {
  ws04: WS04_WhyHowLadder;
  ws06: WS06_RepeatLearning;
}

const comboSchema = z.object({
  ws04: ws04Schema,
  ws06: ws06Schema
});

export function registerDeeperNeedsLaddering(hub: EventHub, ctx: any): void {
    hub.subscribe<DeeperNeedsLadderingInput>('_R_U_N__DEEPER_NEEDS_LADDERING', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const prompt = `
Analiza el WS01 Journey de ${input.projectName} y:

Para WS04:
Construye el ladder why/how partiendo de "el cliente paga por X" y subiendo hasta "el propósito profundo es Y." Mínimo 3 rungs, recomendado 5.

Para WS06:
Identifica el currentLevel (1-4) basado en evidencia real (¿hay personalización? ¿hay datos agregados? ¿hay deeper-purpose en el messaging?). Provee pathToNextLevel con acción concreta.

WS01 Data:
${JSON.stringify(input.ws01Output, null, 2)}
`;

        const result = await callLLMValidated(
          ctx.llm,
          prompt,
          comboSchema,
          { temperature: 0.4, maxOutputTokens: 6000 }
        );

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__DEEPER_NEEDS_LADDERING_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result as DeeperNeedsLadderingOutput },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__DEEPER_NEEDS_LADDERING_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
