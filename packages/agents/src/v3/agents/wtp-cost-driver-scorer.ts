import { z } from 'zod';
import { driverScoreSchema } from '@cs/domain';
import type { WS01_JourneyMap, DriverScore } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import { EventHub } from "../hub/event-hub.js";

interface WtpCostDriverScorerInput {
  ws01Output: WS01_JourneyMap;
  ws02Output?: any; 
  competitors: string[];
}

interface WtpCostDriverScorerOutput {
  wtpDrivers: DriverScore[];
  costDrivers: DriverScore[];
}

const outSchema = z.object({
  wtpDrivers: z.array(driverScoreSchema),
  costDrivers: z.array(driverScoreSchema)
});

export function registerWtpCostDriverScorer(hub: EventHub, ctx: any): void {
    hub.subscribe<WtpCostDriverScorerInput>('_R_U_N__WTP_COST_DRIVER_SCORER', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const prompt = `
Genera vectores cuantitativos para WTP Drivers y Cost Drivers.
WS01: ${JSON.stringify(input.ws01Output)}
Competidores: ${input.competitors.join(', ')}

Crítico: selfScore y competitorScores[name] DEBEN ser números (-2, -1, 0, 1, 2).
Distribuye los pesos (weight) uniformemente para que sumen 1.
`;

        const result = await callLLMValidated(
          ctx.llm,
          prompt,
          outSchema,
          { temperature: 0.2, maxOutputTokens: 8000 }
        );

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__WTP_COST_DRIVER_SCORER_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result as WtpCostDriverScorerOutput },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__WTP_COST_DRIVER_SCORER_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
