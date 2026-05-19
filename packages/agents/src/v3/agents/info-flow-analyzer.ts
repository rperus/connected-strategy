import { ws03Schema } from '@cs/domain';
import type { WS01_JourneyMap, WS03_InfoFlow } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

interface InfoFlowAnalyzerInput {
  ws01Output: WS01_JourneyMap;
}

interface InfoFlowAnalyzerOutput {
  ws03: WS03_InfoFlow;
}

export async function runInfoFlowAnalyzer(
  input: InfoFlowAnalyzerInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<InfoFlowAnalyzerOutput>> {
  const start = Date.now();
  try {
    const prompt = `
Para cada stage del WS01 ya mapeado, identifica los 6 atributos del flujo de información: 
description, trigger, frequency, richness, customerEffort, inferenceParty, improvementIdea.

WS01 Data:
${JSON.stringify(input.ws01Output, null, 2)}
`;

    const result = await callLLMValidated(
      ctx.llm,
      prompt,
      ws03Schema,
      { temperature: 0.2, maxOutputTokens: 8000 }
    );

    return {
      success: true,
      data: { ws03: result as WS03_InfoFlow },
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
