import type { z } from 'zod';
import type { LLMProvider } from '../llm-provider.js';

export function extractJSON(raw: string): unknown {
  // First try to extract from <output> tags
  const outputMatch = raw.match(/<output>([\s\S]*?)<\/output>/);
  let textToParse = outputMatch ? outputMatch[1] : raw;
  
  // Then try markdown blocks
  const jsonMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) textToParse = jsonMatch[1];
  
  try {
    return JSON.parse(textToParse.trim());
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
  let currentPrompt = `${prompt}

Before outputting the final JSON, use <thinking> tags to reason step-by-step about your response. 
After thinking, output ONLY valid JSON matching the schema inside <output> tags.

Example format:
<thinking>
I need to analyze X, Y, Z...
</thinking>
<output>
{ "key": "value" }
</output>`;
  
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
