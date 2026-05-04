import type { Priority } from '../state-store.js';
import type { ProjectStateV3 } from '../state-store.js';
import type { LLMProvider } from '../../llm-provider.js';

export async function buildStrategyDoc(
  priority: Priority,
  state: ProjectStateV3,
  ctx: { llm: LLMProvider }
): Promise<string> {
  const prompt = `Genera strategy.md — documento de "por qué este cambio." Audiencia: desarrollador junior.

Estructura sugerida:

# Why This Move — Strategic Rationale

**Wharton anchor:** ${priority.wharton_basis.join(', ')}

[2-3 párrafos explicando]
- Estado actual del proyecto en este eje
- Qué problema/oportunidad ataca
- Por qué este cambio mueve el needle estratégico
- Por qué los competidores no lo han hecho / no pueden copiarlo fácil

**Frontier impact:** WTP +X.X, Cost +Y.Y
**Imitability score:** 0.NN — explicación

Sé concreto, no hand-wavy.
Priority: ${priority.title}
Summary: ${priority.summary}`;

  const res = await ctx.llm.generate(prompt);
  return res.text;
}
