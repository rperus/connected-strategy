import { ws01Schema } from '@cs/domain';
import type { WS01_JourneyMap } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import { EventHub } from "../hub/event-hub.js";

interface CustomerJourneyMapperInput {
  projectName: string;
  customerSegment: string;
  useCase: string;
  competitorNames: string[];
}

interface CustomerJourneyMapperOutput {
  ws01: WS01_JourneyMap;
}

export function registerCustomerJourneyMapper(hub: EventHub, ctx: any): void {
    hub.subscribe<CustomerJourneyMapperInput>('_R_U_N__CUSTOMER_JOURNEY_MAPPER', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const prompt = `
Eres un consultor estratégico Wharton experto en Connected Strategy.
Vas a mapear el customer journey del proyecto "${input.projectName}" para el segmento
"${input.customerSegment}" en el use case "${input.useCase}".

Las 8 stages SON, en orden:
1. latent_need (necesidad latente)
2. awareness (conciencia de la necesidad)
3. search (búsqueda de opciones)
4. decide (decisión)
5. order_pay (orden y pago)
6. receive (recepción)
7. experience (uso/experiencia)
8. post_purchase (post-compra)

Para CADA stage, debes producir:
- underlyingNeed (la necesidad subyacente)
- customerActions[] (qué hace el customer)
- decisionFactors[] (qué pesa en su decisión)
- touchpoints[] (qué interfaces tocan al producto/servicio)
- painPoints[] ← LO MÁS IMPORTANTE: los dolores actuales
- wtpDrivers[] ← los drivers de willingness-to-pay, con score relativo a competidores

Para WTP scoring usa la escala Wharton: ++/+/0/-/-- vs cada competidor: ${input.competitorNames.join(', ')}.
Sé honesto: si el proyecto es peor que un competidor en algo, dilo.

El projecto está en: ${ctx.projectPath}
`;

        const result = await callLLMValidated(
          ctx.llm,
          prompt,
          ws01Schema,
          { temperature: 0.3, maxOutputTokens: 12000 }
        );

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__CUSTOMER_JOURNEY_MAPPER_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: { ws01: result as WS01_JourneyMap } },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__CUSTOMER_JOURNEY_MAPPER_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
