import { getHistoricalRuns } from '../db/index.js';
import type { TemporalTrend, TemporalAnalystOutput } from '../state-types.js';
import { EventHub } from "../hub/event-hub.js";
import { exec } from 'child_process';
import { join } from 'path';

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

        if (history.length === 0) {
            ctx.emitTelemetry({ type: 'agent_finished', agentId: 'temporal-analyst', message: 'Not enough history to detect trends.' });
            await hub.publish({
                domain: 'lifecycle',
                type: 'TEMPORAL_ANALYST_COMPLETED',
                projectId: event.projectId,
                payload: { success: true, data: { totalRunsAnalyzed: 0, trends: [], regressions: [] } },
                timestamp: Date.now()
            });
            return;
        }

        const recentRuns = history.slice(0, 10).reverse(); // Oldest to newest for TS
        
        let totalHealthDelta = 0;
        let totalResolved = 0;
        let recentFails = 0;

        for (const run of recentRuns) {
            totalHealthDelta += run.healthScoreDelta || 0;
            totalResolved += run.resolvedPriorities || 0;
            if (run.status === 'failed') recentFails++;
        }

        const trends: TemporalTrend[] = [];
        const regressions: string[] = [];

        // Try TimesFM Zero-Shot Forecasting
        let timesfmSuccess = false;
        try {
            const inputData = {
                metrics: {
                    healthScoreDelta: recentRuns.map((r: any) => r.healthScoreDelta || 0),
                    resolvedPriorities: recentRuns.map((r: any) => r.resolvedPriorities || 0)
                },
                horizon: 3
            };
            
            // Invoke the python script via uv
            const forecastJson = await new Promise<string>((resolve, reject) => {
                const scriptPath = join(process.cwd(), 'packages', 'agents', 'scripts', 'timesfm-forecast.py');
                const child = exec(`uv run ${scriptPath}`, { 
                    cwd: join(process.cwd(), 'packages', 'agents')
                }, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve(stdout);
                });
                
                if (child.stdin) {
                    child.stdin.write(JSON.stringify(inputData));
                    child.stdin.end();
                }
            });

            const forecastResult = JSON.parse(forecastJson);
            
            if (forecastResult.success && forecastResult.forecasts) {
                timesfmSuccess = true;
                const { healthScoreDelta, resolvedPriorities } = forecastResult.forecasts;
                
                // Analyze forecasted health
                if (healthScoreDelta && healthScoreDelta.length > 0) {
                    const avgForecastedHealth = healthScoreDelta.reduce((a: number, b: number) => a + b, 0) / healthScoreDelta.length;
                    if (avgForecastedHealth < -2) {
                        trends.push({ metric: 'healthScore', direction: 'down', significance: 'high', description: 'TimesFM Zero-Shot predice una caída futura del health score.' });
                        regressions.push('El health score proyectado está en declive.');
                    } else if (avgForecastedHealth > 2) {
                        trends.push({ metric: 'healthScore', direction: 'up', significance: 'high', description: 'TimesFM Zero-Shot predice mejora continua del health score.' });
                    }
                }
            }
        } catch (e) {
            ctx.emitTelemetry({ type: 'agent_started', agentId: 'temporal-analyst', message: 'TimesFM forecast failed, falling back to heuristics.' });
        }

        // Fallback to heuristics if TimesFM didn't yield trends
        if (!timesfmSuccess) {
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
