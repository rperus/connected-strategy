import { getHistoricalRuns } from '../db/index.js';
import type { TemporalTrend, TemporalAnalystOutput } from '../state-types.js';
import { EventHub } from "../hub/event-hub.js";

export function registerTemporalAnalyst(hub: EventHub, ctx: any): void {
    hub.subscribe('RUN_TEMPORAL_ANALYST', async (event) => {
          ctx.emitTelemetry({ type: 'agent_started', agentId: 'temporal-analyst', message: 'Starting temporal memory analysis...' });

    let history;
    try {
    history = getHistoricalRuns(event.projectId);
    } catch (err) {
    ctx.emitTelemetry({ type: 'agent_finished', agentId: 'temporal-analyst', message: 'SQLite history unavailable or empty.' });
    await hub.publish({
      domain: 'lifecycle',
      type: 'TEMPORAL_ANALYST_COMPLETED',
      projectId: event.projectId,
      payload: { success: true, data: { totalRunsAnalyzed: 0, trends: [], regressions: [] } },
      timestamp: Date.now()
    });
    return;
    }

    if (history.length < 2) {
    ctx.emitTelemetry({ type: 'agent_finished', agentId: 'temporal-analyst', message: 'Not enough history to detect trends.' });
    await hub.publish({
      domain: 'lifecycle',
      type: 'TEMPORAL_ANALYST_COMPLETED',
      projectId: event.projectId,
      payload: { success: true, data: { totalRunsAnalyzed: history.length, trends: [], regressions: [] } },
      timestamp: Date.now()
    });
    return;
    }

    let totalHealthDelta = 0;
    let totalResolved = 0;
    let recentFails = 0;

    // Analyze up to 10 recent runs
    const recentRuns = history.slice(0, 10);

    for (const run of recentRuns) {
    totalHealthDelta += run.healthScoreDelta || 0;
    totalResolved += run.resolvedPriorities || 0;
    if (run.status === 'failed') recentFails++;
    }

    const trends: TemporalTrend[] = [];
    const regressions: string[] = [];

    if (totalHealthDelta < -5) {
    trends.push({ metric: 'healthScore', direction: 'down', significance: 'high', description: 'Significant deterioration in project health score over recent runs.' });
    regressions.push('Health score is dropping consistently.');
    } else if (totalHealthDelta > 5) {
    trends.push({ metric: 'healthScore', direction: 'up', significance: 'high', description: 'Strong positive trend in project health.' });
    } else {
    trends.push({ metric: 'healthScore', direction: 'flat', significance: 'low', description: 'Health score is relatively stable.' });
    }

    const avgResolved = totalResolved / recentRuns.length;
    if (avgResolved > 2) {
    trends.push({ metric: 'velocity', direction: 'up', significance: 'high', description: 'High velocity of resolving priorities.' });
    }

    if (recentFails >= 3) {
    trends.push({ metric: 'errorRate', direction: 'up', significance: 'high', description: 'Pipeline instability detected. Multiple recent failures.' });
    regressions.push('Agent pipeline is failing frequently.');
    }

    ctx.emitTelemetry({ type: 'agent_finished', agentId: 'temporal-analyst', message: `Found ${trends.length} trends and ${regressions.length} regressions across ${recentRuns.length} runs.` });

    await hub.publish({
      domain: 'lifecycle',
      type: 'TEMPORAL_ANALYST_COMPLETED',
      projectId: event.projectId,
      payload: { success: true, data: { totalRunsAnalyzed: history.length, trends, regressions } },
      timestamp: Date.now()
    });
    });
}
