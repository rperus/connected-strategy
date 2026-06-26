import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import type { z } from 'zod';

/**
 * @cs/agents — LLM Provider
 * 
 * Provides connectivity to Gemini and OpenAI-compatible endpoints with:
 * - Aggressive caching (in-memory fallback, overridable with SQLite)
 * - Graceful degradation, timeouts, and automatic retries (Tier 2 rule)
 * - Strict Zod validation on structured output
 */

export interface LLMResponse {
  text: string;
  tokenCount?: number;
  model: string;
  finishReason: string;
}

export interface LLMCacheStore {
  get(key: string): LLMResponse | undefined | Promise<LLMResponse | undefined>;
  set(key: string, value: LLMResponse): void | Promise<void>;
}

export interface LLMProvider {
  readonly model: string;
  readonly available: boolean;
  generate(prompt: string, opts?: { temperature?: number; maxTokens?: number; useSearch?: boolean }): Promise<LLMResponse>;
  generateStructured<T>(prompt: string, schema: z.ZodType<T>, opts?: { temperature?: number }): Promise<T | null>;
}

const _lru = new LRUCache<string, LLMResponse>({
  max: 500, // Maximum number of prompts to cache
  ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
});

const fallbackCache: LLMCacheStore = {
  get: (key: string) => _lru.get(key),
  set: (key: string, value: LLMResponse) => { _lru.set(key, value); }
};

function hashPrompt(prompt: string, opts?: { temperature?: number; maxTokens?: number }): string {
  const data = JSON.stringify({ prompt, opts });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Utility: fetch with retry and backoff */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`[LLM] Error (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${baseDelay * attempt}ms...`);
      await new Promise((r) => setTimeout(r, baseDelay * attempt));
    }
  }
  throw new Error('Unreachable');
}

export function createGeminiProvider(modelName = 'gemini-2.5-flash', cacheStore: LLMCacheStore = fallbackCache): LLMProvider {
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
      const cached = await cacheStore.get(cacheKey);
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
        const result = await withRetry(async () => {
          // Manual timeout wrapper
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), 30000);
          
          try {
            return await model.generateContent(prompt);
          } finally {
            clearTimeout(timeoutId);
          }
        }, 3, 2000);
        
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

      if (text && finishReason !== 'error_circuit_breaker') {
        await cacheStore.set(cacheKey, out);
      }
      return out;
    },

    async generateStructured<T>(prompt: string, schema: z.ZodType<T>, opts?: { temperature?: number }): Promise<T | null> {
      const fullPrompt = `${prompt}\n\nRespond ONLY with valid JSON.\n\nJSON:`;
      const response = await this.generate(fullPrompt, { temperature: opts?.temperature ?? 0.2, maxTokens: 4096 });

      if (!response.text || response.finishReason === 'error_circuit_breaker') return null;

      try {
        const jsonMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, response.text];
        const rawJson = JSON.parse(jsonMatch[1]!.trim());
        const parsed = schema.safeParse(rawJson);
        if (parsed.success) {
          return parsed.data;
        } else {
          console.warn('[LLM] Zod validation failed:', parsed.error.message);
          return null; // Graceful degradation
        }
      } catch (err) {
        console.warn('[LLM] Failed to parse structured response:', response.text.substring(0, 200));
        return null;
      }
    },
  };
}

export function createOpenAICompatibleProvider(modelName = 'meta-llama/Llama-3.1-70B-Instruct', cacheStore: LLMCacheStore = fallbackCache): LLMProvider {
  const apiKey = process.env.LAMBDA_AI_API_KEY || process.env.OPENAI_API_KEY || '';
  const endpoint = process.env.LAMBDA_AI_ENDPOINT || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const forceOffline = process.env._CS_FORCE_OFFLINE === '1';
  const available = apiKey.length > 0 && !forceOffline;

  if (!available) {
    console.warn('[LLM] LAMBDA_AI_API_KEY not set — OpenAI provider disabled.');
  }

  return {
    model: modelName,
    available,

    async generate(prompt, opts) {
      if (!available) {
        return { text: '', model: modelName, finishReason: 'no_api_key', tokenCount: 0 };
      }

      const cacheKey = hashPrompt(prompt, opts);
      const cached = await cacheStore.get(cacheKey);
      if (cached) {
        console.log('[LLM Cache] ⚡️ Cache hit for OpenAI prompt hash:', cacheKey.substring(0, 8));
        return cached;
      }

      let text = '';
      let finishReason = 'unknown';
      let tokenCount = 0;

      try {
        const data = await withRetry(async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), 30000);
          
          try {
            const res = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature: opts?.temperature ?? 0.4,
                max_tokens: opts?.maxTokens ?? 2048,
              }),
            });
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }
            return await res.json() as any;
          } finally {
            clearTimeout(timeoutId);
          }
        }, 3, 2000);

        text = data.choices?.[0]?.message?.content || '';
        finishReason = data.choices?.[0]?.finish_reason || 'stop';
        tokenCount = data.usage?.total_tokens || 0;
      } catch (err: any) {
        console.error(`[LLM CircuitBreaker] Error from OpenAI-compatible API: ${err.message || String(err)}`);
        finishReason = 'error_circuit_breaker';
      }

      const out = {
        text,
        model: modelName,
        finishReason,
        tokenCount,
      };

      if (text && finishReason !== 'error_circuit_breaker') {
        await cacheStore.set(cacheKey, out);
      }
      return out;
    },

    async generateStructured<T>(prompt: string, schema: z.ZodType<T>, opts?: { temperature?: number }): Promise<T | null> {
      const fullPrompt = `${prompt}\n\nRespond ONLY with valid JSON.\n\nJSON:`;
      const response = await this.generate(fullPrompt, { temperature: opts?.temperature ?? 0.2, maxTokens: 4096 });

      if (!response.text || response.finishReason === 'error_circuit_breaker') return null;

      try {
        const jsonMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, response.text];
        const rawJson = JSON.parse(jsonMatch[1]!.trim());
        const parsed = schema.safeParse(rawJson);
        if (parsed.success) {
          return parsed.data;
        } else {
          console.warn('[LLM] Zod validation failed:', parsed.error.message);
          return null;
        }
      } catch {
        console.warn('[LLM] Failed to parse structured response:', response.text.substring(0, 200));
        return null;
      }
    },
  };
}

let _singleton: LLMProvider | null = null;
let _singletonOfflineState: string | undefined = undefined;

export function getProvider(cacheStore?: LLMCacheStore): LLMProvider {
  const currentOffline = process.env._CS_FORCE_OFFLINE;
  // If a cache store is passed, we explicitly re-init or init the singleton with it.
  if (!_singleton || _singletonOfflineState !== currentOffline || cacheStore) {
    const providerType = process.env.CS_LLM_PROVIDER || 'gemini';
    if (providerType === 'lambda' || providerType === 'openai') {
      _singleton = createOpenAICompatibleProvider(process.env.CS_LLM_MODEL || 'meta-llama/Llama-3.1-70B-Instruct', cacheStore);
    } else {
      _singleton = createGeminiProvider(process.env.CS_LLM_MODEL || 'gemini-2.5-flash', cacheStore);
    }
    _singletonOfflineState = currentOffline;
  }
  return _singleton;
}

/** Legacy alias for backward compatibility */
export function getGeminiProvider(): LLMProvider {
  return getProvider();
}
