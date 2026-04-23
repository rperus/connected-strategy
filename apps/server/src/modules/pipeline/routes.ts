/**
 * Full Pipeline Routes — Express Router
 *
 * ONE-CLICK pipeline: scan → auto-fill worksheets → analyze → generate prompts
 * Mount at: /api/pipeline
 *
 * POST /api/pipeline/run-full
 *   Scans projects in C:\dev → auto-fills worksheets with scoring keys →
 *   runs all 6 analysts + proposal composer → generates prompt packets for Antigravity.
 *   Returns everything in one response.
 */

import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, Router } from 'express';
import {
  createJob,
  markRunning,
  markDone,
  markFailed,
  getRegisteredAgent,
  getQueueStats,
} from '@cs/agents';
import type { AgentId, AgentContext, AnalystReport } from '@cs/agents';
import { computeStrategicMetrics, defaultScoringWeights } from '@cs/domain';
import type { WorksheetAnswer, StrategicMetrics } from '@cs/domain';
import { insertJob, updateJob } from '../../db/repositories/jobs.js';
import { listProjects, upsertProject, deleteProject } from '../../db/repositories/projects.js';
import { upsertAnswer, listAnswers } from '../../db/repositories/worksheets.js';
import { insertPipelineRun, listPipelineRuns } from '../../db/repositories/pipeline-runs.js';

const router: Router = express.Router();

// ── Results cache (persists across requests within same server session) ────────
interface PipelineResults {
  timestamp: string;
  elapsed: string;
  findings: Array<{ projectId: string; projectName: string; finding: import('@cs/agents').AnalystFinding; agentId: string }>;
  proposals: Array<import('@cs/domain').ImprovementProposal>;
  promptPackets: Array<{ projectName: string; promptForAntigravity: string }>;
}
let cachedResults: PipelineResults | null = null;

export function getCachedResults() { return cachedResults; }

/**
 * POST /api/pipeline/run-full
 *
 * Full pipeline: scan → auto-fill → analyze → prompts.
 * Body (optional): { scanPath?: string, useGemini?: boolean }
 * Default scanPath: C:\dev
 * Default useGemini: true (uses Gemini API if key is available)
 * Set useGemini: false for zero-cost deterministic-only mode
 */
