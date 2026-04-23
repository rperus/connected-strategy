/**
 * Stack Detector
 *
 * Inspects a repository directory and identifies the technology stack.
 * Supports: Vite/React, Next.js, Node API (Express/Fastify),
 *           Python (FastAPI/Flask/Django), Electron, docker-compose.
 *
 * Worker: SET-05 / SLOT: Chat 2
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { StackDetectionResult, StackType } from './types.js';

interface StackRule {
  stack: StackType;
  indicator: string;
  check: (repoPath: string) => boolean;
  confidence: 'high' | 'medium' | 'low';
  devCommand: string;
  defaultPort: number;
  healthPath?: string;
}

// Ordered from most-specific to most-generic
const RULES: StackRule[] = [
  // ── Electron ──────────────────────────────────────────────────────────────
  {
    stack: 'electron-desktop',
    indicator: 'electron in package.json dependencies',
    check: (p) => hasPackageJsonDep(p, 'electron'),
    confidence: 'high',
    devCommand: 'npm run dev',
    defaultPort: 4312,
    healthPath: undefined,
  },

  // ── Vite/React ────────────────────────────────────────────────────────────
  {
    stack: 'vite-web',
    indicator: 'vite.config.ts or vite.config.js present',
    check: (p) =>
      existsSync(join(p, 'vite.config.ts')) || existsSync(join(p, 'vite.config.js')),
    confidence: 'high',
    devCommand: 'npm run dev',
    defaultPort: 5173,
    healthPath: '/',
  },

  // ── Next.js ───────────────────────────────────────────────────────────────
  {
    stack: 'nextjs-web',
    indicator: 'next.config.js or next.config.mjs present',
    check: (p) =>
      existsSync(join(p, 'next.config.js')) ||
      existsSync(join(p, 'next.config.mjs')) ||
      existsSync(join(p, 'next.config.ts')),
    confidence: 'high',
    devCommand: 'npm run dev',
    defaultPort: 3000,
    healthPath: '/',
  },

  // ── Python API ────────────────────────────────────────────────────────────
  {
    stack: 'python-api',
    indicator: 'pyproject.toml, requirements.txt, or setup.py present',
    check: (p) =>
      existsSync(join(p, 'pyproject.toml')) ||
      existsSync(join(p, 'requirements.txt')) ||
      existsSync(join(p, 'setup.py')),
    confidence: 'high',
    devCommand: 'python -m uvicorn main:app --reload',
    defaultPort: 8000,
    healthPath: '/health',
  },

  // ── Monorepo Node ─────────────────────────────────────────────────────────
  {
    stack: 'monorepo-node',
    indicator: 'pnpm-workspace.yaml or lerna.json present',
    check: (p) =>
      existsSync(join(p, 'pnpm-workspace.yaml')) ||
      existsSync(join(p, 'lerna.json')) ||
      existsSync(join(p, 'turbo.json')),
    confidence: 'high',
    devCommand: 'pnpm dev',
    defaultPort: 3000,
    healthPath: '/api/health',
  },

  // ── Node API ──────────────────────────────────────────────────────────────
  {
    stack: 'node-api',
    indicator: 'express, fastify, or koa in package.json dependencies',
    check: (p) =>
      hasPackageJsonDep(p, 'express') ||
      hasPackageJsonDep(p, 'fastify') ||
      hasPackageJsonDep(p, 'koa'),
    confidence: 'high',
    devCommand: 'npm run dev',
    defaultPort: 3001,
    healthPath: '/health',
  },

  // ── Docker Compose ────────────────────────────────────────────────────────
  {
    stack: 'docker-compose',
    indicator: 'docker-compose.yml or docker-compose.yaml present',
    check: (p) =>
      existsSync(join(p, 'docker-compose.yml')) ||
      existsSync(join(p, 'docker-compose.yaml')),
    confidence: 'medium',
    devCommand: 'docker-compose up',
    defaultPort: 8080,
    healthPath: '/health',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasPackageJsonDep(repoPath: string, pkg: string): boolean {
  const pkgPath = join(repoPath, 'package.json');
  if (!existsSync(pkgPath)) return false;
  try {
    const raw = readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw) as Record<string, unknown>;
    const deps = {
      ...(json.dependencies as Record<string, unknown> | undefined),
      ...(json.devDependencies as Record<string, unknown> | undefined),
    };
    return pkg in deps;
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect the technology stack for a repository at `repoPath`.
 * Returns the first matching rule (most specific), or 'unknown'.
 */
export function detectStack(repoPath: string): StackDetectionResult {
  const indicators: string[] = [];

  for (const rule of RULES) {
    if (rule.check(repoPath)) {
      indicators.push(rule.indicator);
      return {
        stack: rule.stack,
        confidence: rule.confidence,
        indicators,
        devCommand: rule.devCommand,
        defaultPort: rule.defaultPort,
        healthPath: rule.healthPath,
      };
    }
  }

  // Fallback: generic node if package.json exists
  if (existsSync(join(repoPath, 'package.json'))) {
    return {
      stack: 'node-api',
      confidence: 'low',
      indicators: ['package.json found, no specific framework detected'],
      devCommand: 'npm start',
      defaultPort: 3000,
      healthPath: undefined,
    };
  }

  return {
    stack: 'unknown',
    confidence: 'low',
    indicators: ['no recognizable project markers found'],
    devCommand: '',
    defaultPort: 0,
    healthPath: undefined,
  };
}

/**
 * Detect all applicable stacks for a path (for multi-stack monorepos).
 */
export function detectAllStacks(repoPath: string): StackDetectionResult[] {
  const results: StackDetectionResult[] = [];
  for (const rule of RULES) {
    if (rule.check(repoPath)) {
      results.push({
        stack: rule.stack,
        confidence: rule.confidence,
        indicators: [rule.indicator],
        devCommand: rule.devCommand,
        defaultPort: rule.defaultPort,
        healthPath: rule.healthPath,
      });
    }
  }
  return results;
}
