/**
 * recon-lead.ts — Recon Crew Lead (Level 1)
 *
 * Coordinates the Recon crew: Portfolio Scanner + Competitive Intel.
 * Responsibilities:
 * - Cache invalidation: decides if re-scan is needed based on file timestamps
 * - Data quality gate: validates scan output before passing to Analysis crew
 * - Portal health check: monitors data source freshness
 */
import type { AgentRunner, AgentResult, AnalystReport } from '../types.js';

export interface ReconLeadInput {
  projectId: string;
  lastScanAt?: string;         // ISO timestamp of last portfolio scan
  currentProjects?: number;    // Projects found in last scan
  staleThresholdHours?: number; // How old before requiring re-scan (default: 2h)
}

export interface ReconLeadOutput {
  decision: 'use-cache' | 'rescan' | 'partial-rescan';
  reason: string;
  staleDimensions: string[];
  dataQualityGate: 'pass' | 'warn' | 'fail';
  report: AnalystReport;
}

export const runReconLead: AgentRunner<ReconLeadInput, ReconLeadOutput> = async (
  input,
  context,
) => {
  const start = Date.now();
  const { projectId, lastScanAt, currentProjects = 0, staleThresholdHours = 2 } = input;

  let decision: ReconLeadOutput['decision'] = 'rescan';
  let reason = 'No scan data available — initiating fresh scan.';
  const staleDimensions: string[] = [];

  if (lastScanAt) {
    const scanAge = (Date.now() - new Date(lastScanAt).getTime()) / (1000 * 60 * 60);
    if (scanAge < staleThresholdHours) {
      decision = 'use-cache';
      reason = `Scan realizado hace ${scanAge.toFixed(1)}h — dentro del umbral (${staleThresholdHours}h). Usando caché.`;
    } else {
      decision = 'rescan';
      reason = `Scan obsoleto (${scanAge.toFixed(1)}h > umbral ${staleThresholdHours}h). Re-escanear.`;
      staleDimensions.push('portfolio-scanner', 'competitive-intel-agent');
    }
  }

  const dataQualityGate: ReconLeadOutput['dataQualityGate'] =
    currentProjects === 0 ? 'fail' :
    currentProjects < 3 ? 'warn' : 'pass';

  const report: AnalystReport = {
    projectId,
    agentId: 'recon-lead',
    findings: [{
      category: 'Recon Decision',
      title: `Decisión de escaneo: ${decision.toUpperCase()}`,
      detail: reason,
      evidence: [`recon-lead:decision:${decision}`, lastScanAt ? `last-scan:${lastScanAt}` : 'no-prior-scan'],
      impactOnWTP: 'neutral',
      impactOnCost: 'neutral',
      impactOnSwitchingCosts: 'neutral',
      loopPhase: 'Sense',
      severity: dataQualityGate === 'fail' ? 'high' : 'low',
    }],
    summaryNarrative: `Recon Lead: ${reason} Data quality gate: ${dataQualityGate.toUpperCase()}.`,
    recommendedProposals: [],
    analyzedAt: new Date().toISOString(),
  };

  return {
    agentId: 'recon-lead',
    jobId: context.jobId,
    success: true,
    data: { decision, reason, staleDimensions, dataQualityGate, report } satisfies ReconLeadOutput,
    evidence: [`recon-lead:${decision}`, `quality-gate:${dataQualityGate}`],
    durationMs: Date.now() - start,
    completedAt: new Date().toISOString(),
  };
};