router.post('/run-full', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const body = req.body as { scanPath?: string; useGemini?: boolean };
  const scanPath = body.scanPath ?? 'C:\\dev';
  const useGemini = body.useGemini !== false; // default true

  // If useGemini is false, temporarily disable the LLM provider
  if (!useGemini) {
    process.env._CS_FORCE_OFFLINE = '1';
  }

  const log: string[] = [];
  const push = (msg: string) => { log.push(`[${((Date.now() - startTime) / 1000).toFixed(1)}s] ${msg}`); };

  try {
    // ── Step 0: Clean duplicate projects ──────────────────────────────────────
    push('Step 0: Cleaning duplicate projects...');
    cleanDuplicateProjects();

    // ── Step 1: Scan projects ─────────────────────────────────────────────────
    push('Step 1: Scanning projects...');
    const scanner = getRegisteredAgent('portfolio-scanner')!;
    const scanContext: AgentContext = { jobId: 'pipeline-scan', projectId: 'portfolio', startedAt: new Date().toISOString() };
    const scanResult = await scanner.run({ scanPath }, scanContext);

    if (!scanResult.success || !scanResult.data) {
      res.status(500).json({ ok: false, error: 'Scan failed', log });
      return;
    }

    const scanData = scanResult.data as { projects: Array<{ path: string; name: string; stack: string[]; maturity: string; tags: string[]; fileCount: number }> };
    push(`Found ${scanData.projects.length} projects`);

    // Register projects in SQLite with consistent IDs
    for (const p of scanData.projects) {
      const projectId = normalizeProjectId(p.name);
      upsertProject({
        id: projectId,
        name: p.name,
        path: p.path,
        stack: p.stack,
        maturity: p.maturity as 'nascent' | 'developing' | 'mature' | 'legacy',
        tags: p.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // ── Step 2: Auto-fill worksheets ──────────────────────────────────────────
    push('Step 2: Auto-filling worksheets...');
    const projects = listProjects();
    const synthesizer = getRegisteredAgent('worksheet-synthesizer')!;

    const worksheetResults: Array<{ projectId: string; worksheetsFilledCount: number }> = [];

    for (const project of projects) {
      const synthCtx: AgentContext = { jobId: `synth-${project.id}`, projectId: project.id, startedAt: new Date().toISOString() };
      const synthResult = await synthesizer.run(
        { projectId: project.id, projectPath: project.path, stack: project.stack },
        synthCtx,
      );

      if (synthResult.success && synthResult.data) {
        const synthData = synthResult.data as Array<{
          worksheetId: string;
          projectId: string;
          autoFilledAnswers: Record<string, unknown>;
          confidence: Record<string, 'observed' | 'inferred' | 'confirmed'>;
        }>;

        // Build scoring keys from synthesized answers
        const scoringKeys = buildScoringKeys(project.path, project.stack);

        for (const ws of synthData) {
          // Merge worksheet answers with scoring keys
          const mergedAnswers = { ...ws.autoFilledAnswers, ...scoringKeys };

          const answer: WorksheetAnswer = {
            id: `${ws.worksheetId}::${project.id}`,
            worksheetId: ws.worksheetId,
            projectId: project.id,
            version: 1,
            answers: mergedAnswers,
            confidence: ws.confidence,
            updatedAt: new Date().toISOString(),
          };
          upsertAnswer(answer);
        }

        worksheetResults.push({ projectId: project.id, worksheetsFilledCount: synthData.length });
        push(`  ${project.name}: ${synthData.length} worksheets auto-filled`);
      }
    }

    // ── Step 3: Run analysis agents ───────────────────────────────────────────
    push('Step 3: Running analysis agents...');

    const analystIds: AgentId[] = [
      'connected-strategy-analyst',
      'competitive-advantage-analyst',
      'business-model-analyst',
      'data-science-opportunity-analyst',
      'architecture-improvement-analyst',
      'ai-frontier-analyst',
    ];

    const analysisResults: Array<{
      projectId: string;
      projectName: string;
      findings: number;
      proposals: number;
      metrics: StrategicMetrics | null;
      jobIds: string[];
    }> = [];

    // Cache arrays for findings and proposals
    const allFindings: PipelineResults['findings'] = [];
    const allProposals: import('@cs/domain').ImprovementProposal[] = [];

    for (const project of projects) {
      const jobIds: string[] = [];
      const reports: AnalystReport[] = [];

      // Get all merged answers for this project
      const savedAnswers = listAnswers(project.id);
      const mergedAnswerRecord: Record<string, unknown> = {};
      for (const sa of savedAnswers) {
        Object.assign(mergedAnswerRecord, sa.answers);
      }

      for (const agentId of analystIds) {
        const input: Record<string, unknown> = {
          projectId: project.id,
          answers: mergedAnswerRecord,
          projectPath: project.path,
        };

        const job = createJob(project.id, agentId, input);
        jobIds.push(job.id);
        try { insertJob(job); } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }

        markRunning(job.id);
        const agent = getRegisteredAgent(agentId)!;
        const ctx: AgentContext = { jobId: job.id, projectId: project.id, startedAt: new Date().toISOString() };

        try {
          const result = await agent.run(input, ctx);
          const updated = markDone(job.id, result);
          if (updated) try { updateJob(updated); } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }
          if (result.success && result.data) {
            const report = result.data as AnalystReport;
            reports.push(report);
            // Cache findings
            for (const f of report.findings ?? []) {
              allFindings.push({ projectId: project.id, projectName: project.name, finding: f, agentId });
            }
          }
        } catch (err) {
          const updated = markFailed(job.id, String(err));
          if (updated) try { updateJob(updated); } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }
        }
      }

      // Compose proposals
      let proposalCount = 0;
      const composerInput = { projectId: project.id, reports };
      const composerJob = createJob(project.id, 'proposal-composer', composerInput as unknown as Record<string, unknown>);
      jobIds.push(composerJob.id);
      try { insertJob(composerJob); } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }
      markRunning(composerJob.id);

      const composer = getRegisteredAgent('proposal-composer')!;
      const composerCtx: AgentContext = { jobId: composerJob.id, projectId: project.id, startedAt: new Date().toISOString() };

      try {
        const composerResult = await composer.run(composerInput as unknown as Record<string, unknown>, composerCtx);
        const updated = markDone(composerJob.id, composerResult);
        if (updated) try { updateJob(updated); } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }
        // composerResult.data is ImprovementProposal[] directly (not wrapped in { proposals })
        const proposals = composerResult.data;
        proposalCount = Array.isArray(proposals) ? proposals.length : 0;
        // Cache proposals
        if (Array.isArray(proposals)) {
          allProposals.push(...(proposals as import('@cs/domain').ImprovementProposal[]));
        }
      } catch (err) {
        const updated = markFailed(composerJob.id, String(err));
        if (updated) try { updateJob(updated); } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }
      }

      // Compute real metrics
      let metrics: StrategicMetrics | null = null;
      try {
        const syntheticAnswer: WorksheetAnswer = {
          id: 'synthetic',
          worksheetId: 'all',
          projectId: project.id,
          version: 1,
          answers: mergedAnswerRecord,
          confidence: {},
          updatedAt: new Date().toISOString(),
        };
        metrics = computeStrategicMetrics(project.id, syntheticAnswer, defaultScoringWeights(project.id));
      } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }

      const totalFindings = reports.reduce((sum, r) => sum + (r.findings?.length ?? 0), 0);
      analysisResults.push({
        projectId: project.id,
        projectName: project.name,
        findings: totalFindings,
        proposals: proposalCount,
        metrics,
        jobIds,
      });

      push(`  ${project.name}: ${totalFindings} findings, ${proposalCount} proposals, SAC=${metrics?.strategicAdvantageComposite?.toFixed(0) ?? 0}`);
    }

    // ── Step 4: Generate prompt packets ───────────────────────────────────────
    push('Step 4: Generating Antigravity prompt packets...');

    const promptPackets: Array<{
      projectName: string;
      promptForAntigravity: string;
    }> = [];

    for (const ar of analysisResults) {
      if (ar.findings === 0 && ar.proposals === 0) continue;

      const packet = generateAntigravityPrompt(ar.projectName, ar.findings, ar.proposals, ar.metrics);
      promptPackets.push({ projectName: ar.projectName, promptForAntigravity: packet });
    }

    push(`Generated ${promptPackets.length} prompt packets for Antigravity`);

    // ── Done ──────────────────────────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    push(`Pipeline complete in ${elapsed}s`);

    // Save results for GET endpoints
    cachedResults = {
      timestamp: new Date().toISOString(),
      elapsed: `${elapsed}s`,
      findings: allFindings,
      proposals: allProposals,
      promptPackets,
    };

    // Persist run to DB history
    try {
      insertPipelineRun({
        timestamp: cachedResults.timestamp,
        elapsed: `${elapsed}s`,
        projects_scanned: scanData.projects.length,
        total_findings: allFindings.length,
        total_proposals: allProposals.length,
        total_prompts: promptPackets.length,
        summary: JSON.stringify({
          projectNames: projects.map(p => p.name),
          byProject: analysisResults.map(a => ({ id: a.projectId, f: a.findings, p: a.proposals })),
        }),
      });
    } catch (e) { console.warn('[CS-Pipeline] DB history write failed:', e); }

    res.json({
      ok: true,
      data: {
        mode: useGemini ? 'gemini' : 'offline',
        elapsed: `${elapsed}s`,
        projectsScanned: scanData.projects.length,
        projectsAnalyzed: projects.length,
        worksheetsFilled: worksheetResults,
        analysis: analysisResults.map(({ metrics: _m, ...rest }) => rest),
        promptPackets,
        stats: getQueueStats(),
        log,
      },
    });
  } catch (err) {
    push(`FATAL: ${String(err)}`);
    res.status(500).json({ ok: false, error: String(err), log });
  } finally {
    // Always clean up the offline flag
    delete process.env._CS_FORCE_OFFLINE;
  }
});

