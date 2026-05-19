import { z } from 'zod';
import { activitySystemMapSchema } from '@cs/domain';
import type { WS01_JourneyMap, WS07_ExistingMatrix, WS08_NewIdeasMatrix, ActivitySystemMap } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

interface ActivitySystemMapperInput {
  ws01Output: WS01_JourneyMap;
  ws07Output: WS07_ExistingMatrix;
  ws08Output: WS08_NewIdeasMatrix;
}

function computeImitability(map: ActivitySystemMap): number {
  const n = map.coreChoices.length + map.supportingActivities.length;
  if (n <= 1) return 0;
  let conn = 0;
  for (const [_, refs] of Object.entries(map.reinforcementMatrix)) {
    conn += refs.length;
  }
  const density = conn / (n * (n - 1));
  const spRatio = Object.values(map.oeVsSp).filter(v => v === 'SP').length / n;
  return Math.min(1, density * 0.6 + spRatio * 0.4);
}

export async function runActivitySystemMapper(
  input: ActivitySystemMapperInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<ActivitySystemMap>> {
  const start = Date.now();
  try {
    const prompt = `
Genera el Activity System Map.
WS01: ${JSON.stringify(input.ws01Output)}
WS07: ${JSON.stringify(input.ws07Output)}
WS08: ${JSON.stringify(input.ws08Output)}

Incluye un diagrama de mermaid representativo en el campo mermaid.
Para imitabilityScore, pon 0, será recalculado luego.
`;

    const result = await callLLMValidated(
      ctx.llm,
      prompt,
      activitySystemMapSchema,
      { temperature: 0.3, maxOutputTokens: 10000 }
    );

    const map = result as ActivitySystemMap;
    map.imitabilityScore = computeImitability(map);

    return {
      success: true,
      data: map,
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
