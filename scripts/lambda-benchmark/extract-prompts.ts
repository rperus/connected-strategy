#!/usr/bin/env npx tsx
/**
 * extract-prompts.ts — Connected Strategy Lambda Benchmark
 *
 * Reads all V3 agent files and extracts their prompt templates into a portable
 * JSON format that can be sent to any OpenAI-compatible API (vLLM on Lambda, etc.)
 *
 * Usage:
 *   npx tsx scripts/lambda-benchmark/extract-prompts.ts
 *   npx tsx scripts/lambda-benchmark/extract-prompts.ts --output prompts.json
 */

import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedPrompt {
  agentId: string;
  agentFile: string;
  phase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  promptTemplate: string;
  expectedSchema: string;
  schemaDescription: string;
  llmConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
  inputPlaceholders: string[];
  worksheets: string[];
  category: 'strategy' | 'swarm' | 'synthesis';
}

interface BenchmarkPromptSet {
  version: string;
  extractedAt: string;
  sourceProject: string;
  totalPrompts: number;
  prompts: ExtractedPrompt[];
  sampleInputs: Record<string, Record<string, string>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AGENTS_DIR = path.resolve('packages/agents/src/v3/agents');
const SWARM_DIR = path.resolve('packages/agents/src/v3/agents/swarm');
const SYNTHESIS_DIR = path.resolve('packages/agents/src/v3/synthesis');

function extractTemplateLiteral(source: string): string | null {
  // Find the prompt template literal (const prompt = `...`)
  const patterns = [
    /const prompt\s*=\s*`([\s\S]*?)`;/,
    /const prompt\s*=\s*`([\s\S]*?)`\s*;/,
    /prompt\s*=\s*`([\s\S]*?)`;/,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractSchema(source: string): string {
  // Find the schema used in callLLMValidated
  const patterns = [
    /callLLMValidated\s*\(\s*(?:ctx\.llm\s*,\s*)?(?:prompt|loopPrompt)\s*,\s*(\w+)/,
    /callLLMValidated\s*\([^,]+,\s*[^,]+,\s*(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1];
  }

  // Check for synthesisSchema usage
  if (source.includes('synthesisSchema')) return 'synthesisSchema';

  return 'unknown';
}

function extractLLMConfig(source: string): { temperature: number; maxOutputTokens: number } {
  const tempMatch = source.match(/temperature:\s*([\d.]+)/);
  const tokensMatch = source.match(/maxOutputTokens:\s*(\d+)/);

  return {
    temperature: tempMatch ? parseFloat(tempMatch[1]) : 0.3,
    maxOutputTokens: tokensMatch ? parseInt(tokensMatch[1]) : 8000,
  };
}

function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\$\{[^}]+\}/g) ?? [];
  return [...new Set(matches.map(m => m.replace(/^\$\{/, '').replace(/\}$/, '')))];
}

function extractImportedSchemas(source: string): string[] {
  const schemas: string[] = [];
  const importMatches = source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@cs\/domain['"]/g);
  for (const m of importMatches) {
    const names = m[1].split(',').map(n => n.trim()).filter(n => n.endsWith('Schema') || n.endsWith('schema'));
    schemas.push(...names);
  }
  return schemas;
}

// ─── Agent Definitions ────────────────────────────────────────────────────────

interface AgentDef {
  file: string;
  agentId: string;
  phase: ExtractedPrompt['phase'];
  category: ExtractedPrompt['category'];
  worksheets: string[];
  schemaDescription: string;
}

const AGENT_DEFS: AgentDef[] = [
  // Phase B — Deep Analysis
  {
    file: 'customer-journey-mapper.ts',
    agentId: 'customer-journey-mapper',
    phase: 'B',
    category: 'strategy',
    worksheets: ['WS01'],
    schemaDescription: 'WS01 Journey Map: 8 stages with underlyingNeed, customerActions, decisionFactors, touchpoints, painPoints, wtpDrivers',
  },
  {
    file: 'info-flow-analyzer.ts',
    agentId: 'info-flow-analyzer',
    phase: 'B',
    category: 'strategy',
    worksheets: ['WS03'],
    schemaDescription: 'WS03 Info Flow: description, trigger, frequency, richness, customerEffort, inferenceParty, improvementIdea per stage',
  },
  {
    file: 'deeper-needs-laddering.ts',
    agentId: 'deeper-needs-laddering',
    phase: 'B',
    category: 'strategy',
    worksheets: ['WS04', 'WS06'],
    schemaDescription: 'WS04 Why-How Ladder (3-5 rungs) + WS06 Repeat Learning level (1-4)',
  },
  {
    file: 'connected-experience-matrix.ts',
    agentId: 'connected-experience-matrix',
    phase: 'B',
    category: 'strategy',
    worksheets: ['WS05', 'WS07', 'WS08'],
    schemaDescription: 'WS05 Response Matrix + WS07 Existing Matrix (5 arch × 4 modes, 20 cells) + WS08 New Ideas (whitespace)',
  },
  {
    file: 'tech-stack-mapper.ts',
    agentId: 'tech-stack-mapper',
    phase: 'B',
    category: 'strategy',
    worksheets: ['WS09', 'WS10', 'WS11'],
    schemaDescription: 'WS09 Subfunction Grid (4 STAR × 9 subs, 36 cells) + WS10 Tech Solutions + WS11 Emerging Tech (TRL)',
  },
  {
    file: 'revenue-model-architect.ts',
    agentId: 'revenue-model-architect',
    phase: 'B',
    category: 'strategy',
    worksheets: ['WS07', 'WS08'],
    schemaDescription: 'Precision pricing 5 levers (WHAT/WHEN/WHO/WHY/CURRENCY) + connection architecture + alternatives',
  },

  // Phase C — Competitive Intelligence
  {
    file: 'industry-structure-analyst.ts',
    agentId: 'industry-structure-analyst',
    phase: 'C',
    category: 'strategy',
    worksheets: ['WS15'],
    schemaDescription: '5 Forces de Porter (with evidence + sourceUrl) + Scenario Analysis',
  },
  {
    file: 'competitor-intelligence.ts',
    agentId: 'competitor-intelligence',
    phase: 'C',
    category: 'strategy',
    worksheets: [],
    schemaDescription: 'CompetitorProfile[] (3-7 competitors, recentMoves with sourceUrl + date)',
  },
  {
    file: 'wtp-cost-driver-scorer.ts',
    agentId: 'wtp-cost-driver-scorer',
    phase: 'C',
    category: 'strategy',
    worksheets: ['WS01', 'WS12'],
    schemaDescription: 'WTP drivers + cost drivers with quantitative scores (-2 to +2) and weights summing to 1',
  },
  {
    file: 'activity-system-mapper.ts',
    agentId: 'activity-system-mapper',
    phase: 'C',
    category: 'strategy',
    worksheets: ['WS01', 'WS07', 'WS08'],
    schemaDescription: 'Activity System Map: coreChoices, supportingActivities, reinforcementMatrix, OE-vs-SP, mermaid diagram',
  },

  // Phase D — Temporal
  {
    file: 'temporal-analyst.ts',
    agentId: 'temporal-analyst',
    phase: 'D',
    category: 'strategy',
    worksheets: [],
    schemaDescription: 'Temporal trends (healthScore, velocity, errorRate direction + significance) + regressions — deterministic, no LLM',
  },

  // Phase F — Synthesis
  {
    file: 'chief-strategist.ts',
    agentId: 'chief-strategist',
    phase: 'F',
    category: 'synthesis',
    worksheets: ['WS01', 'WS04', 'WS06', 'WS07', 'WS08'],
    schemaDescription: 'Strategy Audit: 5 Wharton questions, 3 Fits (internal/external/dynamic), 5 priorities, executive summary, health score',
  },
];

const SWARM_AGENT_DEFS: AgentDef[] = [
  {
    file: 'swarm/security-auditor.ts',
    agentId: 'swarm-security-auditor',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'Security findings: auth, injection, exposed secrets',
  },
  {
    file: 'swarm/api-design-critic.ts',
    agentId: 'swarm-api-design-critic',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'API design findings: REST/GraphQL consistency, error handling, payloads',
  },
  {
    file: 'swarm/db-architect.ts',
    agentId: 'swarm-db-architect',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'DB architecture findings: schema design, indexes, N+1 queries',
  },
  {
    file: 'swarm/frontend-perf.ts',
    agentId: 'swarm-frontend-perf',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'Frontend perf findings: bundle size, lazy loading, rendering',
  },
  {
    file: 'swarm/ml-readiness.ts',
    agentId: 'swarm-ml-readiness',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'ML readiness findings: data lifecycle, model versioning, pipelines',
  },
  {
    file: 'swarm/observability.ts',
    agentId: 'swarm-observability',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'Observability findings: logging, tracing, alerting completeness',
  },
  {
    file: 'swarm/performance-engineer.ts',
    agentId: 'swarm-performance-engineer',
    phase: 'E',
    category: 'swarm',
    worksheets: [],
    schemaDescription: 'Performance engineering findings: latency, throughput, bottlenecks',
  },
];

// ─── Sample Inputs for Benchmarking ───────────────────────────────────────────

const SAMPLE_INPUTS: Record<string, Record<string, string>> = {
  'customer-journey-mapper': {
    projectName: 'FinConnect',
    customerSegment: 'SMB treasury managers',
    useCase: 'Cash flow forecasting and automated payments',
    competitorNames: 'Brex, Ramp, Mercury',
    projectPath: '/projects/finconnect',
  },
  'info-flow-analyzer': {
    ws01Output: '<WS01 output from customer-journey-mapper>',
  },
  'deeper-needs-laddering': {
    projectName: 'FinConnect',
    ws01Output: '<WS01 output from customer-journey-mapper>',
  },
  'connected-experience-matrix': {
    competitorNames: 'Brex, Ramp, Mercury',
    ws01Output: '<WS01 output>',
    ws04Output: '<WS04 output>',
  },
  'tech-stack-mapper': {
    packageJson: '{"dependencies": {"react": "^18", "express": "^4"}}',
    fileDiscovery: '{"byCategory": {"route": [], "model": [], "config": []}}',
  },
  'revenue-model-architect': {
    ws07Output: '<WS07 Existing Matrix>',
    ws08Output: '<WS08 New Ideas>',
    competitorPricing: 'Brex: free with revenue share, Ramp: free for spend management',
  },
  'industry-structure-analyst': {
    projectName: 'FinConnect',
    sector: 'B2B Fintech / Treasury Management',
    segment: 'SMB (10-500 employees)',
  },
  'competitor-intelligence': {
    projectName: 'FinConnect',
    sector: 'B2B Fintech',
    projectDescription: 'Automated treasury management for SMBs',
    knownCompetitors: 'Brex, Ramp, Mercury',
  },
  'wtp-cost-driver-scorer': {
    ws01Output: '<WS01 output>',
    competitors: 'Brex, Ramp, Mercury',
  },
  'activity-system-mapper': {
    ws01Output: '<WS01 output>',
    ws07Output: '<WS07 Existing Matrix>',
    ws08Output: '<WS08 New Ideas>',
  },
  'chief-strategist': {
    state: '<Full ProjectStateV3 object>',
    liveFindings: '<SwarmFinding[] from Phase E>',
  },
};

// ─── Main Extraction ──────────────────────────────────────────────────────────

function extractFromFile(def: AgentDef): ExtractedPrompt | null {
  const filePath = path.join(AGENTS_DIR, def.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠  File not found: ${filePath}`);
    return null;
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const template = extractTemplateLiteral(source);
  const schema = extractSchema(source);
  const config = extractLLMConfig(source);

  if (!template && def.agentId !== 'temporal-analyst') {
    // temporal-analyst is deterministic, no prompt
    console.warn(`⚠  No prompt template found in ${def.file}`);
    return null;
  }

  // For chief-strategist, get the prompt from prompt-builder.ts
  if (def.agentId === 'chief-strategist') {
    const builderPath = path.join(SYNTHESIS_DIR, 'prompt-builder.ts');
    if (fs.existsSync(builderPath)) {
      const builderSource = fs.readFileSync(builderPath, 'utf-8');
      const builderTemplate = extractTemplateLiteral(builderSource);
      if (builderTemplate) {
        return {
          agentId: def.agentId,
          agentFile: def.file,
          phase: def.phase,
          promptTemplate: builderTemplate,
          expectedSchema: 'synthesisSchema',
          schemaDescription: def.schemaDescription,
          llmConfig: { temperature: 0.3, maxOutputTokens: 16000 },
          inputPlaceholders: extractPlaceholders(builderTemplate),
          worksheets: def.worksheets,
          category: def.category,
        };
      }
    }
  }

  if (!template) return null;

  return {
    agentId: def.agentId,
    agentFile: def.file,
    phase: def.phase,
    promptTemplate: template,
    expectedSchema: schema,
    schemaDescription: def.schemaDescription,
    llmConfig: config,
    inputPlaceholders: extractPlaceholders(template),
    worksheets: def.worksheets,
    category: def.category,
  };
}

async function main() {
  const outputArg = process.argv.find(a => a.startsWith('--output'));
  const outputFile = outputArg
    ? process.argv[process.argv.indexOf(outputArg) + 1]
    : path.resolve('scripts/lambda-benchmark/extracted-prompts.json');

  console.log('🔍 Extracting prompts from V3 agents...\n');

  const allDefs = [...AGENT_DEFS, ...SWARM_AGENT_DEFS];
  const prompts: ExtractedPrompt[] = [];

  for (const def of allDefs) {
    const extracted = extractFromFile(def);
    if (extracted) {
      prompts.push(extracted);
      console.log(`  ✅ ${def.agentId} (Phase ${def.phase}) → ${extracted.expectedSchema}`);
    } else {
      console.log(`  ⏭  ${def.agentId} (Phase ${def.phase}) — skipped`);
    }
  }

  // Also extract the synthesis prompt-builder template
  const builderPath = path.join(SYNTHESIS_DIR, 'prompt-builder.ts');
  if (fs.existsSync(builderPath)) {
    const source = fs.readFileSync(builderPath, 'utf-8');
    // Extract the full return template from buildChiefStrategistPrompt
    const returnMatch = source.match(/return\s*`([\s\S]*?)`;/);
    if (returnMatch && !prompts.find(p => p.agentId === 'chief-strategist')) {
      prompts.push({
        agentId: 'chief-strategist-synthesis',
        agentFile: 'synthesis/prompt-builder.ts',
        phase: 'F',
        promptTemplate: returnMatch[1].trim(),
        expectedSchema: 'synthesisSchema',
        schemaDescription: 'Full strategic synthesis with 5 Wharton questions, 3 Fits, priorities, executive summary',
        llmConfig: { temperature: 0.3, maxOutputTokens: 16000 },
        inputPlaceholders: extractPlaceholders(returnMatch[1]),
        worksheets: ['WS01', 'WS04', 'WS06', 'WS07', 'WS08'],
        category: 'synthesis',
      });
      console.log(`  ✅ chief-strategist-synthesis (Phase F) → synthesisSchema`);
    }
  }

  const output: BenchmarkPromptSet = {
    version: '1.0.0',
    extractedAt: new Date().toISOString(),
    sourceProject: 'Connected Strategy',
    totalPrompts: prompts.length,
    prompts,
    sampleInputs: SAMPLE_INPUTS,
  };

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n📦 Extracted ${prompts.length} prompts → ${outputFile}`);
  console.log('\nBreakdown by phase:');
  const byPhase = prompts.reduce((acc, p) => {
    acc[p.phase] = (acc[p.phase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  for (const [phase, count] of Object.entries(byPhase).sort()) {
    console.log(`  Phase ${phase}: ${count} agents`);
  }

  console.log('\nBreakdown by category:');
  const byCat = prompts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${count} agents`);
  }
}

main().catch(err => {
  console.error('❌ Extraction failed:', err);
  process.exit(1);
});