/**
 * Build scoring keys from filesystem analysis.
 * These are the specific answer keys that the scoring engine reads.
 */
function buildScoringKeys(projectPath: string, stack: string[]): Record<string, number> {

  const exists = (p: string) => fs.existsSync(path.join(projectPath, p));
  const readFile = (p: string) => { try { return fs.readFileSync(path.join(projectPath, p), 'utf-8'); } catch { return ''; } };

  const readme = readFile('README.md').toLowerCase();
  const pkgJson = readFile('package.json');

  // Architecture signals
  const hasTests = exists('tests') || exists('__tests__') || exists('test') || exists('spec');
  const hasCI = exists('.github/workflows') || exists('.gitlab-ci.yml');
  const hasMonorepo = exists('pnpm-workspace.yaml') || exists('nx.json') || exists('lerna.json');
  const hasDocker = exists('Dockerfile') || exists('docker-compose.yml');
  const hasTypeScript = exists('tsconfig.json');
  const hasLinting = exists('.eslintrc.js') || exists('.eslintrc.json') || exists('biome.json');
  const hasSrc = exists('src');

  // Observability
  const hasLogging = readme.includes('log') || readme.includes('monitor') || readme.includes('telemetry');

  // Data signals
  const hasDB = readme.includes('database') || readme.includes('postgres') || readme.includes('sqlite') ||
    readme.includes('mongo') || pkgJson.includes('prisma') || pkgJson.includes('knex') || pkgJson.includes('sequelize');
  const hasPipeline = readme.includes('pipeline') || readme.includes('etl') || readme.includes('ingestion');

  // Business signals
  const hasAPI = hasSrc || exists('api') || exists('routes') || exists('endpoints');
  const hasAuth = readme.includes('auth') || readme.includes('login') || readme.includes('session') || pkgJson.includes('passport') || pkgJson.includes('jwt');
  const hasPayment = readme.includes('payment') || readme.includes('stripe') || readme.includes('subscription');

  // Connected strategy signals
  const hasNotifications = readme.includes('notification') || readme.includes('alert') || readme.includes('email');
  const hasRecommendations = readme.includes('recommend') || readme.includes('suggest') || readme.includes('curated');
  const hasAutomation = readme.includes('automat') || readme.includes('cron') || readme.includes('schedule') || hasCI;

  // Count source files for richness estimation
  let fileCount = 0;
  try {
    const countFiles = (dir: string, depth = 0): number => {
      if (depth > 3) return 0;
      let c = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '__pycache__' || e.name === 'dist') continue;
        if (e.isDirectory()) c += countFiles(path.join(dir, e.name), depth + 1);
        else c++;
      }
      return c;
    };
    fileCount = countFiles(projectPath);
  } catch (e) { console.warn('[CS-Pipeline] DB write failed:', e); }

  // Scale factor based on project size
  const sizeFactor = Math.min(fileCount / 500, 1); // 0-1 scale, 500 files = mature

  return {
    // Score 1: Connected Experience (0-100)
    ce_respond_to_desire: hasAPI ? 40 + (hasAuth ? 20 : 0) : 10,
    ce_curated_offering: hasRecommendations ? 55 : 15,
    ce_coach_behavior: hasNotifications ? 45 : 10,
    ce_automatic_execution: hasAutomation ? 50 : (hasCI ? 30 : 5),

    // Score 2: Closed Loop Maturity
    clm_sense_quality: hasLogging ? 50 : (hasSrc ? 25 : 5),
    clm_transmit_coverage: hasPipeline ? 55 : (hasDB ? 35 : 10),
    clm_analyze_depth: hasDB ? 40 : 10,
    clm_react_speed: hasCI ? 45 : (hasDocker ? 30 : 10),

    // Score 3: Switching Cost Index
    sci_data_lock: hasDB ? 50 : (hasAuth ? 30 : 5),
    sci_habit_formation: Math.round(sizeFactor * 60),
    sci_integration_depth: hasAPI ? 45 : 10,
    sci_network_effect: hasAuth ? 30 : 5,

    // Score 4: WTP Uplift
    wtp_value_perception: Math.round(30 + sizeFactor * 40),
    wtp_pain_resolution: hasAPI && hasDB ? 50 : 20,
    wtp_convenience_delta: hasAutomation ? 55 : 20,

    // Score 5: Cost Reduction
    cr_automation_coverage: hasCI ? 50 : (hasDocker ? 35 : 10),
    cr_manual_ops_reduction: hasAutomation ? 55 : 15,
    cr_support_burden_reduction: hasNotifications ? 40 : 10,

    // Score 6: Competitive Positioning
    cp_internal_fit: hasMonorepo ? 65 : (hasSrc ? 40 : 15),
    cp_external_fit: hasAPI && hasAuth ? 50 : 20,
    cp_dynamic_fit: hasCI ? 45 : (hasDocker ? 30 : 10),
    cp_differentiation_clarity: Math.round(20 + sizeFactor * 35),

    // Score 7: Business Model Strength
    bms_revenue_model_clarity: hasPayment ? 60 : 20,
    bms_moat_depth: hasDB && hasAuth ? 45 : 15,
    bms_scalability: hasDocker ? 55 : (hasMonorepo ? 45 : 20),
    bms_customer_relationship_depth: hasAuth ? 40 : 10,

    // Score 8: Data Science Readiness
    dsr_data_availability: hasDB ? 55 : 10,
    dsr_instrumentation_coverage: hasLogging ? 45 : (hasCI ? 30 : 5),
    dsr_modeling_capability: stack.includes('python') ? 45 : 10,
    dsr_rigor_level: hasTests ? 40 : 5,

    // Score 9: Architecture Resilience
    ar_modularity: hasMonorepo ? 75 : (hasTypeScript ? 55 : 25),
    ar_test_coverage: hasTests ? 55 : 5,
    ar_observability: hasLogging ? 50 : (hasCI ? 25 : 5),
    ar_recoverability: hasDocker ? 55 : (hasCI ? 35 : 10),
  };
}

