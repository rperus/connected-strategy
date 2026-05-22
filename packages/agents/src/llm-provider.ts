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
  generate(prompt: string, opts?: { temperature?: number; maxTokens?: number; useSearch?: boolean }): Promise<LLMResponse>;
  generateStructured<T>(prompt: string, schema: string, opts?: { temperature?: number }): Promise<T | null>;
}

/**
 * Creates a Gemini LLM provider.
 * Returns a provider that gracefully degrades if GEMINI_API_KEY is not set.
 */
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

const llmCache = new LRUCache<string, LLMResponse>({
  max: 500, // Maximum number of prompts to cache
  ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
});

function hashPrompt(prompt: string, opts?: { temperature?: number; maxTokens?: number }): string {
  const data = JSON.stringify({ prompt, opts });
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function createGeminiProvider(modelName = 'gemini-2.5-flash'): LLMProvider {
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const forceOffline = process.env._CS_FORCE_OFFLINE === '1';
  const available = apiKey.length > 0 && !forceOffline;

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

      const cacheKey = hashPrompt(prompt, opts);
      const cached = llmCache.get(cacheKey);
      if (cached) {
        console.log('[LLM Cache] ⚡️ Cache hit for prompt hash:', cacheKey.substring(0, 8));
        return cached;
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const tools = opts?.useSearch ? [{ googleSearch: {} } as any] : undefined;
      const model = genAI.getGenerativeModel({
        model: modelName,
        tools,
        generationConfig: {
          temperature: opts?.temperature ?? 0.4,
          maxOutputTokens: opts?.maxTokens ?? 2048,
        },
      });

      let text = '';
      let finishReason = 'unknown';
      let tokenCount = 0;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        text = response.text();
        finishReason = response.candidates?.[0]?.finishReason ?? 'unknown';
        tokenCount = response.usageMetadata?.totalTokenCount ?? 0;
      } catch (err: any) {
        console.error(`[LLM CircuitBreaker] Error from Gemini API: ${err.message || String(err)}. Falling back to safe defaults.`);
        finishReason = 'error_circuit_breaker';
      }

      const out = {
        text,
        model: modelName,
        finishReason,
        tokenCount,
      };

      if (text) {
        llmCache.set(cacheKey, out);
      }
      return out;
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
let _singletonOfflineState: string | undefined = undefined;

export function getGeminiProvider(): LLMProvider {
  const currentOffline = process.env._CS_FORCE_OFFLINE;
  if (!_singleton || _singletonOfflineState !== currentOffline) {
    _singleton = createGeminiProvider();
    _singletonOfflineState = currentOffline;
  }
  return _singleton;
}
