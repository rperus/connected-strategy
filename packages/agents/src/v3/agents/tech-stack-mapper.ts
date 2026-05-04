import { z } from 'zod';
import { ws09Schema, ws10Schema, ws11Schema } from '@cs/domain';
import type { WS09_SubfunctionGrid, WS10_TechSolutions, WS11_EmergingTech } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';
import type { DiscoveredFile } from '../code-discovery.js';

export interface TechStackMapperInput {
  packageJson: any;
  fileDiscovery: { byCategory: Record<string, DiscoveredFile[]> };
}

export interface TechStackMapperOutput {
  ws09: WS09_SubfunctionGrid;
  ws10: WS10_TechSolutions;
  ws11: WS11_EmergingTech;
}

const comboSchema = z.object({
  ws09: ws09Schema,
  ws10: ws10Schema,
  ws11: ws11Schema
});

export async function runTechStackMapper(
  input: TechStackMapperInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<TechStackMapperOutput>> {
  const start = Date.now();
  try {
    const prompt = `
Analiza la tecnología subyacente para construir WS09, WS10, y WS11.
Package JSON: ${JSON.stringify(input.packageJson)}
Categorías: ${Object.keys(input.fileDiscovery.byCategory).join(', ')}

Los 4 STAR × 9 sub-functions = 36 cells. 
WS09 describe qué hace cada cell hoy. 
WS10 lista la tech actual + scores ++/+/-/-- (convenience/safety/cost).
WS11 sugiere emerging tech (con readiness level NASA TRL 1-9).
`;

    const result = await callLLMValidated(
      ctx.llm,
      prompt,
      comboSchema,
      { temperature: 0.2, maxOutputTokens: 12000 }
    );

    return {
      success: true,
      data: result as TechStackMapperOutput,
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