/**
 * Generate an Antigravity-ready prompt from analysis findings.
 */
function generateAntigravityPrompt(
  projectName: string,
  findingsCount: number,
  proposalsCount: number,
  metrics: StrategicMetrics | null,
): string {
  const sac = metrics?.strategicAdvantageComposite?.toFixed(0) ?? '?';
  const ce = metrics?.connectedExperienceScore?.toFixed(0) ?? '?';
  const ar = metrics?.architectureResilience?.toFixed(0) ?? '?';
  const ds = metrics?.dataScienceReadiness?.toFixed(0) ?? '?';
  const bm = metrics?.businessModelStrength?.toFixed(0) ?? '?';

  // Find weakest score for priority
  const scores = metrics ? [
    { name: 'Connected Experience', score: metrics.connectedExperienceScore },
    { name: 'Closed Loop Maturity', score: metrics.closedLoopMaturity },
    { name: 'Switching Cost Index', score: metrics.switchingCostIndex },
    { name: 'WTP Uplift', score: metrics.wtpUpliftIndex },
    { name: 'Cost Reduction', score: metrics.costReductionPotential },
    { name: 'Competitive Positioning', score: metrics.competitivePositioningIndex },
    { name: 'Business Model', score: metrics.businessModelStrength },
    { name: 'Data Science Readiness', score: metrics.dataScienceReadiness },
    { name: 'Architecture Resilience', score: metrics.architectureResilience },
  ].sort((a, b) => a.score - b.score) : [];

  const weakest = scores.slice(0, 3);
  const weakestList = weakest.map(s => `${s.name}: ${s.score.toFixed(0)}/100`).join(', ');

  return `## Connected Strategy Analysis — ${projectName}

**Strategic Advantage Composite: ${sac}/100**
CE:${ce} | AR:${ar} | DS:${ds} | BM:${bm}

**Analysis Summary:**
- ${findingsCount} strategic findings identified
- ${proposalsCount} improvement proposals generated
- Weakest areas: ${weakestList || 'N/A'}

**Priority improvements for Antigravity:**
${weakest.map((s, i) => `${i + 1}. Improve **${s.name}** (currently ${s.score.toFixed(0)}/100) — focus on the specific sub-metrics that score lowest.`).join('\n')}

**Instructions for Antigravity:**
Review the project at its path and implement improvements targeting the weak scores above.
Focus on changes that directly raise the metric values through observable code/architecture changes.
After implementing, the Connected Strategy platform will automatically re-score.`;
}

