/**
 * @cs/agents — gemini-enrichment.ts
 *
 * Gemini LLM enrichment functions called by specialist agents.
 * Each function takes deterministic findings and returns AI-enriched narrative/proposals.
 *
 * All functions degrade gracefully if GEMINI_API_KEY is not set.
 * The deterministic output is ALWAYS the baseline — LLM only adds.
 */

import { getGeminiProvider } from './llm-provider.js';
import type { AnalystFinding, AnalystReport } from './types.js';
import { z } from 'zod';

interface EnrichedNarrative {
  executiveSummary: string;
  keyInsight: string;
  strategicContext: string;
}

interface EnrichedProposal {
  title: string;
  rationale: string;
  changeType: string;
  priority: 'low' | 'medium' | 'high';
  quickWin?: string;
  estimatedEffort?: string;
}

/**
 * Enriches an analyst report's narrative using Gemini.
 * Falls back to deterministic narrative if LLM unavailable.
 */
export async function enrichAnalystNarrative(
  report: AnalystReport,
  projectName: string,
): Promise<EnrichedNarrative> {
  const llm = getGeminiProvider();

  if (!llm.available) {
    return {
      executiveSummary: report.summaryNarrative,
      keyInsight: report.findings[0]?.title ?? 'No critical findings.',
      strategicContext: `Analysis for ${projectName} using deterministic scoring only.`,
    };
  }

  const findingsSummary = report.findings
    .slice(0, 5)
    .map((f) => `[${f.severity.toUpperCase()}] ${f.title}: ${f.detail}`)
    .join('\n');

  const prompt = `You are a senior strategy consultant specializing in Connected Strategy (Wharton framework).

Project: "${projectName}"
Agent: ${report.agentId}
Findings (${report.findings.length} total):
${findingsSummary}

Write a brief but insightful strategic analysis in Spanish. Be concrete, not generic.`;

  const schema = z.object({
    executiveSummary: z.string(),
    keyInsight: z.string(),
    strategicContext: z.string()
  });

  const result = await llm.generateStructured<EnrichedNarrative>(prompt, schema, { temperature: 0.4 });

  if (!result) {
    return {
      executiveSummary: report.summaryNarrative,
      keyInsight: report.findings[0]?.title ?? 'No critical findings.',
      strategicContext: `Analysis for ${projectName} using deterministic scoring.`,
    };
  }

  return result;
}

/**
 * Generates AI-enriched improvement proposals from analyst findings.
 * Falls back to deterministic proposals if LLM unavailable.
 */
export async function enrichProposals(
  findings: AnalystFinding[],
  projectName: string,
  agentId: string,
): Promise<EnrichedProposal[]> {
  const llm = getGeminiProvider();

  if (!llm.available || findings.length === 0) {
    return findings
      .filter((f) => f.severity === 'high' || f.severity === 'medium')
      .map((f) => ({
        title: `Resolver: ${f.title}`,
        rationale: f.detail,
        changeType: 'feature',
        priority: f.severity as 'low' | 'medium' | 'high',
      }));
  }

  const highPriorityFindings = findings
    .filter((f) => f.severity === 'high' || f.severity === 'medium')
    .slice(0, 4);

  if (highPriorityFindings.length === 0) return [];

  const findingsList = highPriorityFindings
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.title} — ${f.detail} (Loop: ${f.loopPhase})`)
    .join('\n');

  const prompt = `You are a senior engineering and strategy advisor. 
Project: "${projectName}" (analyzed by ${agentId})

High-priority findings:
${findingsList}

Generate concrete, actionable improvement proposals in Spanish for each finding.
Each proposal must have a clear technical action that can be implemented in 1-4 weeks.`;

  const schema = z.array(z.object({
    title: z.string(),
    rationale: z.string(),
    changeType: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    quickWin: z.string().optional(),
    estimatedEffort: z.string().optional()
  }));

  const result = await llm.generateStructured<EnrichedProposal[]>(prompt, schema, { temperature: 0.35 });

  if (!result || !Array.isArray(result)) {
    return highPriorityFindings.map((f) => ({
      title: `Resolver: ${f.title}`,
      rationale: f.detail,
      changeType: 'feature',
      priority: f.severity as 'low' | 'medium' | 'high',
    }));
  }

  return result;
}

/**
 * Synthesizes a portfolio-level strategic summary using Gemini.
 */
export async function synthesizePortfolioInsight(
  projectNames: string[],
  totalFindings: number,
  totalProposals: number,
): Promise<string> {
  const llm = getGeminiProvider();

  if (!llm.available) {
    return `Portfolio de ${projectNames.length} proyectos analizados. ${totalFindings} hallazgos, ${totalProposals} propuestas generadas.`;
  }

  const prompt = `You are a portfolio strategist. Summarize the strategic situation for these projects in 2-3 sentences in Spanish:
Projects: ${projectNames.join(', ')}
Total findings: ${totalFindings}
Total proposals: ${totalProposals}

Focus on the overall portfolio health and top priority direction. Be concrete.`;

  const { text } = await llm.generate(prompt, { temperature: 0.4, maxTokens: 200 });
  return text || `Portfolio de ${projectNames.length} proyectos: ${totalFindings} hallazgos, ${totalProposals} propuestas.`;
}
