import { getGeminiProvider } from '../llm-provider.js';
import { ProjectStateStore } from '../v3/state-store.js';

export async function runMarketIntelAgent(projectId: string): Promise<any[]> {
  const store = new ProjectStateStore();
  const state = store.load(projectId);
  if (!state) {
    throw new Error(`Project ${projectId} not found.`);
  }

  const llm = getGeminiProvider();
  if (!llm.available) {
    throw new Error('Gemini LLM is required for Market Intelligence.');
  }

  const contextStr = store.readContext(projectId) || state.projectName;
  
  const prompt = `
You are the Market Intelligence Agent for Connected Strategy.
Your task is to search the web for the latest news, market trends, competitors, and strategic movements regarding the following project context:

PROJECT NAME: ${state.projectName}
CONTEXT: ${contextStr.substring(0, 500)}

Please use the Google Search tool to find recent articles, product launches, or market shifts related to this domain.
Then, synthesize your findings into exactly 2 to 3 strategic insights.
Each finding must include:
- id: a unique string like "intel-01"
- category: "Competitor Action", "Market Trend", or "Regulatory"
- title: A short title for the finding
- description: A detailed description of the market trend or news
- severity: "critical", "high", "medium" or "low"
- severityRubric: a brief explanation of why it has this severity
- evidence: link or source of the finding
- remediation: strategic recommendation
- estimatedEffort: "days"

Output valid JSON matching this schema:
{
  "findings": [
    { "id": "string", "category": "string", "title": "string", "description": "string", "severity": "string", "severityRubric": "string", "evidence": "string", "remediation": "string", "estimatedEffort": "days" }
  ]
}
  `;

  // We pass useSearch: true to enable Google Search Grounding for this specific call
  const response = await llm.generate(prompt, { temperature: 0.3, maxTokens: 4096, useSearch: true });

  if (!response.text) return [];

  try {
    const jsonMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, response.text];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    return parsed.findings.map((f: any) => ({
      ...f,
      agent: 'market-intel-agent',
      whartonImpact: {}
    }));
  } catch (err) {
    console.warn('[MarketIntelAgent] Failed to parse structured JSON from response:', response.text.substring(0, 200));
    return [];
  }
}
