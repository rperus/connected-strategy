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

// ─── Anthropic (Claude) ─────────────────────────────────────────────────────
// Messages API over plain fetch (no SDK dependency). Official rules (oct-2026):
//  - never send temperature / top_p / top_k (400), thinking budget or forced tool_choice
//  - output_config { effort: 'low' } by default; max_tokens >= 2048
//  - read only `text` content blocks

export type ClaudeFailureReason =
  | 'no_key' | 'cooldown' | 'credit' | 'auth' | 'not_found' | 'rate_limit'
  | 'server' | 'timeout' | 'network' | 'bad_request' | 'empty';

export type ClaudeAttempt =
  | { ok: true; response: LLMResponse }
  | { ok: false; reason: ClaudeFailureReason; status?: number };

export interface AnthropicProvider extends LLMProvider {
  /** Single attempt, no retries; the caller decides the fallback. */
  tryGenerate(prompt: string, opts?: { maxTokens?: number }): Promise<ClaudeAttempt>;
}

export interface AnthropicDeps {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const COOLDOWN_LONG_MS = 30 * 60 * 1000; // credit / 401 / 403
const COOLDOWN_SHORT_MS = 60 * 1000; // 429 / 5xx / 529 / timeout

/** Extracts and parses JSON from a model reply (fenced, bare, or surrounded by prose). */
function parseJsonLoose(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates: Array<string | undefined> = [fenced?.[1], text];
  const first = text.search(/[{[]/);
  const last = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    if (!c) continue;
    try { return JSON.parse(c.trim()); } catch { /* try next */ }
  }
  throw new Error('no parseable JSON');
}

export function createAnthropicProvider(
  modelName = 'claude-sonnet-5-5',
  cacheStore: LLMCacheStore = fallbackCache,
  deps: AnthropicDeps = {},
): AnthropicProvider {
  const apiKey = deps.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
  const forceOffline = process.env._CS_FORCE_OFFLINE === '1';
  const available = apiKey.length > 0 && !forceOffline;
  const doFetch = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now;
  const timeoutMs = deps.timeoutMs ?? 30000;
  let cooldownUntil = 0;

  const fail = (reason: ClaudeFailureReason, status?: number, cooldownMs = 0): ClaudeAttempt => {
    if (cooldownMs > 0) cooldownUntil = now() + cooldownMs;
    console.warn(`[LLM] Claude unavailable (${reason}${status ? ` HTTP ${status}` : ''}) — falling back.`);
    return { ok: false, reason, status };
  };

  async function tryGenerate(prompt: string, opts?: { maxTokens?: number }): Promise<ClaudeAttempt> {
    if (!available) return { ok: false, reason: 'no_key' };
    if (now() < cooldownUntil) return { ok: false, reason: 'cooldown' };

    const maxTokens = Math.max(opts?.maxTokens ?? 2048, 2048);
    const cacheKey = hashPrompt(`anthropic:${modelName}:${prompt}`, { maxTokens });
    const cached = await cacheStore.get(cacheKey);
    if (cached) return { ok: true, response: cached };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('Timeout')), timeoutMs);
    let res: Response;
    try {
      res = await doFetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelName,
          max_tokens: maxTokens,
          output_config: { effort: 'low' },
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (err: any) {
      const timedOut = controller.signal.aborted || err?.name === 'AbortError';
      return fail(timedOut ? 'timeout' : 'network', undefined, COOLDOWN_SHORT_MS);
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      let bodyText = '';
      try { bodyText = (await res.text()).toLowerCase(); } catch { /* ignore */ }
      const s = res.status;
      if (s === 400 && bodyText.includes('credit balance')) return fail('credit', s, COOLDOWN_LONG_MS);
      if (s === 401 || s === 403) return fail('auth', s, COOLDOWN_LONG_MS);
      if (s === 404) return fail('not_found', s, COOLDOWN_SHORT_MS);
      if (s === 429) return fail('rate_limit', s, COOLDOWN_SHORT_MS);
      if (s >= 500) return fail('server', s, COOLDOWN_SHORT_MS);
      return fail('bad_request', s);
    }

    let data: any;
    try { data = await res.json(); } catch { return fail('server', res.status, COOLDOWN_SHORT_MS); }
    const text = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b?.type === 'text').map((b: any) => String(b.text ?? '')).join('')
      : '';
    if (!text) return fail('empty', res.status);

    const response: LLMResponse = {
      text,
      model: data?.model ?? modelName,
      finishReason: data?.stop_reason ?? 'unknown',
      tokenCount: (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
    };
    await cacheStore.set(cacheKey, response);
    return { ok: true, response };
  }

  return {
    model: modelName,
    available,
    tryGenerate,

    async generate(prompt, opts) {
      const attempt = await tryGenerate(prompt, opts);
      if (attempt.ok) return attempt.response;
      return {
        text: '',
        model: modelName,
        finishReason: attempt.reason === 'no_key' ? 'no_api_key' : 'error_circuit_breaker',
        tokenCount: 0,
      };
    },

    async generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T | null> {
      const attempt = await tryGenerate(`${prompt}\n\nRespond ONLY with valid JSON.\n\nJSON:`, { maxTokens: 4096 });
      if (!attempt.ok) return null;
      try {
        const parsed = schema.safeParse(parseJsonLoose(attempt.response.text));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
  };
}

/**
 * Claude first, Gemini as automatic fallback. Calls that need Gemini grounding
 * (useSearch) go straight to Gemini. Structured calls keep the Zod gate: an
 * unparseable or schema-invalid Claude reply is retried on Gemini.
 */
export function createClaudeFirstProvider(anthropic: AnthropicProvider, gemini: LLMProvider): LLMProvider {
  return {
    get model() { return anthropic.available ? anthropic.model : gemini.model; },
    get available() { return anthropic.available || gemini.available; },

    async generate(prompt, opts) {
      if (opts?.useSearch) return gemini.generate(prompt, opts);
      const attempt = await anthropic.tryGenerate(prompt, { maxTokens: opts?.maxTokens });
      if (attempt.ok) return attempt.response;
      return gemini.generate(prompt, opts);
    },

    async generateStructured<T>(prompt: string, schema: z.ZodType<T>, opts?: { temperature?: number }): Promise<T | null> {
      const attempt = await anthropic.tryGenerate(`${prompt}\n\nRespond ONLY with valid JSON.\n\nJSON:`, { maxTokens: 4096 });
      if (attempt.ok) {
        try {
          const parsed = schema.safeParse(parseJsonLoose(attempt.response.text));
          if (parsed.success) return parsed.data;
          console.warn('[LLM] Claude reply failed Zod validation — falling back to Gemini:', parsed.error.message);
        } catch {
          console.warn('[LLM] Claude reply was not valid JSON — falling back to Gemini.');
        }
      }
      return gemini.generateStructured(prompt, schema, opts);
    },
  };
}

let _singleton: LLMProvider | null = null;
let _singletonOfflineState: string | undefined = undefined;

export function getProvider(cacheStore?: LLMCacheStore): LLMProvider {
  const currentOffline = process.env._CS_FORCE_OFFLINE;
  // If a cache store is passed, we explicitly re-init or init the singleton with it.
  if (!_singleton || _singletonOfflineState !== currentOffline || cacheStore) {
    // Unset CS_LLM_PROVIDER + ANTHROPIC_API_KEY present => claude-first (Gemini fallback).
    const providerType = process.env.CS_LLM_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'claude-first' : 'gemini');
    if (providerType === 'lambda' || providerType === 'openai') {
      _singleton = createOpenAICompatibleProvider(process.env.CS_LLM_MODEL || 'meta-llama/Llama-3.1-70B-Instruct', cacheStore);
    } else if (providerType === 'claude-first') {
      _singleton = createClaudeFirstProvider(
        createAnthropicProvider(process.env.CS_CLAUDE_MODEL || 'claude-sonnet-5-5', cacheStore),
        createGeminiProvider(process.env.CS_LLM_MODEL || 'gemini-2.5-flash', cacheStore),
      );
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
