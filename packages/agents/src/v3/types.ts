import type { z } from 'zod';
import type { LLMProvider } from '../llm-provider.js';
import type { ProjectStateStore } from './state-store.js';
import type { FileReader } from './file-reader.js';
import type { TelemetryEvent } from './state-types.js';
import type { SharedFindingsStore } from './shared-findings.js';

export interface AgentV3Context {
  runId: string;
  projectId: string;
  projectPath: string;
  startedAt: string;

  // tools the agent can use
  llm: LLMProvider;                  
  store: ProjectStateStore;          
  fileReader: FileReader;            

  // budget
  maxTokens: number;
  maxToolCalls: number;
  timeoutMs: number;

  // logging / events
  log: (msg: string, data?: unknown) => void;
  emitTelemetry?: (event: Partial<TelemetryEvent>) => void;
  
  // cross-agent memory
  sharedFindings?: SharedFindingsStore;
}

export interface AgentV3Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  durationMs: number;
  llmCalls: number;
  filesRead: string[];
  validationErrors?: string[];
}
