import { z } from 'zod';

export const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  severityRubric: z.string(),     // ← LLM debe justificar por qué este severity
  category: z.string(),
  title: z.string().max(120),
  description: z.string(),
  file: z.string().optional(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  evidence: z.string(),
  remediation: z.string(),
  whartonImpact: z.object({
    raisesWtp: z.boolean(),
    reducesCost: z.boolean(),
    affectsSwitchingCost: z.enum(['raises', 'lowers', 'neutral']),
    threatensSustainability: z.boolean(),
  }),
  estimatedEffort: z.enum(['hours', 'days', 'weeks']),
});

export const swarmOutputSchema = z.object({
  findings: z.array(findingSchema)
});

export type SwarmFinding = z.infer<typeof findingSchema>;
export type SwarmOutput = z.infer<typeof swarmOutputSchema>;

export const SWARM_PROMPT_APPENDIX = `
Usa estas rúbricas estrictas para el severity:
- critical: explotable/visible al usuario en <1 día con tooling público; pérdida de datos posible
- high: incidentes recurrentes esperados en <1 mes; requiere mitigación urgente
- medium: degradación medible pero sostenible; planificar en próximo sprint
- low: mejora de calidad, no urgente

Justifica el severity en severityRubric (1-2 oraciones).
`;
