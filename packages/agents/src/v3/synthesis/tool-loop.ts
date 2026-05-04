import type { AgentV3Context } from '../types.js';
import { executeTool } from './tools.js';

export const toolsSchema = [
  {
    name: 'read_file',
    description: 'Read file content from project. Use when you need to verify a specific implementation detail.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path relative to projectPath' },
        offset: { type: 'number', description: 'Line offset (default 0)' },
        limit: { type: 'number', description: 'Max lines (default 200)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'grep_repo',
    description: 'Search regex pattern across project files',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        glob: { type: 'string', description: 'optional glob filter, e.g. "**/*.ts"' },
        max_results: { type: 'number', description: 'default 30' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'read_worksheet_answer',
    description: 'Get the raw answer for a specific worksheet',
    input_schema: {
      type: 'object',
      properties: {
        worksheetId: { type: 'string' },
        questionId: { type: 'string' },
      },
      required: ['worksheetId'],
    },
  },
  {
    name: 'compare_to_history',
    description: 'Get a specific field from the previous run of this project',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string', description: 'dotpath into prior state, e.g. "synthesis.healthScore.value"' },
      },
      required: ['field'],
    },
  },
];

export async function runToolLoop(
  initialPrompt: string,
  ctx: AgentV3Context & { state: any; priorRunId?: string },
  opts: { maxIterations: number; maxToolCalls: number; onProgress?: (msg: string) => void }
): Promise<{ finalText: string; toolCallCount: number; iterations: number }> {
  
  let history = initialPrompt + `\n\nAVAILABLE TOOLS:\n${JSON.stringify(toolsSchema, null, 2)}\n\n` +
    `INSTRUCTIONS: If you need to use a tool, reply ONLY with a JSON array of tool calls matching:\n` +
    `[{"name": "tool_name", "input": {...}}]\n` +
    `If you have enough information to provide the final Synthesis Audit JSON, reply ONLY with the final JSON. Do not mix tool calls and final JSON.`;

  let toolCallCount = 0;
  for (let iter = 0; iter < opts.maxIterations; iter++) {
    opts.onProgress?.(`Iteration ${iter + 1}`);
    
    // We use the existing llm.generate()
    const response = await ctx.llm.generate(history, { temperature: 0.2, maxTokens: 8192 });
    let text = response.text.trim();
    
    // Handle markdown block parsing
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      text = match[1].trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Not JSON? Probably final text but missing JSON structure or just bad output
      return { finalText: response.text, toolCallCount, iterations: iter + 1 };
    }

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
      // Tool call array
      const toolResults = await Promise.all(
        parsed.map(async (call: any) => {
          if (toolCallCount >= opts.maxToolCalls) {
            return { name: call.name, content: 'ERROR: tool budget exhausted' };
          }
          toolCallCount++;
          const result = await executeTool(call.name, call.input, ctx);
          opts.onProgress?.(`[tool] ${call.name}: ${JSON.stringify(call.input).slice(0, 80)}`);
          return { name: call.name, content: result };
        })
      );
      
      history += `\n\nTOOL RESPONSES:\n${toolResults.map(r => `<tool_result name="${r.name}">${String(r.content).slice(0, 4000)}</tool_result>`).join('\n')}\n\nContinue. Reply with array of tool calls or final JSON.`;
    } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.strategyAuditAnswers) {
      // Looks like final JSON
      return { finalText: JSON.stringify(parsed, null, 2), toolCallCount, iterations: iter + 1 };
    } else {
      // Something else
      return { finalText: response.text, toolCallCount, iterations: iter + 1 };
    }
  }
  throw new Error(`Tool loop exceeded ${opts.maxIterations} iterations`);
}
