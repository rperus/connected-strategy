export type KnowledgeSourceType =
  | 'wharton_core'
  | 'wharton_worksheet'
  | 'module_design'
  | 'business_plan'
  | 'custom';

export interface KnowledgeSource {
  id: string;
  path: string;
  type: KnowledgeSourceType;
  title: string;
  description?: string;
  indexed: boolean;
  indexedAt?: string;
  /** Worksheet IDs this source maps to */
  worksheetIds?: string[];
  /** Lower = higher priority */
  priority?: number;
  chunkCount?: number;
}

export interface KnowledgeIndex {
  version: string;
  sources: KnowledgeSource[];
  lastFullScan: string;
  totalChunks: number;
  readyForFts: boolean;
}

export interface KnowledgeChunk {
  id: string;           // e.g. "wharton_connected_strategy::chunk_003"
  sourceId: string;
  worksheetIds: string[];
  sectionTitle?: string;
  content: string;      // raw text, max ~600 tokens
  startLine?: number;
  endLine?: number;
  loopPhase?: string;   // Sense | Transmit | Analyze | React | Repeat
  keywords?: string[];
  createdAt: string;
}

export interface IngestionResult {
  sourceId: string;
  success: boolean;
  chunksProduced: number;
  errorMessage?: string;
  durationMs: number;
  indexedAt: string;
}

export interface BusinessPlanSource {
  id: string;
  title: string;
  path: string;
  projectId: string;
  addedAt: string;
  indexed: boolean;
}
