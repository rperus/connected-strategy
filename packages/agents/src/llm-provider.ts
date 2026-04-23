/**
 * @cs/agents — Gemini LLM Provider
 *
 * Opt-in enrichment for agents. Agents are deterministic by default.
 * This provider wraps @google/generative-ai for structured responses.
 *
 * Usage in any agent:
 *   const llm = createGeminiProvider(); // reads GEMINI_API_KEY from env
 *   const enriched = await llm.generate('Analyze this code for risks', { temperature: 0.3 });
 */

interface LLMResponse {
  text: string;
  tokenCount?: number;
  model: string;
  finishReason: string;
}

export interface LLMProvider {
  readonly model: string;
  readonly available: boolean;
  generate(prompt: string, opts?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse>;
  generateStructured<T>(prompt: string, schema: string, opts?: { temperature?: number }): Promise<T | null>;
}

/**
 * Creates a Gemini LLM provider.
 * Returns a provider that gracefully degrades if GEMINI_API_KEY is not set.
 */
export function createGeminiProvider(modelName = 'gemini-2.5-flash'): LLMProvider {
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const available = apiKey.length > 0;

  if (!available) {
    console.warn('[LLM] GEMINI_API_KEY not set — LLM enrichment disabled. Agents will run in deterministic-only mode.');
  }

  return {
    model: modelName,
    available,

    async generate(prompt, opts) {
      if (!available) {
        return { text: '', model: modelName, finishReason: 'no_api_key', tokenCount: 0 };
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: opts?.temperature ?? 0.4,
          maxOutputTokens: opts?.maxTokens ?? 2048,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        text,
        model: modelName,
        finishReason: response.candidates?.[0]?.finishReason ?? 'unknown',
        tokenCount: response.usageMetadata?.totalTokenCount,
      };
    },

    async generateStructured<T>(prompt: string, schema: string, opts?: { temperature?: number }): Promise<T | null> {
      const fullPrompt = `${prompt}\n\nRespond ONLY with valid JSON matching this schema:\n${schema}\n\nJSON:`;
      const response = await this.generate(fullPrompt, { temperature: opts?.temperature ?? 0.2, maxTokens: 4096 });

      if (!response.text) return null;

      try {
        // Extract JSON from response (handles markdown code blocks)
        const jsonMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, response.text];
        return JSON.parse(jsonMatch[1]!.trim()) as T;
      } catch {
        console.warn('[LLM] Failed to parse structured response:', response.text.substring(0, 200));
        return null;
      }
    },
  };
}

/**
 * Singleton provider instance for the entire server process.
 * Import this in agents that want LLM enrichment.
 */
let _singleton: LLMProvider | null = null;

export function getGeminiProvider(): LLMProvider {
  if (!_singleton) {
    _singleton = createGeminiProvider();
  }
  return _singleton;
}
