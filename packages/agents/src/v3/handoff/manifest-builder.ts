import { z } from 'zod';
import type { Priority } from '../state-store.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { LLMProvider } from '../../llm-provider.js';
import type { FileReader } from '../file-reader.js';
import { manifestSchema } from '@cs/domain';

export type MoveManifest = z.infer<typeof manifestSchema>;

export async function buildManifest(
  priority: Priority,
  state: ProjectStateV3,
  ctx: { llm: LLMProvider; fileReader: FileReader }
): Promise<MoveManifest> {
  const prompt = `Eres un ingeniero senior planificando UN cambio concreto al proyecto ${state.projectName}.

Priority a implementar:
- Title: ${priority.title}
- Summary: ${priority.summary}
- Wharton basis: ${priority.wharton_basis.join(', ')}
- Hint: ${priority.antigravityPromptHint}

Tu tarea: produce un manifest.json que liste EXACTAMENTE qué archivos crear, editar o borrar.
Incluye:
- Para files_to_edit, especifica lines cuando sea posible (ej: "120-145")
- Para files_to_create, especifica purpose en una oración
- dependencies_to_add con versiones específicas (ej: "date-fns@^3.0")
- estimated_loc y estimated_hours realistas

NO incluyas archivos que no existen sin marcarlos como files_to_create.
NO inventes paths.
Responde con JSON puro matching MoveManifestSchema.`;

  const parsed = await ctx.llm.generateStructured(prompt, manifestSchema);

  if (parsed) {
    return parsed;
  }

  // fallback
  return {
    moveId: priority.priorityId || 'move-1',
    title: priority.title,
    wharton_basis: priority.wharton_basis,
    frontier_impact: { wtp_delta: 0.1, cost_delta: 0.1 },
    files_to_create: [],
    files_to_edit: [],
    files_to_delete: [],
    dependencies_to_add: [],
    dependencies_to_remove: [],
    estimated_loc: 100,
    estimated_hours: 4,
    references: { worksheets: [], findings: [] }
  };
}
