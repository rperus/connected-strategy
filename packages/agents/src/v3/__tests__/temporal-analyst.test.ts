import test from 'node:test';
import assert from 'node:assert';
import { registerTemporalAnalyst } from '../agents/temporal-analyst.js';
import { EventHub } from '../hub/event-hub.js';
import { ProjectStateStore } from '../state-store.js';

test('Temporal Analyst Tests', async (t) => {
    await t.test('Should fallback to heuristics when python script fails or runs with no data', async () => {
        const store = new ProjectStateStore('./test-store-temp');
        const hub = new EventHub(store);
        const publishedEvents: any[] = [];
        
        hub.subscribe('TEMPORAL_ANALYST_COMPLETED', async (event) => {
            publishedEvents.push(event);
        });
        
        const ctx = {
            emitTelemetry: () => {}
        };
        
        registerTemporalAnalyst(hub, ctx);
        
        // Since we are not mocking DB here, getHistoricalRuns might throw or return empty.
        // It should gracefully handle it.
        await hub.publish({
            domain: 'lifecycle',
            type: 'RUN_TEMPORAL_ANALYST',
            projectId: 'test-project',
            payload: {},
            timestamp: Date.now()
        });

        // Wait for polling outbox
        await new Promise(r => setTimeout(r, 1500));

        assert.strictEqual(publishedEvents.length, 1);
        assert.strictEqual(publishedEvents[0].type, 'TEMPORAL_ANALYST_COMPLETED');
        assert.strictEqual(publishedEvents[0].payload.success, true);
    });
});
