import { discoverProjectFiles } from '../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../types.js';

interface CodeCartographerInput {
  projectPath: string;
}

interface CodeCartographerOutput {
  fileDiscovery: any;
  gitStats: any;
  dependencyGraph: any;
  monorepoStructure: any;
}

export async function runCodeCartographer(
  input: CodeCartographerInput,
  ctx: AgentV3Context
): Promise<AgentV3Result<CodeCartographerOutput>> {
  const start = Date.now();
  try {
    const fileDiscovery = await discoverProjectFiles(input.projectPath);

    return {
      success: true,
      data: {
        fileDiscovery,
        gitStats: {},
        dependencyGraph: fileDiscovery.packageJson?.dependencies || {},
        monorepoStructure: { hasMonorepo: fileDiscovery.hasMonorepo }
      },
      tokensUsed: 0,
      durationMs: Date.now() - start,
      llmCalls: 0,
      filesRead: []
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      tokensUsed: 0,
      durationMs: Date.now() - start,
      llmCalls: 0,
      filesRead: []
    };
  }
}
