import type { z } from 'zod';
import type { LLMProvider } from '../llm-provider.js';

export function extractJSON(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  try {
    return JSON.parse(jsonMatch[1]!.trim());
  } catch (e) {
    return null;
  }
}

export async function callLLMValidated<T>(
  provider: LLMProvider,
  prompt: string,
  schema: z.ZodType<T>,
  opts: { temperature: number; maxOutputTokens: number; tools?: any[] }
): Promise<T> {
  let currentPrompt = `${prompt}\n\nRespond ONLY with valid JSON matching the schema.`;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await provider.generate(currentPrompt, { 
      temperature: opts.temperature, 
      maxTokens: opts.maxOutputTokens 
    });
    
    if (!response || !response.text) {
      throw new Error('LLM returned empty response');
    }

    const json = extractJSON(response.text);
    const parsed = schema.safeParse(json);
    if (parsed.success) return parsed.data;
    
    // retry: append diff of error to prompt
    currentPrompt = `${currentPrompt}\n\nPrevious attempt failed validation:\n${parsed.error.message}\nReturn ONLY valid JSON matching the schema this time.`;
  }
  throw new Error('LLM validation failed after 3 attempts');
}
