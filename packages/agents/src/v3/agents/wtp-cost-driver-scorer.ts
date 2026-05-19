import { z } from 'zod';
import { driverScoreSchema } from '@cs/domain';
import type { WS01_JourneyMap, DriverScore } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

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

export async function runWtpCostDriverScorer(
  input: WtpCostDriverScorerInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<WtpCostDriverScorerOutput>> {
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

    return {
      success: true,
      data: result as WtpCostDriverScorerOutput,
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
