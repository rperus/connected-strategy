import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import type { AgentContext, AgentResult } from '../types.js';
import type { MoveManifest } from '../v3/handoff/manifest-builder.js';
import { getGeminiProvider } from '../llm-provider.js';

const execAsync = promisify(exec);

/**
 * W0-1 SECURITY: Safe git runner using spawn with array args.
 * Never interpolates user data into shell strings — prevents command injection.
 */
function runGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`git ${args[0]} failed (exit ${code}): ${stderr.trim()}`));
    });
  });
}

export async function runAutonomousExecutor(
  input: { projectId: string; projectPath: string; moveId: string },
  ctx: AgentContext & { log?: (msg: string) => void; emitTelemetry?: (evt: any) => void }
): Promise<AgentResult<{ success: boolean; message: string; branch?: string; tmpDir?: string; diff?: string; validationLog?: string }>> {
  const startMs = Date.now();
  const log = ctx.log || console.log;
  log(`[autonomous-executor] Starting auto-execution for ${input.projectId} / ${input.moveId}`);

  const handoffDir = path.join('data', 'projects', input.projectId, 'antigravity', input.moveId);
  const llm = getGeminiProvider();
  
  if (!llm.available) {
    return {
      agentId: 'autonomous-executor',
      jobId: ctx.jobId,
      success: false,
      errorMessage: 'LLM provider is required for autonomous execution',
      durationMs: Date.now() - startMs,
      evidence: [],
      completedAt: new Date().toISOString()
    };
  }

  // 1. Check if manifest exists
  let manifest: MoveManifest;
  let promptMd: string;
  try {
    const manifestContent = await fs.readFile(path.join(handoffDir, 'manifest.json'), 'utf-8');
    manifest = JSON.parse(manifestContent);
    promptMd = await fs.readFile(path.join(handoffDir, 'prompt.md'), 'utf-8');
  } catch (err) {
    return {
      agentId: 'autonomous-executor',
      jobId: ctx.jobId,
      success: false,
      errorMessage: `Handoff files not found for move ${input.moveId}. Run Phase G first.`,
      durationMs: Date.now() - startMs,
      evidence: [],
      completedAt: new Date().toISOString()
    };
  }

  // 2. Clone to temporary workspace
  const tmpDir = path.join('data', 'tmp', `${input.projectId}-${input.moveId}`);
  log(`[autonomous-executor] Creating workspace at ${tmpDir}`);
  
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch (e) {} // ignore
  
  await fs.cp(input.projectPath, tmpDir, { 
    recursive: true, 
    filter: (src) => !src.includes('node_modules')
  });

  // 3. Init git and create branch
  const branchName = `cs/auto-${input.moveId}-${Date.now()}`;
  await runGit(['checkout', '-b', branchName], tmpDir); // W0-1: safe spawn, no shell injection

  // 4. Execute edits via LLM
  log(`[autonomous-executor] Implementing ${manifest.files_to_edit.length} edits and ${manifest.files_to_create.length} creations...`);
  
  for (const file of manifest.files_to_create) {
    log(`  - Creating ${file.path}`);
    const llmPrompt = `
      You are an autonomous worker agent. 
      Task: Create file ${file.path}
      Purpose: ${file.purpose}
      Overall Context:
      ${promptMd}
      
      Respond with ONLY the raw file content, nothing else. No markdown blocks.
    `;
    const response = await llm.generate(llmPrompt);
    const newContent = response.text;
    const fullPath = path.join(tmpDir, file.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, newContent.replace(/^```[a-z]*\n|```$/g, ''));
  }

  for (const file of manifest.files_to_edit) {
    log(`  - Editing ${file.path}`);
    const fullPath = path.join(tmpDir, file.path);
    let originalContent = '';
    try {
      originalContent = await fs.readFile(fullPath, 'utf-8');
    } catch (e) {
      log(`    Warning: ${file.path} not found. Skipping edit.`);
      continue;
    }
    
    const llmPrompt = `
      You are an autonomous worker agent.
      Task: Edit file ${file.path}
      Requested Change: ${file.change}
      Overall Context:
      ${promptMd}
      
      Original File Content:
      ${originalContent}
      
      Respond with the ENTIRE updated file content, nothing else. No markdown blocks.
    `;
    const response = await llm.generate(llmPrompt);
    const newContent = response.text;
    await fs.writeFile(fullPath, newContent.replace(/^```[a-z]*\n|```$/g, ''));
  }

  // 5. Diff & Commit changes
  let diff = '';
  try {
    diff = await runGit(['diff'], tmpDir); // W0-1: safe
    await runGit(['add', '.'], tmpDir);
    // W0-1 SECURITY: manifest.title passed as array arg — not interpolated into shell string
    await runGit(['commit', '-m', `feat(cs-auto): ${manifest.title}`], tmpDir);
  } catch (err) {
    log(`[autonomous-executor] Git commit failed (maybe no changes?)`);
  }

  // 6. Validation (Post-edit typecheck)
  log(`[autonomous-executor] Running validation (pnpm install && typecheck)...`);
  let validationPassed = true;
  let validationLog = '';
  try {
    // Only run if package.json exists
    if (await fs.stat(path.join(tmpDir, 'package.json')).catch(() => null)) {
      const { stdout } = await execAsync(`pnpm install && pnpm typecheck`, { cwd: tmpDir, timeout: 120000 });
      validationLog = stdout;
    }
  } catch (err: any) {
    validationPassed = false;
    validationLog = err.message || String(err);
    log(`[autonomous-executor] Validation failed. Changes will NOT be pushed.`);
  }

  // 7. HITL Gate — require human approval before pushing to remote
  // W1-12: LLM06 OWASP — autonomous executor must not push without human review.
  // Instead of auto-pushing, we return a 'pending_review' status with the branch name.
  // A human must explicitly call the confirm endpoint (or set CS_AUTO_PUSH=true for CI).
  if (validationPassed) {
    const autoApproved = process.env.CS_AUTO_PUSH === 'true';
    if (autoApproved) {
      log(`[autonomous-executor] CS_AUTO_PUSH=true — pushing to origin (CI mode)...`);
      try {
        // W0-1 SECURITY: branchName passed as array arg — not interpolated into shell string
        await runGit(['push', '-u', 'origin', branchName], tmpDir);
        log(`[autonomous-executor] Create PR at: https://github.com/pulls (simulate)`);
      } catch (err) {
        log(`[autonomous-executor] Git push failed. (No remote origin or permissions issue)`);
      }
    } else {
      log(`[autonomous-executor] Validation passed. Awaiting human approval before push.`);
      log(`[autonomous-executor] Branch ready for review: ${branchName}`);
      log(`[autonomous-executor] To push: set CS_AUTO_PUSH=true or manually run: git push -u origin ${branchName}`);
    }
  }

  // 8. Cleanup (Optionally keep if validation failed to debug)
  if (validationPassed) {
    log(`[autonomous-executor] Cleaning up temporary workspace...`);
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  log(`[autonomous-executor] Execution complete.`);

  return {
    agentId: 'autonomous-executor',
    jobId: ctx.jobId,
    success: validationPassed,
    data: {
      success: validationPassed,
      message: validationPassed ? `Applied changes and pushed branch ${branchName}.` : `Validation failed.`,
      branch: branchName,
      diff,
      validationLog,
      tmpDir: validationPassed ? undefined : tmpDir
    },
    durationMs: Date.now() - startMs,
    evidence: [tmpDir],
    completedAt: new Date().toISOString()
  };
}
