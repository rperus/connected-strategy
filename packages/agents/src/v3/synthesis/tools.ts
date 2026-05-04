import type { AgentV3Context } from '../types.js';

export async function executeTool(
  toolName: string,
  toolInput: any,
  ctx: AgentV3Context & { state: any; priorRunId?: string }
): Promise<string> {
  switch (toolName) {
    case 'read_file':
      return await ctx.fileReader.read(toolInput.path, toolInput.offset, toolInput.limit);
    case 'grep_repo':
      return await ctx.fileReader.grep(toolInput.pattern, toolInput.glob, toolInput.max_results ?? 30);
    case 'read_worksheet_answer': {
      const state = ctx.state;
      const ws = state.wharton?.[toolInput.worksheetId as keyof typeof state.wharton];
      return ws ? JSON.stringify(ws) : `Worksheet ${toolInput.worksheetId} not found.`;
    }
    case 'compare_to_history': {
      if (!ctx.priorRunId) return 'No prior run available for comparison.';
      const prev = ctx.store.loadSnapshot(ctx.projectId, ctx.priorRunId);
      if (!prev) return 'Failed to load prior run snapshot.';
      const pathParts = toolInput.field.split('.');
      let current: any = prev;
      for (const p of pathParts) {
        if (current === undefined || current === null) break;
        current = current[p];
      }
      return JSON.stringify(current);
    }
    default:
      return `ERROR: unknown tool ${toolName}`;
  }
}
