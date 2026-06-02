import type { DiscoveredFile } from '../../code-discovery.js';
import type { AgentV3Context, AgentV3Result } from '../../types.js';
import { callLLMValidated } from '../../llm-validated.js';
import { swarmOutputSchema, SWARM_PROMPT_APPENDIX, SwarmOutput } from './schema.js';
import { EventHub } from "../../hub/event-hub.js";

interface MlReadinessInput {
  files: DiscoveredFile[];
}

export function registerMlReadiness(hub: EventHub, ctx: any): void {
    hub.subscribe<MlReadinessInput>('_R_U_N__ML_READINESS', async (event) => {
          const input = event.payload;
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

        if (ctx.sharedFindings && result.findings) {
          result.findings.forEach(f => ctx.sharedFindings!.publish(f));
        }

        // Update state here if needed
        // hub.updateState(event.projectId, (state) => { /* update logic */ });
        
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__ML_READINESS_COMPLETED',
          projectId: event.projectId,
          payload: { success: true, data: result },
          timestamp: Date.now()
        });
      } catch (err: any) {
        await hub.publish({
          domain: 'lifecycle',
          type: '_R_U_N__ML_READINESS_COMPLETED_FAILED',
          projectId: event.projectId,
          payload: { success: false, error: err.message },
          timestamp: Date.now()
        });
      }
        });
}
