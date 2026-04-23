/**
 * @cs/agents — worksheet-synthesizer.ts
 *
 * Auto-fills worksheet answers from project file analysis.
 * Uses heuristic rules + knowledge index — no LLM by default.
 * LLM enrichment can be plugged in via the AgentContext.llmProvider hint.
 *
 * Loop phase: Analyze (translating observed signals into structured answers)
 */

import fs from 'node:fs';
import path from 'node:path';
import type { AgentContext, AgentResult, WorksheetSynthesisResult } from '../types.js';
import type { AgentId } from '../types.js';
import type { WorksheetDefinition } from '@cs/domain';
import { ALL_WORKSHEETS } from '@cs/domain';

const AGENT_ID: AgentId = 'worksheet-synthesizer';

// ─── Heuristic Answer Derivation ─────────────────────────────────────────────

function readFileIfExists(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function detectRevenueModel(projectPath: string): string {
  const readme = readFileIfExists(path.join(projectPath, 'README.md')).toLowerCase();
  if (readme.includes('subscription') || readme.includes('saas')) return 'subscription';
  if (readme.includes('marketplace') || readme.includes('commission')) return 'marketplace';
  if (readme.includes('freemium')) return 'freemium';
  if (readme.includes('license')) return 'license';
  return 'unknown';
}

function detectUserTypes(projectPath: string): string[] {
  const readme = readFileIfExists(path.join(projectPath, 'README.md')).toLowerCase();
  const actors: string[] = [];
  if (readme.includes('admin') || readme.includes('operator')) actors.push('administrator');
  if (readme.includes('user') || readme.includes('customer') || readme.includes('client')) actors.push('end-user');
  if (readme.includes('analyst') || readme.includes('analyst')) actors.push('analyst');
  if (readme.includes('distributor')) actors.push('distributor');
  if (readme.includes('supplier') || readme.includes('vendor')) actors.push('supplier');
  return actors.length > 0 ? actors : ['end-user'];
}

function hasApiIntegration(projectPath: string): boolean {
  const dirs = ['src', 'api', 'services', 'connectors'];
  for (const dir of dirs) {
    const p = path.join(projectPath, dir);
    if (fs.existsSync(p)) return true;
  }
  return false;
}

function hasDataPipeline(projectPath: string): boolean {
  const readme = readFileIfExists(path.join(projectPath, 'README.md')).toLowerCase();
  return readme.includes('pipeline') || readme.includes('etl') || readme.includes('ingestion') || readme.includes('connector');
}

function estimateAutomation(stack: string[]): number {
  let score = 0;
  if (stack.includes('python')) score += 20;
  if (stack.includes('docker') || stack.includes('docker-compose')) score += 20;
  if (stack.includes('github-actions')) score += 25;
  if (stack.includes('prisma')) score += 15;
  return Math.min(score, 100);
}

function estimateTestCoverage(projectPath: string): number {
  const hasTests = fs.existsSync(path.join(projectPath, 'tests')) ||
    fs.existsSync(path.join(projectPath, '__tests__')) ||
    fs.existsSync(path.join(projectPath, 'test')) ||
    readFileIfExists(path.join(projectPath, 'package.json')).includes('"test"');
  const hasCoverage = readFileIfExists(path.join(projectPath, 'package.json')).includes('coverage') ||
    readFileIfExists(path.join(projectPath, 'pyproject.toml')).includes('coverage');
  if (!hasTests) return 0;
  if (hasCoverage) return 70;
  return 40;
}

// ─── Worksheet-Specific Synthesizer ──────────────────────────────────────────

interface SynthesisInput {
  projectPath: string;
  stack: string[];
  worksheetId: string;
}

function synthesizeWorksheetAnswers(
  worksheet: WorksheetDefinition,
  input: SynthesisInput,
): { answers: Record<string, unknown>; confidence: Record<string, 'observed' | 'inferred' | 'confirmed'> } {
  const answers: Record<string, unknown> = {};
  const confidence: Record<string, 'observed' | 'inferred' | 'confirmed'> = {};

  const allQuestions = worksheet.sections.flatMap((s) => s.questions);

  for (const q of allQuestions) {
    const qid = q.id;
    const qText = q.text.toLowerCase();

    // Heuristic matching by question text keywords
    if (qText.includes('actor') || qText.includes('user') || qText.includes('customer')) {
      answers[qid] = detectUserTypes(input.projectPath).join(', ');
      confidence[qid] = 'inferred';
    } else if (qText.includes('revenue') || qText.includes('monetiz') || qText.includes('pricing')) {
      answers[qid] = detectRevenueModel(input.projectPath);
      confidence[qid] = 'inferred';
    } else if (qText.includes('api') || qText.includes('integration') || qText.includes('connect')) {
      answers[qid] = hasApiIntegration(input.projectPath) ? 'yes' : 'no';
      confidence[qid] = 'observed';
    } else if (qText.includes('data') && (qText.includes('pipeline') || qText.includes('ingest'))) {
      answers[qid] = hasDataPipeline(input.projectPath) ? 'yes' : 'no';
      confidence[qid] = 'inferred';
    } else if (qText.includes('automat') || qText.includes('coverage')) {
      if (q.type === 'scale' || q.type === 'number') {
        answers[qid] = estimateAutomation(input.stack);
      } else {
        answers[qid] = estimateAutomation(input.stack) > 50 ? 'high' : 'medium';
      }
      confidence[qid] = 'inferred';
    } else if (qText.includes('test')) {
      answers[qid] = estimateTestCoverage(input.projectPath);
      confidence[qid] = 'observed';
    } else if (qText.includes('stack') || qText.includes('technolog') || qText.includes('framework')) {
      answers[qid] = input.stack.join(', ');
      confidence[qid] = 'observed';
    } else if (q.type === 'boolean') {
      answers[qid] = false;
      confidence[qid] = 'inferred';
    } else if (q.type === 'scale') {
      answers[qid] = 5;
      confidence[qid] = 'inferred';
    } else if (q.type === 'number') {
      answers[qid] = 0;
      confidence[qid] = 'inferred';
    } else {
      // Default text/choice
      answers[qid] = '';
      confidence[qid] = 'inferred';
    }
  }

  return { answers, confidence };
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runWorksheetSynthesizer(
  input: { projectId: string; projectPath: string; stack: string[]; worksheetId?: string },
  context: AgentContext,
): Promise<AgentResult<WorksheetSynthesisResult[]>> {
  const startMs = Date.now();

  try {
    const worksheetsToProcess = input.worksheetId
      ? ALL_WORKSHEETS.filter((w) => w.id === input.worksheetId)
      : ALL_WORKSHEETS;

    const results: WorksheetSynthesisResult[] = [];

    for (const worksheet of worksheetsToProcess) {
      const { answers, confidence } = synthesizeWorksheetAnswers(worksheet, {
        projectPath: input.projectPath,
        stack: input.stack,
        worksheetId: worksheet.id,
      });

      results.push({
        worksheetId: worksheet.id,
        projectId: input.projectId,
        autoFilledAnswers: answers,
        confidence,
        evidence: [`filesystem:${input.projectPath}`, `worksheet:${worksheet.id}`],
        synthesizedAt: new Date().toISOString(),
      });
    }

    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: true,
      data: results,
      durationMs: Date.now() - startMs,
      evidence: [`filesystem:${input.projectPath}`],
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
