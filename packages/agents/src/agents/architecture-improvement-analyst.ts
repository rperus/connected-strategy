/**
 * @cs/agents — architecture-improvement-analyst.ts
 *
 * Evaluates architecture resilience: modularity, test coverage,
 * observability, recoverability. Maps to WS07, WS09.
 *
 * Loop phase: Analyze (technical architecture assessment)
 */

import fs from 'node:fs';
import path from 'node:path';
import type { AgentContext, AgentResult, AnalystReport, AnalystFinding } from '../types.js';
import type { AgentId } from '../types.js';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer } from '@cs/domain';

const AGENT_ID: AgentId = 'architecture-improvement-analyst';

// ─── Filesystem-based architecture signals ────────────────────────────────────

function detectArchitectureSignals(projectPath: string): {
  hasTests: boolean;
  hasLinting: boolean;
  hasTypeScript: boolean;
  hasDockerfile: boolean;
  hasCI: boolean;
  hasMonorepo: boolean;
  hasObservability: boolean;
} {
  const exists = (p: string) => fs.existsSync(path.join(projectPath, p));

  return {
    hasTests: exists('tests') || exists('__tests__') || exists('test') || exists('spec'),
    hasLinting: exists('.eslintrc') || exists('.eslintrc.js') || exists('.eslintrc.json') ||
      exists('biome.json') || exists('pylintrc') || exists('.flake8'),
    hasTypeScript: exists('tsconfig.json'),
    hasDockerfile: exists('Dockerfile') || exists('docker-compose.yml') || exists('docker-compose.yaml'),
    hasCI: exists('.github/workflows') || exists('.gitlab-ci.yml') || exists('.circleci'),
    hasMonorepo: exists('pnpm-workspace.yaml') || exists('nx.json') || exists('lerna.json'),
    hasObservability: exists('prometheus.yml') || exists('grafana') || exists('datadog.yml') ||
      fs.existsSync(path.join(projectPath, 'src')) && (() => {
        try {
          const srcContent = fs.readdirSync(path.join(projectPath, 'src')).join(' ');
          return srcContent.includes('monitor') || srcContent.includes('observ') || srcContent.includes('telemetry');
        } catch { return false; }
      })(),
  };
}

function evaluateModularity(answers: Record<string, unknown>, projectPath?: string): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const modularity = Number(answers['ws07_q_modularity'] ?? 0);
  const signals = projectPath ? detectArchitectureSignals(projectPath) : null;

  const hasMonorepoSignal = signals?.hasMonorepo ?? false;

  if (modularity < 40 && !hasMonorepoSignal) {
    findings.push({
      category: 'modularity',
      title: 'Low architecture modularity',
      detail: 'The codebase shows signs of monolithic architecture without clear module boundaries. This increases coupling risk and slows iteration.',
      evidence: ['worksheet:ws07'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateTestCoverage(answers: Record<string, unknown>, projectPath?: string): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const testCoverage = Number(answers['ws07_q_test_coverage'] ?? 0);
  const signals = projectPath ? detectArchitectureSignals(projectPath) : null;

  if (testCoverage < 40 && !signals?.hasTests) {
    findings.push({
      category: 'test-coverage',
      title: 'Insufficient test coverage',
      detail: 'Test coverage below 40% creates regression risk during iteration. Automated testing is prerequisite for safe continuous deployment.',
      evidence: ['worksheet:ws07'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'React',
      severity: testCoverage < 10 ? 'high' : 'medium',
    });
  }

  return findings;
}

function evaluateObservability(answers: Record<string, unknown>, projectPath?: string): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const observability = Number(answers['ws08_q_instrumentation'] ?? 0);
  const signals = projectPath ? detectArchitectureSignals(projectPath) : null;

  if (observability < 40 && !signals?.hasObservability) {
    findings.push({
      category: 'observability',
      title: 'Weak system observability',
      detail: 'No structured logging, metrics, or distributed tracing detected. Debugging and performance optimization rely on manual investigation.',
      evidence: ['worksheet:ws08', 'worksheet:ws09'],
      impactOnWTP: 'neutral',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Sense',
      severity: 'medium',
    });
  }

  return findings;
}

function evaluateCompliance(answers: Record<string, unknown>): AnalystFinding[] {
  const findings: AnalystFinding[] = [];

  const hasComplianceFramework = answers['ws09_q_compliance_framework'] === 'yes' ||
    answers['ws09_q_compliance_framework'] === true;
  const auditTrail = Number(answers['ws09_q_audit_trail'] ?? 0);

  if (!hasComplianceFramework) {
    findings.push({
      category: 'compliance',
      title: 'No formal compliance framework',
      detail: 'No evidence of a compliance or audit framework. For regulated industries, this is a blocker for enterprise deals.',
      evidence: ['worksheet:ws09'],
      impactOnWTP: 'negative',
      impactOnCost: 'negative',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Analyze',
      severity: 'medium',
    });
  }

  if (auditTrail < 50) {
    findings.push({
      category: 'audit',
      title: 'Insufficient audit trail coverage',
      detail: 'Audit trail coverage below 50%. Critical user actions are not traceable. This is a compliance and trust risk.',
      evidence: ['worksheet:ws09'],
      impactOnWTP: 'negative',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Transmit',
      severity: 'medium',
    });
  }

  return findings;
}

export async function runArchitectureImprovementAnalyst(
  input: { projectId: string; projectPath?: string; answers: Record<string, unknown> },
  context: AgentContext,
): Promise<AgentResult<AnalystReport>> {
  const startMs = Date.now();

  try {
    const findings: AnalystFinding[] = [
      ...evaluateModularity(input.answers, input.projectPath),
      ...evaluateTestCoverage(input.answers, input.projectPath),
      ...evaluateObservability(input.answers, input.projectPath),
      ...evaluateCompliance(input.answers),
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

    const archScore = metrics?.architectureResilience ?? 0;

    const report: AnalystReport = {
      projectId: input.projectId,
      agentId: AGENT_ID,
      findings,
      summaryNarrative:
        `Architecture Resilience: ${archScore.toFixed(1)}/100. ` +
        `${findings.length} architectural concerns identified.`,
      recommendedProposals: findings
        .filter((f) => f.severity !== 'low')
        .map((f) => ({
          title: `Arch: ${f.title}`,
          rationale: f.detail,
          changeType: 'architecture',
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
      evidence: [`project:${input.projectId}`, 'domain:arch-scoring'],
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