/**
 * Normalize project name to a consistent ID.
 * Always uses underscores, never hyphens, to avoid duplicates.
 */
function normalizeProjectId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Remove duplicate projects from the DB.
 * Keeps the version with underscore ID (canonical) and deletes hyphen variants.
 */
function cleanDuplicateProjects(): void {
  const projects = listProjects();
  const byPath = new Map<string, Array<{ id: string; path: string }>>();
  for (const p of projects) {
    const entries = byPath.get(p.path) ?? [];
    entries.push({ id: p.id, path: p.path });
    byPath.set(p.path, entries);
  }

  // For each path with multiple IDs, keep the underscore version
  for (const [, entries] of byPath) {
    if (entries.length <= 1) continue;
    const canonical = entries.find(e => e.id.includes('_'))?.id ?? entries[0].id;
    for (const entry of entries) {
      if (entry.id !== canonical) {
        deleteProject(entry.id);
      }
    }
  }
}

/** GET /api/pipeline/proposals — returns cached proposals from last run */
router.get('/proposals', (_req: Request, res: Response) => {
  if (!cachedResults) {
    res.json({ ok: true, data: [], message: 'No pipeline run yet. POST /api/pipeline/run-full first.' });
    return;
  }
  res.json({ ok: true, data: cachedResults.proposals, timestamp: cachedResults.timestamp });
});

