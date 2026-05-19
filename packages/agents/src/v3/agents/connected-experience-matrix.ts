import { z } from 'zod';
import { ws05Schema, ws07Schema, ws08Schema } from '@cs/domain';
import type { WS01_JourneyMap, WS04_WhyHowLadder, WS05_ResponseMatrix, WS07_ExistingMatrix, WS08_NewIdeasMatrix } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

interface ConnectedExperienceMatrixInput {
  ws01Output: WS01_JourneyMap;
  ws04Output: WS04_WhyHowLadder;
  competitorNames: string[];
}

interface ConnectedExperienceMatrixOutput {
  ws05: WS05_ResponseMatrix;
  ws07: WS07_ExistingMatrix;
  ws08: WS08_NewIdeasMatrix;
}

const comboSchema = z.object({
  ws05: ws05Schema,
  ws07: ws07Schema,
  ws08: ws08Schema
});

export async function runConnectedExperienceMatrix(
  input: ConnectedExperienceMatrixInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<ConnectedExperienceMatrixOutput>> {
  const start = Date.now();
  try {
    const prompt = `
Genera las matrices de Experiencia Conectada (WS05, WS07, WS08) basadas en:
Competitors: ${input.competitorNames.join(', ')}
WS01: ${JSON.stringify(input.ws01Output, null, 2)}
WS04: ${JSON.stringify(input.ws04Output, null, 2)}

Crítico: Las 5 architectures × 4 modes = 20 cells.
Para WS07 marca isWhitespace: true cuando NI el proyecto NI competidores tengan actividad ahí.
Para WS08, prioriza ideas EN cells whitespace (oportunidades inexploradas).
`;

    const result = await callLLMValidated(
      ctx.llm,
      prompt,
      comboSchema,
      { temperature: 0.4, maxOutputTokens: 16000 }
    );

    return {
      success: true,
      data: result as ConnectedExperienceMatrixOutput,
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
