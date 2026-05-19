import { getGeminiProvider } from '../llm-provider.js';
import { ProjectStateStore } from '../v3/state-store.js';

export async function runBatchReporter(projectIds: string[]): Promise<string> {
  const store = new ProjectStateStore();
  const llm = getGeminiProvider();
  
  if (!llm.available) {
    throw new Error('Gemini LLM is required for batch reporting.');
  }

  const projectStates = projectIds.map(id => store.load(id)).filter(Boolean);
  
  if (projectStates.length === 0) {
    return '# Portfolio Report\n\nNo active projects found with valid state.';
  }

  const summarizedData = projectStates.map(state => {
    return `
## ${state!.projectName} (ID: ${state!.projectId})
- Health Score: ${state!.synthesis?.healthScore ?? 'Unknown'}
- Top Priorities: ${state!.synthesis?.topPriorities?.length || 0}
- Critical Findings: ${state!.swarm?.findings.filter(f => f.severity === 'critical').length || 0}
- Latest Move Date: ${state!.lastRunAt ?? 'Never'}
    `.trim();
  }).join('\n\n');

  const prompt = `
You are the Chief Strategy Officer (CSO) of the Connected Strategy portfolio.
I will give you a summary of the current state of ${projectStates.length} projects.
Please generate an executive "Board-Ready" markdown report.
Your report should include:
1. An Executive Summary paragraph.
2. A list of the Top 3 projects that require immediate attention (based on critical findings and health score).
3. Strategic patterns or anomalies across the portfolio.

PROJECT DATA:
${summarizedData}
`;

  const response = await llm.generate(prompt);
  return response.text;
}
