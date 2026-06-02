import type { DiscoveredFile } from '../../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../../types.js';
import { callLLMValidated } from '../../llm-validated.js';
import { swarmOutputSchema, SWARM_PROMPT_APPENDIX, SwarmOutput } from './schema.js';
import { EventHub } from "../../hub/event-hub.js";

interface PerformanceEngineerInput {
  files: DiscoveredFile[];
}

export function registerPerformanceEngineer(hub: EventHub, ctx: any): void {
    hub.subscribe<PerformanceEngineerInput>('_R_U_N__PERFORMANCE_ENGINEER', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const relevantFiles = input.files.filter(f => f.category === 'service' || f.category === 'controller');
        const filesContent = relevantFiles.map(f => `--- ${f.relativePath} ---\n${ctx.fileReader.read(f.relativePath)}`).join('\n\n');

        const prompt = `
Actúa como Performance Engineer.
Revisa los servicios y controladores buscando cuellos de botella (ej: N+1 queries, bloqueos sincrónicos).
${SWARM_PROMPT_APPENDIX}

Archivos:
${filesContent}
`;

        const result = await callLLMValidated(ctx.llm, prompt, swarmOutputSchema, { temperature: 0.2, maxOutputTokens: 8000 });

        if (ctx.sharedFindings && result.findings) {
          result.findings.forEach(f => ctx.sharedFindings!.publish(f));
        }

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__PERFORMANCE_ENGINEER_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__PERFORMANCE_ENGINEER_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
