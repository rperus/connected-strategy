import { parentPort, workerData } from 'worker_threads';

// Worker to perform CPU-intensive grouping without blocking the event loop
const { findings1, findings2 } = workerData;

try {
  const agents = Array.from(new Set([
    ...findings1.map((f: any) => f.agent ?? f.category),
    ...findings2.map((f: any) => f.agent ?? f.category)
  ]));

  const comparison = agents.map(agent => ({
    agent,
    project1: findings1.filter((f: any) => (f.agent ?? f.category) === agent),
    project2: findings2.filter((f: any) => (f.agent ?? f.category) === agent)
  }));

  parentPort?.postMessage({ ok: true, comparison });
} catch (err: any) {
  parentPort?.postMessage({ ok: false, error: err.message });
}
