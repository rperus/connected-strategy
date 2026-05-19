import { z } from 'zod';
import { fiveForcesSchema, scenarioAnalysisSchema } from '@cs/domain';
import type { FiveForcesAnalysis, ScenarioAnalysis } from '@cs/domain';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { callLLMValidated } from '../llm-validated.js';

interface IndustryStructureAnalystInput {
  projectName: string;
  sector: string;
  segment: string;
}

interface IndustryStructureAnalystOutput {
  fiveForces: FiveForcesAnalysis;
  scenarios: ScenarioAnalysis;
}

const comboSchema = z.object({
  fiveForces: fiveForcesSchema,
  scenarios: scenarioAnalysisSchema
});

export async function runIndustryStructureAnalyst(
  input: IndustryStructureAnalystInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<IndustryStructureAnalystOutput>> {
  const start = Date.now();
  try {
    const prompt = `
Analiza la estructura de industria y escenarios para ${input.projectName} en el sector ${input.sector} y segmento ${input.segment}.
Utiliza tu conocimiento y datos recientes (simulando Google Search) para estructurar:
- Las 5 Fuerzas de Porter
- Scenario Analysis

Requisito de citas: Cada item de evidence[] en 5 forces DEBE tener sourceUrl. Si no tienes URL, no incluyas el evidence.
`;

    const result = await callLLMValidated(
      ctx.llm,
      prompt,
      comboSchema,
      { temperature: 0.2, maxOutputTokens: 8000 }
    );

    return {
      success: true,
      data: result as IndustryStructureAnalystOutput,
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
