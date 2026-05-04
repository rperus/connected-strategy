import type { DiscoveredFile } from '../../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../../types.js';
import { callLLMValidated } from '../../llm-validated.js';
import { swarmOutputSchema, SWARM_PROMPT_APPENDIX, SwarmOutput } from './schema.js';

export interface ApiDesignCriticInput {
  files: DiscoveredFile[];
}

export async function runApiDesignCritic(
  input: ApiDesignCriticInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<SwarmOutput>> {
  const start = Date.now();
  try {
    const relevantFiles = input.files.filter(f => f.category === 'route');
    const filesContent = relevantFiles.map(f => `--- ${f.relativePath} ---\n${ctx.fileReader.read(f.relativePath)}`).join('\n\n');

    const prompt = `
Actúa como API Design Critic.
Revisa las rutas buscando consistencia REST/GraphQL, manejo de errores y payloads de respuesta.
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
