/**
 * @cs/agents — ai-frontier-analyst.ts
 *
 * Evaluates AI frontier opportunities: LLM integration, agent design,
 * automation readiness, and AI-driven moat potential.
 * Prioritizes by real business value, not novelty.
 * Maps to WS07, WS04.
 *
 * Loop phase: Analyze (AI opportunity prioritization)
 */

import type { AgentContext, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { AgentId } from '../types.js';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';

const AGENT_ID: AgentId = 'ai-frontier-analyst';

// ─── AI Opportunity Heuristics ────────────────────────────────────────────────

function evaluateAgentDesignReadiness(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const hasAgentDesign = answers['ws07_q_agent_guardrails'] === 'yes' ||
    answers['ws07_q_agent_guardrails'] === true;
  const approvalGated = answers['ws07_q_approval_gated'] === 'yes' ||
    answers['ws07_q_approval_gated'] === true;

  if (!hasAgentDesign) {
    findings.push({
      category: 'agent-design',
      title: 'No agent design or guardrails defined',
      detail: 'AI agents deployed without guardrails create unpredictable outcomes. WS07 defines the approval-gated agent contract that should be implemented first.',
      evidence: ['worksheet:ws07'],
      impactOnWTP: 'positive',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'positive',
      loopPhase: 'React',
      severity: 'high',
    });
  }

  if (!approvalGated) {
    findings.push({
      category: 'agent-design',
      title: 'No approval gate for AI actions',
      detail: 'AI-generated recommendations are not gated by human approval. This increases hallucination risk in business-critical workflows.',
      evidence: ['worksheet:ws07'],
      impactOnWTP: 'negative',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: 'high',
    });
  }

  return findings;
}

function evaluateAutomationOpportunities(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const automationLevel = Number(answers['ws04_q_automation_level'] ?? 0);
  const manualOps = Number(answers['ws04_q_manual_ops'] ?? 100);

  if (manualOps > 60) {
    findings.push({
      category: 'automation',
      title: 'High-value automation opportunity identified',
      detail: `${manualOps}% of operations are manual. AI-driven automation of top 3 manual workflows could reduce cost-to-serve by 30-50%.`,
      evidence: ['worksheet:ws04'],
      impactOnWTP: 'neutral',
      impactOnCost: 'positive',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: 'medium',
    });
  }

  if (automationLevel < 20) {
    findings.push({
      category: 'automation',
      title: 'Automation baseline too low for AI augmentation',
      detail: 'Current automation level is below 20%. AI augmentation requires a working automation baseline. Implement rule-based automation before LLM integration.',
      evidence: ['worksheet:ws04'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateLLMIntegrationValue(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const hasLLMIntegration = answers['ws04_q_llm_integrated'] === 'yes' ||
    answers['ws04_q_llm_integrated'] === true;
  const llmGrounded = answers['ws04_q_llm_grounded'] === 'yes' ||
    answers['ws04_q_llm_grounded'] === true;

  if (!hasLLMIntegration) {
    findings.push({
      category: 'llm-integration',
      title: 'No LLM integration — high-value opportunity',
      detail: 'LLM integration could automate content generation, classification, and summarization. Prioritize workflows with highest volume and lowest error tolerance.',
      evidence: ['worksheet:ws04', 'worksheet:ws07'],
      impactOnWTP: 'positive',
      impactOnCost: 'positive',
      impactOnSwitchingCosts: 'positive',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  } else if (!llmGrounded) {
    findings.push({
      category: 'llm-integration',
      title: 'LLM outputs not grounded in proprietary data',
      detail: 'LLM is integrated but responses are not grounded in proprietary data (RAG or fine-tuning). This reduces accuracy and differentiability.',
      evidence: ['worksheet:ws04'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'negative',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateAIAsMonat(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const proprietaryData = answers['ws05_q_proprietary_data'] === 'yes';
  const hasLLM = answers['ws04_q_llm_integrated'] === 'yes';
  const networkEffect = Number(answers['ws03_q_network_effect'] ?? 0);

  // AI moat requires: proprietary data + LLM + network effect flywheel
  if (!proprietaryData || !hasLLM || networkEffect < 40) {
    findings.push({
      category: 'ai-moat',
      title: 'AI flywheel not yet activated',
      detail: 'An AI moat requires proprietary data + LLM that improves from usage + network effects. All three components must be in place for a self-reinforcing AI advantage.',
      evidence: ['worksheet:ws05', 'worksheet:ws03', 'worksheet:ws04'],
      impactOnWTP: 'positive',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'positive',
      loopPhase: 'Repeat',
      severity: 'medium',
    });
  }

  return findings;
}

export async function runAIFrontierAnalyst(
  input: { projectId: string; answers: Record<string, unknown> },
  context: AgentContext,
): Promise<AgentResult<AnalystReport>> {
  const startMs = Date.now();

  try {
    const findings: AnalystFinding[] = [
      ...evaluateAgentDesignReadiness(input.answers),
      ...evaluateAutomationOpportunities(input.answers),
      ...evaluateLLMIntegrationValue(input.answers),
      ...evaluateAIAsMonat(input.answers),
    ];

    const syntheticAnswer: WorksheetAnswer = {
      id: 'synthetic',
      worksheetId: 'all',
      projectId: input.projectId,
      version: 1,
      answers: input.answers,
      confidence: {},
      updatedAt: new Date().toISOString(),
    };

    let metrics = null;
    try {
      metrics = computeStrategicMetrics(input.projectId, syntheticAnswer, defaultScoringWeights(input.projectId));
    } catch { /* ok */ }

    const dsScore = metrics?.dataScienceReadiness ?? 0;
    const archScore = metrics?.architectureResilience ?? 0;
    const aiReadiness = ((dsScore + archScore) / 2).toFixed(1);

    const report: AnalystReport = {
      projectId: input.projectId,
      agentId: AGENT_ID,
      findings,
      summaryNarrative:
        `AI Readiness Index: ${aiReadiness}/100 (composite DS+Arch). ` +
        `${findings.filter((f) => f.impactOnWTP === 'positive').length} AI opportunities with positive WTP impact. ` +
        `${findings.filter((f) => f.severity === 'high').length} critical guardrail gaps.`,
      recommendedProposals: findings
        .filter((f) => f.severity !== 'low')
        .map((f) => ({
          title: `AI: ${f.title}`,
          rationale: f.detail,
          changeType: f.category === 'automation' ? 'feature' : 'architecture',
          priority: f.severity === 'high' ? 'high' as const : 'medium' as const,
        })),
      analyzedAt: new Date().toISOString(),
    };

    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: true,
      data: report,
      durationMs: Date.now() - startMs,
      evidence: [`project:${input.projectId}`, 'domain:ai-frontier-heuristics'],
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: false,
      errorMessage: String(err),
      durationMs: Date.now() - startMs,
      evidence: [],
      completedAt: new Date().toISOString(),
    };
  }
}
