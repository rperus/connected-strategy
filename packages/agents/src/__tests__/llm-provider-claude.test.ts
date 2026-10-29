import { describe, it } from 'node:test';
import { expect } from 'expect';
import { z } from 'zod';
import {
  createAnthropicProvider,
  createClaudeFirstProvider,
  type LLMProvider,
  type LLMResponse,
  type LLMCacheStore,
} from '../llm-provider.js';

const noCache = (): LLMCacheStore => ({ get: () => undefined, set: () => {} });

function okBody(text: string, extra: object[] = []) {
  return {
    model: 'claude-sonnet-5-5',
    stop_reason: 'end_turn',
    content: [{ type: 'thinking', thinking: 'ignored' }, ...extra, { type: 'text', text }],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

function mockFetch(responses: Array<{ status: number; body: unknown } | Error>) {
  const calls: Array<{ url: string; init: RequestInit; json: any }> = [];
  let i = 0;
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init, json: JSON.parse(String(init.body)) });
    const r = responses[Math.min(i++, responses.length - 1)]!;
    if (r instanceof Error) throw r;
    return new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body), { status: r.status });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

function fakeGemini(textOrNull: string, structured: unknown = null) {
  const seen = { generate: 0, structured: 0, lastOpts: undefined as any };
  const provider: LLMProvider = {
    model: 'gemini-fake',
    available: true,
    async generate(_p, opts): Promise<LLMResponse> {
      seen.generate++;
      seen.lastOpts = opts;
      return { text: textOrNull, model: 'gemini-fake', finishReason: 'STOP' };
    },
    async generateStructured() {
      seen.structured++;
      return structured as any;
    },
  };
  return { provider, seen };
}

describe('createAnthropicProvider', () => {
  it('sends only allowed params and reads only text blocks', async () => {
    const { fn, calls } = mockFetch([{ status: 200, body: okBody('hola') }]);
    const p = createAnthropicProvider('claude-sonnet-5-5', noCache(), { apiKey: 'sk-test', fetchImpl: fn });
    const out = await p.generate('hi', { temperature: 0.9, maxTokens: 100 });
    expect(out.text).toBe('hola');
    expect(out.tokenCount).toBe(15);
    const sent = calls[0]!.json;
    expect(calls[0]!.url).toBe('https://api.anthropic.com/v1/messages');
    expect(sent.model).toBe('claude-sonnet-5-5');
    expect(sent.max_tokens).toBe(2048); // floor
    expect(sent.output_config).toEqual({ effort: 'low' });
    for (const banned of ['temperature', 'top_p', 'top_k', 'thinking', 'tool_choice']) {
      expect(banned in sent).toBe(false);
    }
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-test');
  });

  it('keeps a larger max_tokens than the floor', async () => {
    const { fn, calls } = mockFetch([{ status: 200, body: okBody('x') }]);
    const p = createAnthropicProvider('claude-haiku-5-5', noCache(), { apiKey: 'k', fetchImpl: fn });
    await p.generate('hi', { maxTokens: 4096 });
    expect(calls[0]!.json.max_tokens).toBe(4096);
    expect(calls[0]!.json.model).toBe('claude-haiku-5-5');
  });

  it('is unavailable without a key and never calls fetch', async () => {
    const { fn, calls } = mockFetch([{ status: 200, body: okBody('x') }]);
    const p = createAnthropicProvider('claude-sonnet-5-5', noCache(), { apiKey: '', fetchImpl: fn });
    expect(p.available).toBe(false);
    const a = await p.tryGenerate('hi');
    expect(a).toEqual({ ok: false, reason: 'no_key' });
    expect(calls.length).toBe(0);
  });

  it('cooldown 30 min after credit balance 400, then retries', async () => {
    let t = 1_000_000;
    const { fn, calls } = mockFetch([
      { status: 400, body: { error: { message: 'Your credit balance is too low' } } },
      { status: 200, body: okBody('back') },
    ]);
    const p = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn, now: () => t });
    expect(await p.tryGenerate('a')).toMatchObject({ ok: false, reason: 'credit', status: 400 });
    t += 29 * 60 * 1000;
    expect(await p.tryGenerate('a')).toMatchObject({ ok: false, reason: 'cooldown' });
    expect(calls.length).toBe(1);
    t += 2 * 60 * 1000;
    const r = await p.tryGenerate('a');
    expect(r.ok).toBe(true);
    expect(calls.length).toBe(2);
  });

  it('401/403 cool down 30 min; 429/5xx/529 cool down 60 s', async () => {
    for (const [status, ms, reason] of [
      [401, 30 * 60 * 1000, 'auth'],
      [403, 30 * 60 * 1000, 'auth'],
      [429, 60 * 1000, 'rate_limit'],
      [500, 60 * 1000, 'server'],
      [529, 60 * 1000, 'server'],
    ] as const) {
      let t = 0;
      const { fn, calls } = mockFetch([{ status, body: {} }, { status: 200, body: okBody('ok') }]);
      const p = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn, now: () => t });
      expect(await p.tryGenerate('a')).toMatchObject({ ok: false, reason });
      t += ms - 1000;
      expect(await p.tryGenerate('a')).toMatchObject({ ok: false, reason: 'cooldown' });
      t += 2000;
      expect((await p.tryGenerate('a')).ok).toBe(true);
      expect(calls.length).toBe(2);
    }
  });

  it('404 and timeouts fail without throwing; plain 400 does not cool down', async () => {
    const { fn } = mockFetch([{ status: 404, body: {} }]);
    const p404 = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn });
    expect(await p404.tryGenerate('a')).toMatchObject({ ok: false, reason: 'not_found' });

    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const { fn: fn2 } = mockFetch([abort]);
    const pT = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn2 });
    expect(await pT.tryGenerate('a')).toMatchObject({ ok: false, reason: 'timeout' });

    const { fn: fn3, calls: c3 } = mockFetch([{ status: 400, body: { error: { message: 'bad' } } }]);
    const p400 = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn3 });
    expect(await p400.tryGenerate('a')).toMatchObject({ ok: false, reason: 'bad_request' });
    await p400.tryGenerate('b');
    expect(c3.length).toBe(2);
  });

  it('empty text (no text blocks) counts as failure', async () => {
    const { fn } = mockFetch([{ status: 200, body: { content: [{ type: 'thinking', thinking: 'x' }] } }]);
    const p = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn });
    expect(await p.tryGenerate('a')).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('never logs the api key', async () => {
    const logged: string[] = [];
    const origWarn = console.warn;
    console.warn = (...a: unknown[]) => { logged.push(a.join(' ')); };
    try {
      const { fn } = mockFetch([{ status: 401, body: {} }]);
      const p = createAnthropicProvider('m', noCache(), { apiKey: 'sk-ant-SECRET123', fetchImpl: fn });
      await p.generate('a');
    } finally {
      console.warn = origWarn;
    }
    expect(logged.length).toBeGreaterThan(0);
    expect(logged.join('\n')).not.toContain('SECRET123');
  });
});

