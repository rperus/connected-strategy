import { z } from 'zod';
import { competitorProfileSchema } from '@cs/domain';
import type { CompetitorProfile } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

import { EventHub } from '../hub/event-hub.js';

interface CompetitorIntelligenceInput {
  projectName: string;
  sector: string;
  projectDescription: string;
  knownCompetitors?: string[];
}

interface CompetitorIntelligenceOutput {
  competitors: CompetitorProfile[];
}

const outSchema = z.object({
  competitors: z.array(competitorProfileSchema)
});

export function registerCompetitorIntelligence(hub: EventHub, ctx: AgentV3Context): void {
  hub.subscribe<CompetitorIntelligenceInput>('RUN_COMPETITIVE_ANALYSIS', async (event) => {
    const input = event.payload;
    const start = Date.now();
  try {
    const prompt = `
Identifica perfiles de competidores para el proyecto ${input.projectName} (${input.projectDescription}) en el sector ${input.sector}.
Competidores conocidos: ${input.knownCompetitors?.join(', ') ?? 'Ninguno provisto'}

Reglas:
- Mínimo 3 competidores, máximo 7.
- Cada recentMoves[] requiere sourceUrl + date. Si no hay fuente, descarta ese move.
`;

    const result = await callLLMValidated(
      ctx.llm,
      prompt,
      outSchema,
      { temperature: 0.2, maxOutputTokens: 8000 }
    );

    const out = result as CompetitorIntelligenceOutput;

    // Append citations
    for (const comp of out.competitors) {
      for (const move of comp.recentMoves) {
        if (move.sourceUrl) {
          hub.appendCitation(event.projectId, {
            claim: move.description,
            sourceUrl: move.sourceUrl,
            retrievedAt: new Date().toISOString(),
            agent: 'competitor-intelligence'
          });
        }
      }
    }

    // Update Blackboard State
    hub.updateState(event.projectId, (state) => {
      if (!state.competitive) state.competitive = {};
      state.competitive.competitors = out.competitors;
    });

    // Publish completion
    await hub.publish({
      domain: 'lifecycle',
      type: 'COMPETITIVE_ANALYSIS_COMPLETED',
      projectId: event.projectId,
      payload: { success: true },
      timestamp: Date.now()
    });

  } catch (err: any) {
    // Publish error
    await hub.publish({
      domain: 'lifecycle',
      type: 'COMPETITIVE_ANALYSIS_FAILED',
      projectId: event.projectId,
      payload: { success: false, error: err.message },
      timestamp: Date.now()
    });
  }
  });
}
