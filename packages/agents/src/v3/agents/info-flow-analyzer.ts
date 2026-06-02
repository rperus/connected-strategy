import { ws03Schema } from '@cs/domain';
import type { WS01_JourneyMap, WS03_InfoFlow } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import { EventHub } from "../hub/event-hub.js";

interface InfoFlowAnalyzerInput {
  ws01Output: WS01_JourneyMap;
}

interface InfoFlowAnalyzerOutput {
  ws03: WS03_InfoFlow;
}

export function registerInfoFlowAnalyzer(hub: EventHub, ctx: any): void {
    hub.subscribe<InfoFlowAnalyzerInput>('_R_U_N__INFO_FLOW_ANALYZER', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const prompt = `
Para cada stage del WS01 ya mapeado, identifica los 6 atributos del flujo de información: 
description, trigger, frequency, richness, customerEffort, inferenceParty, improvementIdea.

WS01 Data:
${JSON.stringify(input.ws01Output, null, 2)}
`;

        const result = await callLLMValidated(
          ctx.llm,
          prompt,
          ws03Schema,
          { temperature: 0.2, maxOutputTokens: 8000 }
        );

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__INFO_FLOW_ANALYZER_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: { ws03: result as WS03_InfoFlow } },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__INFO_FLOW_ANALYZER_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
