/**
 * @cs/agents — synthetic-consultant.ts
 *
 * RAG-powered synthetic consultant that retrieves relevant Wharton curriculum
 * context from the knowledge base to answer worksheet questions.
 *
 * Uses real FTS5 vector search instead of mock data.
 * Falls back to LLM-only mode if no relevant context is found.
 */

import type { AgentResult } from '../types.js';
import { vectorSearch } from '../rag/vectorStore.js';
import { EventHub } from '../v3/hub/event-hub.js';

interface ConsultantAnswer {
  value: string;
  confidence: number;
  sources: Array<{ sourceId: string; sourceTitle?: string; excerpt: string }>;
}

export function registerWorksheetSynthesizer(hub: EventHub, ctx: any): void {
  hub.subscribe<{ worksheetId: string; questions: string[] }>('RUN_WORKSHEET_SYNTHESIZER', async (event) => {
    const inputs = event.payload;
    const start = Date.now();
    ctx.log(`Starting SyntheticConsultant for worksheet: ${inputs.worksheetId}`);

    const answers: Record<string, ConsultantAnswer> = {};

    try {
      for (const question of inputs.questions) {
        // Retrieve relevant context from the knowledge base
        const evidence = await vectorSearch(question, 5, inputs.worksheetId);
        const hasContext = evidence.chunks.length > 0 && evidence.chunks[0].text !== 'Mock retrieved context based on query.';

        const contextText = hasContext
          ? evidence.chunks
              .map((c, i) => `[${i + 1}] (${c.metadata?.sourceTitle || c.metadata?.sourceId || 'unknown'}): ${c.text}`)
              .join('\n\n')
          : '';

        const sources = hasContext
          ? evidence.chunks.map((c) => ({
              sourceId: c.metadata?.sourceId || 'unknown',
              sourceTitle: c.metadata?.sourceTitle,
              excerpt: c.text.substring(0, 200),
            }))
          : [];

        const prompt = `
Eres un consultor sintético de Wharton, experto en Connected Strategy (Siggelkow & Terwiesch).
${hasContext ? `\nContexto recuperado de la base de conocimiento:\n${contextText}\n` : '\nNo se encontró contexto específico en la base de conocimiento. Responde basándote en tu conocimiento general del framework Connected Strategy.\n'}
Pregunta a responder para el worksheet "${inputs.worksheetId}":
${question}

Responde de forma concisa, estructurada y en español. Si el contexto recuperado contiene información relevante, cítalo.
Si no hay evidencia suficiente en el contexto para una respuesta completa, indica "requires_human_verification" al final.
`;

        if (ctx.llm) {
          const response = await ctx.llm.generate(prompt);
          const needsVerification = response.text.includes('requires_human_verification');

          answers[question] = {
            value: response.text,
            confidence: needsVerification ? 0.3 : hasContext ? 0.85 : 0.6,
            sources,
          };
        } else {
          answers[question] = {
            value: 'Mock answer — LLM not available',
            confidence: 0.0,
            sources: [],
          };
        }
      }

      await hub.publish({
        domain: 'lifecycle',
        type: 'WORKSHEET_SYNTHESIZER_COMPLETED',
        projectId: event.projectId,
        payload: { success: true, data: answers, durationMs: Date.now() - start },
        timestamp: Date.now()
      });
    } catch (e: any) {
      ctx.log(`SyntheticConsultant failed: ${e.message}`);
      await hub.publish({
        domain: 'lifecycle',
        type: 'WORKSHEET_SYNTHESIZER_FAILED',
        projectId: event.projectId,
        payload: { success: false, error: e.message, durationMs: Date.now() - start },
        timestamp: Date.now()
      });
    }
  });
}
