import { z } from 'zod';
import type { WS07_ExistingMatrix, WS08_NewIdeasMatrix } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import type { RevenueModelArchitectOutput } from '../state-types.js';

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

export async function runRevenueModelArchitect(
  input: RevenueModelArchitectInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<RevenueModelArchitectOutput>> {
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

    return {
      success: true,
      data: result as RevenueModelArchitectOutput,
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
