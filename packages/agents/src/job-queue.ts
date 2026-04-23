/**
 * @cs/agents — job-queue.ts
 *
 * In-memory AnalysisJob queue with full CRUD.
 * Jobs are persisted only in-process (Wave 2 scope).
 * SQLite persistence is a planned extension for Wave 3.
 *
 * This is a pure state module — no express, no routing.
 */

import { randomUUID } from 'node:crypto';
import type { AnalysisJob, AgentId } from './types.js';

// ─── In-memory store ──────────────────────────────────────────────────────────

const jobStore = new Map<string, AnalysisJob>();

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function createJob(
  projectId: string,
  agentId: AgentId,
  input: Record<string, unknown> = {},
): AnalysisJob {
  const job: AnalysisJob = {
    id: randomUUID(),
    projectId,
    agentId,
    status: 'queued',
    input,
    createdAt: new Date().toISOString(),
  };
  jobStore.set(job.id, job);
  return job;
}

export function getJob(id: string): AnalysisJob | undefined {
  return jobStore.get(id);
}

export function listJobs(projectId?: string): AnalysisJob[] {
  const all = Array.from(jobStore.values());
  if (projectId) return all.filter((j) => j.projectId === projectId);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listJobsByStatus(status: AnalysisJob['status']): AnalysisJob[] {
  return Array.from(jobStore.values()).filter((j) => j.status === status);
}

export function markRunning(id: string): AnalysisJob | undefined {
  const job = jobStore.get(id);
  if (!job) return undefined;
  const updated: AnalysisJob = {
    ...job,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  jobStore.set(id, updated);
  return updated;
}

export function markDone(id: string, result: AnalysisJob['result']): AnalysisJob | undefined {
  const job = jobStore.get(id);
  if (!job) return undefined;
  const updated: AnalysisJob = {
    ...job,
    status: 'done',
    result,
    completedAt: new Date().toISOString(),
  };
  jobStore.set(id, updated);
  return updated;
}

export function markFailed(id: string, errorMessage: string): AnalysisJob | undefined {
  const job = jobStore.get(id);
  if (!job) return undefined;
  const updated: AnalysisJob = {
    ...job,
    status: 'failed',
    errorMessage,
    completedAt: new Date().toISOString(),
  };
  jobStore.set(id, updated);
  return updated;
}

export function clearJobs(projectId?: string): number {
  if (!projectId) {
    const count = jobStore.size;
    jobStore.clear();
    return count;
  }
  let count = 0;
  for (const [id, job] of jobStore.entries()) {
    if (job.projectId === projectId) {
      jobStore.delete(id);
      count++;
    }
  }
  return count;
}

export function getQueueStats(): {
  total: number;
  queued: number;
  running: number;
  done: number;
  failed: number;
} {
  const all = Array.from(jobStore.values());
  return {
    total: all.length,
    queued: all.filter((j) => j.status === 'queued').length,
    running: all.filter((j) => j.status === 'running').length,
    done: all.filter((j) => j.status === 'done').length,
    failed: all.filter((j) => j.status === 'failed').length,
  };
}
