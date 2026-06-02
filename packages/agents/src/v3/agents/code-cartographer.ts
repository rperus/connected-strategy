import { discoverProjectFiles } from '../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../types.js';
import { EventHub } from "../hub/event-hub.js";

interface CodeCartographerInput {
  projectPath: string;
}

interface CodeCartographerOutput {
  fileDiscovery: any;
  gitStats: any;
  dependencyGraph: any;
  monorepoStructure: any;
}

export function registerCodeCartographer(hub: EventHub, ctx: any): void {
    hub.subscribe<CodeCartographerInput>('_R_U_N__CODE_CARTOGRAPHER', async (event) => {
          const input = event.payload;
          const start = Date.now();
    try {
    const fileDiscovery = await discoverProjectFiles(input.projectPath);

    // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__CODE_CARTOGRAPHER_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: {
        fileDiscovery,
        gitStats: {},
        dependencyGraph: fileDiscovery.packageJson?.dependencies || {},
        monorepoStructure: { hasMonorepo: fileDiscovery.hasMonorepo }
      } },
          timestamp: Date.now()
        });
    } catch (err: any) {
    await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__CODE_CARTOGRAPHER_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
    }
        });
}
