import type { DiscoveredFile } from '../../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../../types.js';
import { callLLMValidated } from '../../llm-validated.js';
import { swarmOutputSchema, SWARM_PROMPT_APPENDIX, SwarmOutput } from './schema.js';

export interface MlReadinessInput {
  files: DiscoveredFile[];
}

export async function runMlReadiness(
  input: MlReadinessInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<SwarmOutput>> {
  const start = Date.now();
  try {
    const relevantFiles = input.files.filter(f => {
      const low = f.path.toLowerCase();
      return low.includes('model') || low.includes('embedding') || low.includes('transformer') || low.endsWith('.pkl') || low.endsWith('.onnx');
    });
    
    // Only read source files, avoid binary pickles or onnx
    const filesContent = relevantFiles
      .filter(f => f.language !== 'other')
      .map(f => `--- ${f.relativePath} ---\n${ctx.fileReader.read(f.relativePath)}`)
      .join('\n\n');

    const prompt = `
Actúa como ML Readiness Expert.
Revisa la preparación para ML o los modelos existentes buscando problemas en el ciclo de vida de los datos, versiones de modelos o pipelines.
${SWARM_PROMPT_APPENDIX}

Archivos:
${filesContent}
`;

    const result = await callLLMValidated(ctx.llm, prompt, swarmOutputSchema, { temperature: 0.2, maxOutputTokens: 8000 });

    return {
      success: true,
      data: result,
      tokensUsed: 0,
      durationMs: Date.now() - start,
      llmCalls: 1,
      filesRead: ctx.fileReader.getReadFilesList()
    };
  } catch (err: any) {
    return { success: false, error: err.message, tokensUsed: 0, durationMs: Date.now() - start, llmCalls: 1, filesRead: ctx.fileReader.getReadFilesList() };
  }
}
