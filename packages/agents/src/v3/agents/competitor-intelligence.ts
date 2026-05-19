import { z } from 'zod';
import { competitorProfileSchema } from '@cs/domain';
import type { CompetitorProfile } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

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

export async function runCompetitorIntelligence(
  input: CompetitorIntelligenceInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<CompetitorIntelligenceOutput>> {
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
          ctx.store.appendCitation(ctx.projectId, {
            claim: move.description,
            sourceUrl: move.sourceUrl,
            retrievedAt: new Date().toISOString(),
            agent: 'competitor-intelligence'
          });
        }
      }
    }

    return {
      success: true,
      data: out,
      tokensUsed: 0,
      durationMs: Date.now() - start,
      llmCalls: 1,
      filesRead: ctx.fileReader.getReadFilesList()
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      tokensUsed: 0,
      durationMs: Date.now() - start,
      llmCalls: 1,
      filesRead: ctx.fileReader.getReadFilesList()
    };
  }
}
