import { z } from 'zod';
import { ws04Schema, ws06Schema } from '@cs/domain';
import type { WS01_JourneyMap, WS04_WhyHowLadder, WS06_RepeatLearning } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

export interface DeeperNeedsLadderingInput {
  ws01Output: WS01_JourneyMap;
  projectName: string;
}

export interface DeeperNeedsLadderingOutput {
  ws04: WS04_WhyHowLadder;
  ws06: WS06_RepeatLearning;
}

const comboSchema = z.object({
  ws04: ws04Schema,
  ws06: ws06Schema
});

export async function runDeeperNeedsLaddering(
  input: DeeperNeedsLadderingInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<DeeperNeedsLadderingOutput>> {
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

    return {
      success: true,
      data: result as DeeperNeedsLadderingOutput,
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
