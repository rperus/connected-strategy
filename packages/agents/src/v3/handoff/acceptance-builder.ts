import type { Priority } from '../state-store.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { LLMProvider } from '../../llm-provider.js';
import type { MoveManifest } from './manifest-builder.js';

export async function buildAcceptanceTests(
  priority: Priority,
  manifest: MoveManifest,
  state: ProjectStateV3,
  ctx: { llm: LLMProvider }
): Promise<string> {
  const prompt = `Genera el archivo acceptance-tests.md para esta priority. Estructura:

# Acceptance Tests — ${manifest.moveId}

## Functional
[lista checklist con criterios observables: "User opens X → sees Y", etc.]

## Code Quality
- [ ] \`pnpm test\` passes
- [ ] \`pnpm build\` clean
- [ ] No new lint errors
- [ ] Coverage para nuevo código ≥80%

## Strategic (validable manualmente o vía métricas)
[refer a worksheets/scores que deben moverse]

Sé específico. Cada checkpoint debe ser verificable sin ambigüedad.
Priority: ${priority.title}
Hint: ${priority.antigravityPromptHint}`;

  for (let i = 0; i < 2; i++) {
    const res = await ctx.llm.generate(prompt);
    const text = res.text;
    if (text.includes('## Functional') && text.includes('## Code Quality') && text.includes('## Strategic')) {
      return text;
    }
  }

  return `# Acceptance Tests — ${manifest.moveId}\n\n## Functional\n- [ ] Implements ${priority.title}\n\n## Code Quality\n- [ ] Passes tests\n\n## Strategic\n- [ ] Improves ${priority.wharton_basis.join(', ')}`;
}
