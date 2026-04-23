/**
 * @cs/agents — portfolio-scanner.ts
 *
 * Discovers and classifies projects under a root directory (default: C:\dev).
 * This is a deterministic filesystem scan — no LLM required.
 * 
 * Loop phase: Sense (detecting what exists in the portfolio)
 */

import fs from 'node:fs';
import path from 'node:path';
import type { AgentContext, AgentResult, PortfolioScanResult, ScanEntry } from '../types.js';
import type { AgentId } from '../types.js';

const AGENT_ID: AgentId = 'portfolio-scanner';

// ─── Stack Detection Heuristics ───────────────────────────────────────────────

function detectStack(dirPath: string): string[] {
  const stack: string[] = [];

  const check = (filename: string, label: string): void => {
    if (fs.existsSync(path.join(dirPath, filename))) stack.push(label);
  };

  check('package.json', 'node');
  check('tsconfig.json', 'typescript');
  check('pyproject.toml', 'python');
  check('requirements.txt', 'python');
  check('Cargo.toml', 'rust');
  check('go.mod', 'go');
  check('pom.xml', 'java-maven');
  check('build.gradle', 'java-gradle');
  check('Dockerfile', 'docker');
  check('docker-compose.yml', 'docker-compose');
  check('docker-compose.yaml', 'docker-compose');
  check('.github', 'github-actions');
  check('next.config.js', 'nextjs');
  check('next.config.ts', 'nextjs');
  check('vite.config.ts', 'vite');
  check('vite.config.js', 'vite');
  check('electron-builder.yml', 'electron');
  check('pnpm-workspace.yaml', 'pnpm-monorepo');

  // Check package.json for framework hints
  const pkgPath = path.join(dirPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      const deps = {
        ...(pkg.dependencies as Record<string, string> ?? {}),
        ...(pkg.devDependencies as Record<string, string> ?? {}),
      };
      if ('react' in deps) stack.push('react');
      if ('vue' in deps) stack.push('vue');
      if ('svelte' in deps) stack.push('svelte');
      if ('express' in deps) stack.push('express');
      if ('fastify' in deps) stack.push('fastify');
      if ('prisma' in deps || '@prisma/client' in deps) stack.push('prisma');
      if ('electron' in deps) stack.push('electron');
    } catch {
      // malformed package.json — skip
    }
  }

  return [...new Set(stack)];
}

function detectMaturity(dirPath: string, fileCount: number): ScanEntry['maturity'] {
  const hasTests =
    fs.existsSync(path.join(dirPath, 'tests')) ||
    fs.existsSync(path.join(dirPath, '__tests__')) ||
    fs.existsSync(path.join(dirPath, 'test'));

  const hasCI =
    fs.existsSync(path.join(dirPath, '.github')) ||
    fs.existsSync(path.join(dirPath, '.gitlab-ci.yml'));

  const hasReadme = fs.existsSync(path.join(dirPath, 'README.md'));

  if (fileCount > 200 && hasTests && hasCI) return 'mature';
  if (fileCount > 50 && hasReadme) return 'developing';
  if (fileCount < 10) return 'nascent';
  return 'developing';
}

function countFiles(dirPath: string, maxDepth = 3, depth = 0): number {
  if (depth > maxDepth) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__') continue;
      if (entry.isDirectory()) {
        count += countFiles(path.join(dirPath, entry.name), maxDepth, depth + 1);
      } else {
        count++;
      }
    }
  } catch {
    // access error — skip
  }
  return count;
}

function detectTags(dirPath: string, stack: string[]): string[] {
  const tags: string[] = [];
  if (stack.includes('pnpm-monorepo')) tags.push('monorepo');
  if (stack.includes('electron')) tags.push('desktop');
  if (stack.includes('react') || stack.includes('vue') || stack.includes('nextjs')) tags.push('frontend');
  if (stack.includes('express') || stack.includes('fastify')) tags.push('backend-api');
  if (stack.includes('python')) tags.push('python');
  if (stack.includes('docker') || stack.includes('docker-compose')) tags.push('containerized');
  if (fs.existsSync(path.join(dirPath, 'CURRENT_STATE.md'))) tags.push('active-project');
  if (fs.existsSync(path.join(dirPath, 'pnpm-workspace.yaml'))) tags.push('cs-platform');
  return tags;
}

// ─── Scanner Entry ────────────────────────────────────────────────────────────

function scanDirectory(rootPath: string): ScanEntry[] {
  const entries: ScanEntry[] = [];

  if (!fs.existsSync(rootPath)) return entries;

  let topLevel: fs.Dirent[];
  try {
    topLevel = fs.readdirSync(rootPath, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const dirent of topLevel) {
    if (!dirent.isDirectory()) continue;
    if (dirent.name.startsWith('.')) continue;

    const dirPath = path.join(rootPath, dirent.name);
    const stack = detectStack(dirPath);

    // Skip if it looks like a plain data or temp directory
    if (stack.length === 0) {
      // Still include if it has a recognizable structure
      const hasRecognizable = fs.existsSync(path.join(dirPath, 'README.md')) ||
        fs.existsSync(path.join(dirPath, 'src'));
      if (!hasRecognizable) continue;
    }

    const fileCount = countFiles(dirPath);
    const maturity = detectMaturity(dirPath, fileCount);
    const tags = detectTags(dirPath, stack);

    entries.push({
      path: dirPath,
      name: dirent.name,
      stack,
      maturity,
      hasPackageJson: fs.existsSync(path.join(dirPath, 'package.json')),
      hasPyproject: fs.existsSync(path.join(dirPath, 'pyproject.toml')),
      hasGit: fs.existsSync(path.join(dirPath, '.git')),
      fileCount,
      tags,
      detectedAt: new Date().toISOString(),
    });
  }

  return entries;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runPortfolioScanner(
  input: { scanPath?: string },
  context: AgentContext,
): Promise<AgentResult<PortfolioScanResult>> {
  const startMs = Date.now();
  const scanPath = input.scanPath ?? 'C:\\dev';

  try {
    const projects = scanDirectory(scanPath);

    const result: PortfolioScanResult = {
      scanPath,
      projects,
      scannedAt: new Date().toISOString(),
      totalFound: projects.length,
    };

    return {
      agentId: AGENT_ID,
      jobId: context.jobId,
      success: true,
      data: result,
      durationMs: Date.now() - startMs,
      evidence: [`filesystem:${scanPath}`],
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
