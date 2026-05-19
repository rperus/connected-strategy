import type { SwarmFinding } from './agents/swarm/schema.js';

export class SharedFindingsStore {
  private findings: Array<SwarmFinding> = [];
  private listeners: Array<(finding: SwarmFinding) => void> = [];

  publish(finding: SwarmFinding): void {
    this.findings.push(finding);
    for (const listener of this.listeners) {
      try {
        listener(finding);
      } catch (err) {
        console.error('[SharedFindingsStore] listener error:', err);
      }
    }
  }

  getAll(): SwarmFinding[] {
    return [...this.findings];
  }

  subscribe(listener: (finding: SwarmFinding) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
