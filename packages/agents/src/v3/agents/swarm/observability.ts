import type { DiscoveredFile } from '../../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../../types.js';
import { callLLMValidated } from '../../llm-validated.js';
import { swarmOutputSchema, SWARM_PROMPT_APPENDIX, SwarmOutput } from './schema.js';
import { EventHub } from "../../hub/event-hub.js";

interface ObservabilityInput {
  files: DiscoveredFile[];
}

export function registerObservability(hub: EventHub, ctx: any): void {
    hub.subscribe<ObservabilityInput>('_R_U_N__OBSERVABILITY', async (event) => {
          const input = event.payload;
          const start = Date.now();
      try {
        const relevantFiles = input.files.filter(f => {
          const low = f.path.toLowerCase();
          return low.includes('logger') || low.includes('metric') || low.includes('trace') || low.includes('sentry');
        });
        
        const filesContent = relevantFiles.map(f => `--- ${f.relativePath} ---\n${ctx.fileReader.read(f.relativePath)}`).join('\n\n');

        const prompt = `
Actúa como Observability Expert.
Revisa la instrumentación, logging y traces buscando puntos ciegos.
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
          type: '_R_U_N__OBSERVABILITY_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__OBSERVABILITY_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
