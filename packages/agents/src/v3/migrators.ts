import type { ProjectStateV3 } from './state-types.js';

export function migrateState(raw: unknown): ProjectStateV3 {
  const state = raw as Record<string, unknown>;
  
  if (!state.schemaVersion) {
    throw new Error('Missing schemaVersion in state');
  }

  if (state.schemaVersion !== '3.0.0') {
    // For future 3.1.0 etc migrations
    // e.g. if (state.schemaVersion === '3.0.0') { state = migrate30to31(state); }
  }

  return state as unknown as ProjectStateV3;
}