describe('createClaudeFirstProvider', () => {
  const schema = z.object({ a: z.number() });

  it('uses Claude when it works', async () => {
    const { fn } = mockFetch([{ status: 200, body: okBody('claude says hi') }]);
    const claude = createAnthropicProvider('claude-sonnet-5-5', noCache(), { apiKey: 'k', fetchImpl: fn });
    const { provider: gem, seen } = fakeGemini('gemini');
    const p = createClaudeFirstProvider(claude, gem);
    const out = await p.generate('x');
    expect(out.text).toBe('claude says hi');
    expect(seen.generate).toBe(0);
    expect(p.model).toBe('claude-sonnet-5-5');
  });

  it('falls back to Gemini on failure and goes straight to Gemini with useSearch', async () => {
    const { fn, calls } = mockFetch([{ status: 529, body: {} }]);
    const claude = createAnthropicProvider('claude-sonnet-5-5', noCache(), { apiKey: 'k', fetchImpl: fn });
    const { provider: gem, seen } = fakeGemini('gemini text');
    const p = createClaudeFirstProvider(claude, gem);
    expect((await p.generate('x')).text).toBe('gemini text');
    expect(seen.generate).toBe(1);

    const before = calls.length;
    const s = await p.generate('grounded', { useSearch: true, maxTokens: 4096 });
    expect(s.text).toBe('gemini text');
    expect(calls.length).toBe(before); // Claude not called
    expect(seen.lastOpts.useSearch).toBe(true);
  });

  it('with no key behaves as Gemini', async () => {
    const claude = createAnthropicProvider('m', noCache(), { apiKey: '' });
    const { provider: gem, seen } = fakeGemini('g');
    const p = createClaudeFirstProvider(claude, gem);
    expect(p.available).toBe(true);
    expect(p.model).toBe('gemini-fake');
    expect((await p.generate('x')).text).toBe('g');
    expect(seen.generate).toBe(1);
  });

  it('generateStructured: valid fenced JSON from Claude passes Zod', async () => {
    const { fn } = mockFetch([{ status: 200, body: okBody('Here:\n```json\n{"a": 7}\n```') }]);
    const claude = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn });
    const { provider: gem, seen } = fakeGemini('', { a: 1 });
    const p = createClaudeFirstProvider(claude, gem);
    expect(await p.generateStructured('q', schema)).toEqual({ a: 7 });
    expect(seen.structured).toBe(0);
  });

  it('generateStructured: bare JSON surrounded by prose is parsed', async () => {
    const { fn } = mockFetch([{ status: 200, body: okBody('Sure! {"a": 3} hope it helps') }]);
    const claude = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn });
    const { provider: gem } = fakeGemini('', { a: 1 });
    expect(await createClaudeFirstProvider(claude, gem).generateStructured('q', schema)).toEqual({ a: 3 });
  });

  it('generateStructured: Zod-invalid or non-JSON Claude reply falls back to Gemini', async () => {
    for (const bad of ['{"a": "not a number"}', 'no json at all']) {
      const { fn } = mockFetch([{ status: 200, body: okBody(bad) }]);
      const claude = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn });
      const { provider: gem, seen } = fakeGemini('', { a: 99 });
      const out = await createClaudeFirstProvider(claude, gem).generateStructured('q', schema);
      expect(out).toEqual({ a: 99 });
      expect(seen.structured).toBe(1);
    }
  });

  it('generateStructured: Claude HTTP failure falls back to Gemini', async () => {
    const { fn } = mockFetch([{ status: 401, body: {} }]);
    const claude = createAnthropicProvider('m', noCache(), { apiKey: 'k', fetchImpl: fn });
    const { provider: gem, seen } = fakeGemini('', { a: 5 });
    expect(await createClaudeFirstProvider(claude, gem).generateStructured('q', schema)).toEqual({ a: 5 });
    expect(seen.structured).toBe(1);
  });
});