/** GET /api/pipeline/findings — returns cached findings from last run */
router.get('/findings', (_req: Request, res: Response) => {
  if (!cachedResults) {
    res.json({ ok: true, data: [], message: 'No pipeline run yet.' });
    return;
  }
  res.json({ ok: true, data: cachedResults.findings, timestamp: cachedResults.timestamp });
});

/** GET /api/pipeline/prompts — returns cached prompt packets from last run */
router.get('/prompts', (_req: Request, res: Response) => {
  if (!cachedResults) {
    res.json({ ok: true, data: [], message: 'No pipeline run yet.' });
    return;
  }
  res.json({ ok: true, data: cachedResults.promptPackets, timestamp: cachedResults.timestamp });
});

/** GET /api/pipeline/last-run — returns summary of last pipeline run */
router.get('/last-run', (_req: Request, res: Response) => {
  if (!cachedResults) {
    res.json({ ok: true, data: null });
    return;
  }
  res.json({
    ok: true,
    data: {
      timestamp: cachedResults.timestamp,
      elapsed: cachedResults.elapsed,
      totalFindings: cachedResults.findings.length,
      totalProposals: cachedResults.proposals.length,
      totalPromptPackets: cachedResults.promptPackets.length,
    },
  });
});

/** GET /api/pipeline/history — returns persisted pipeline run history */
router.get('/history', (_req: Request, res: Response) => {
  try {
    const runs = listPipelineRuns(50);
    res.json({ ok: true, data: runs });
  } catch (err) {
    res.json({ ok: false, error: String(err), data: [] });
  }
});

export default router;
