import { z } from 'zod';
import { fiveForcesSchema, scenarioAnalysisSchema } from '@cs/domain';
import type { FiveForcesAnalysis, ScenarioAnalysis } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import { EventHub } from "../hub/event-hub.js";

interface IndustryStructureAnalystInput {
  projectName: string;
  sector: string;
  segment: string;
}

interface IndustryStructureAnalystOutput {
  fiveForces: FiveForcesAnalysis;
  scenarios: ScenarioAnalysis;
}

const comboSchema = z.object({
  fiveForces: fiveForcesSchema,
  scenarios: scenarioAnalysisSchema
});

export function registerIndustryStructureAnalyst(hub: EventHub, ctx: any): void {
    hub.subscribe<IndustryStructureAnalystInput>('_R_U_N__INDUSTRY_STRUCTURE_ANALYST', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const prompt = `
Analiza la estructura de industria y escenarios para ${input.projectName} en el sector ${input.sector} y segmento ${input.segment}.
Utiliza tu conocimiento y datos recientes (simulando Google Search) para estructurar:
- Las 5 Fuerzas de Porter
- Scenario Analysis

Requisito de citas: Cada item de evidence[] en 5 forces DEBE tener sourceUrl. Si no tienes URL, no incluyas el evidence.
`;

        const result = await callLLMValidated(
          ctx.llm,
          prompt,
          comboSchema,
          { temperature: 0.2, maxOutputTokens: 8000 }
        );

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__INDUSTRY_STRUCTURE_ANALYST_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result as IndustryStructureAnalystOutput },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__INDUSTRY_STRUCTURE_ANALYST_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
