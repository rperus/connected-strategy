/** Connected Strategy — API Configuration — single source of truth */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4311';

export const api = {
  // Core
  health: `${API_BASE_URL}/api/health`,
  projects: `${API_BASE_URL}/api/projects`,
  projectScan: `${API_BASE_URL}/api/projects/scan`,
  projectById: (id: string) => `${API_BASE_URL}/api/projects/${id}`,
  projectLaunch: (id: string) => `${API_BASE_URL}/api/projects/${id}/launch`,

  // Worksheets (SQLite-persisted)
  worksheetsByProject: (projectId: string) => `${API_BASE_URL}/api/worksheets/${projectId}`,
  worksheetAnswer: (projectId: string, worksheetId: string) =>
    `${API_BASE_URL}/api/worksheets/${projectId}/${worksheetId}`,
  worksheetAutofill: (projectId: string, worksheetId: string) =>
    `${API_BASE_URL}/api/worksheets/${projectId}/${worksheetId}/autofill`,

  // Analysis
  analysis: `${API_BASE_URL}/api/analysis/jobs`,
  analysisStats: `${API_BASE_URL}/api/analysis/stats`,
  analysisAgents: `${API_BASE_URL}/api/analysis/agents`,
  analysisRunAll: `${API_BASE_URL}/api/analysis/run-all`,
  analysisJob: (id: string) => `${API_BASE_URL}/api/analysis/jobs/${id}`,
  analysisRunJob: (id: string) => `${API_BASE_URL}/api/analysis/jobs/${id}/run`,

  // Runtime
  runtimePorts: `${API_BASE_URL}/api/runtime/ports`,
  runtimeStatus: `${API_BASE_URL}/api/runtime/status`,

  // Reports
  reportTemplates: `${API_BASE_URL}/api/reports/templates`,
  reportPortfolio: `${API_BASE_URL}/api/reports/portfolio`,
  reportProject: (id: string) => `${API_BASE_URL}/api/reports/project/${id}`,
  promptPacketGenerate: `${API_BASE_URL}/api/prompt-packets/generate`,

  // Metrics (real computed scores from worksheet answers)
  metrics: `${API_BASE_URL}/api/metrics`,
  metricsForProject: (projectId: string) => `${API_BASE_URL}/api/metrics/${projectId}`,
  // Full pipeline (scan → auto-fill → analyze → prompts)
  pipelineRunFull: `${API_BASE_URL}/api/pipeline/run-full`,
  pipelineProposals: `${API_BASE_URL}/api/pipeline/proposals`,
  pipelineFindings: `${API_BASE_URL}/api/pipeline/findings`,
  pipelinePrompts: `${API_BASE_URL}/api/pipeline/prompts`,
  pipelineLastRun: `${API_BASE_URL}/api/pipeline/last-run`,
  pipelineHistory: `${API_BASE_URL}/api/pipeline/history`,

  // Health dashboard
  healthDashboard: `${API_BASE_URL}/api/health-dashboard`,
  
  // Telemetry
  telemetryStream: `${API_BASE_URL}/api/telemetry/stream`,
  
  // Settings
  settings: `${API_BASE_URL}/api/settings`,
  settingsValidateKey: `${API_BASE_URL}/api/settings/validate-key`,
};
