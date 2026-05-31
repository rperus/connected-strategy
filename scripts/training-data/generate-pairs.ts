#!/usr/bin/env npx tsx
/**
 * generate-pairs.ts — Connected Strategy Training Data Generator
 *
 * Uses Gemini API to generate high-quality instruction-response pairs for
 * fine-tuning a Connected Strategy specialist model.
 *
 * For each worksheet (WS01-WS15), generates 20-50 diverse scenarios.
 * Each scenario: instruction (user question about strategy) → response (expert Wharton answer).
 *
 * Usage:
 *   npx tsx scripts/training-data/generate-pairs.ts
 *   npx tsx scripts/training-data/generate-pairs.ts --worksheets WS01,WS05,WS12
 *   npx tsx scripts/training-data/generate-pairs.ts --scenarios 30 --batch-size 5
 *   npx tsx scripts/training-data/generate-pairs.ts --dry-run
 *
 * Requires: GEMINI_API_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingPair {
  id: string;
  worksheetId: string;
  worksheetTitle: string;
  instruction: string;
  input: string;
  output: string;
  industry: string;
  companySize: string;
  businessModel: string;
  generatedAt: string;
  model: string;
  tokensUsed: number;
}

interface GenerationConfig {
  worksheetIds: string[];
  scenariosPerWorksheet: number;
  batchSize: number;
  temperature: number;
  maxTokens: number;
  outputDir: string;
  dryRun: boolean;
  delayBetweenBatchesMs: number;
}

// ─── Worksheet Definitions ────────────────────────────────────────────────────
// Extracted from packages/domain/src/worksheets.ts

interface WorksheetInfo {
  id: string;
  title: string;
  description: string;
  keyQuestions: string[];
  keyConcepts: string[];
  sampleTopics: string[];
}

const WORKSHEETS: WorksheetInfo[] = [
  {
    id: 'WS01',
    title: 'Problem & Actors — Customer Journey Map',
    description: 'Maps the customer journey, pain points, actors, and information flows.',
    keyQuestions: [
      'What are the main steps a user takes?',
      'Who are the primary actors?',
      'What triggers the journey?',
      'Where do users drop off?',
      'What are the pain points at each stage?',
    ],
    keyConcepts: ['customer journey stages (latent_need→post_purchase)', 'pain points', 'WTP drivers', 'touchpoints', 'decision factors'],
    sampleTopics: ['journey mapping', 'pain point identification', 'touchpoint analysis', 'WTP scoring vs competitors'],
  },
  {
    id: 'WS02',
    title: 'Connected Loop & Flywheel',
    description: 'Maps learning loops, personalization, and flywheel dynamics.',
    keyQuestions: [
      'How well does the platform sense user signals?',
      'How fast does the platform react to insights?',
      'Does it personalize based on learned data?',
      'What is the core flywheel mechanism?',
    ],
    keyConcepts: ['Sense/Transmit/Analyze/React loop', 'personalization', 'flywheel dynamics', 'network effects', 'data-driven improvement'],
    sampleTopics: ['learning loops', 'data flywheel design', 'personalization strategy', 'network effects'],
  },
  {
    id: 'WS03',
    title: 'Switching Costs & Moat',
    description: 'Evaluates data lock-in, habit formation, integration depth, and network effects.',
    keyQuestions: [
      'How much user data is exclusively on this platform?',
      'How embedded is this in daily workflows?',
      'How many external systems connect?',
      'Does more usage make it more valuable?',
    ],
    keyConcepts: ['data lock-in', 'habit formation', 'integration depth', 'network effects', 'competitive moat'],
    sampleTopics: ['switching cost strategy', 'building defensibility', 'data moat', 'habit loops'],
  },
  {
    id: 'WS04',
    title: 'MVP & Integrate vs Build',
    description: 'Guides build-vs-integrate decisions for the 12-month roadmap.',
    keyQuestions: [
      'What are the 3 core bets in the 12-month MVP?',
      'Which capabilities to integrate vs. build?',
      'How will you know the MVP succeeded?',
    ],
    keyConcepts: ['MVP scoping', 'build vs buy', '12-month roadmap', 'validation criteria', 'strategic differentiation'],
    sampleTopics: ['MVP prioritization', 'make vs buy analysis', 'feature prioritization', 'validation experiments'],
  },
  {
    id: 'WS05',
    title: 'Canonical Data Model',
    description: 'Defines the single source of truth for data entities.',
    keyQuestions: [
      'How available and clean is structured data?',
      'What % of key events are tracked?',
      'Is causal reasoning applied?',
      'What are the canonical entities?',
    ],
    keyConcepts: ['data readiness', 'instrumentation coverage', 'canonical entities', 'causal reasoning', 'data quality'],
    sampleTopics: ['data architecture', 'event tracking strategy', 'data quality improvement', 'analytics maturity'],
  },
  {
    id: 'WS06',
    title: 'Closed Loop Orchestration',
    description: 'Maps Connected Strategy response types per journey and pain point.',
    keyQuestions: [
      'Respond-to-desire maturity?',
      'Curated offering maturity?',
      'Coach behavior maturity?',
      'Automatic execution maturity?',
    ],
    keyConcepts: ['respond-to-desire', 'curated offering', 'coach behavior', 'automatic execution', 'connected experience types'],
    sampleTopics: ['experience type selection', 'autonomy levels', 'customer response design', 'automation vs. curation'],
  },
  {
    id: 'WS07',
    title: 'Agent Design & Guardrails',
    description: 'Defines agent roster, permission matrix, and loop prevention policies.',
    keyQuestions: [
      'What agents are active and what are their responsibilities?',
      'What can agents do autonomously vs. require approval?',
      'How to prevent feedback loops?',
    ],
    keyConcepts: ['agent roster', 'permission matrix', 'loop prevention', 'audit trail', 'human-in-the-loop'],
    sampleTopics: ['AI agent design', 'guardrail strategy', 'agent permissions', 'autonomous operations policy'],
  },
  {
    id: 'WS08',
    title: 'Institutional Dashboards & KPIs',
    description: 'Defines KPIs, adoption metrics, and health signals for strategic oversight.',
    keyQuestions: [
      'What are the primary adoption KPIs?',
      'What funnel completion rates are tracked?',
      'Average time to first value?',
      'AI cost per automated workflow?',
    ],
    keyConcepts: ['adoption KPIs', 'funnel metrics', 'time to value', 'support burden', 'AI cost tracking'],
    sampleTopics: ['KPI framework design', 'dashboard architecture', 'metrics-driven strategy', 'cost optimization'],
  },
  {
    id: 'WS09',
    title: 'Compliance, Audit & Evidence',
    description: 'Maps risk levels, approval requirements, and audit trail coverage.',
    keyQuestions: [
      'Which actions are auto-permitted?',
      'Which require human approval?',
      'Which are blocked without approval?',
      'What % of sensitive actions are logged?',
    ],
    keyConcepts: ['risk matrix', 'approval workflow', 'audit trail', 'compliance automation', 'risk tiers'],
    sampleTopics: ['risk-based approval design', 'audit trail architecture', 'compliance strategy', 'governance framework'],
  },
  {
    id: 'WS10',
    title: 'Competitive Positioning',
    description: 'Evaluates internal fit, external fit, dynamic fit, and differentiation choices.',
    keyQuestions: [
      'How well do activities reinforce each other?',
      'How well do activities deliver on customer WTP?',
      'Can the platform evolve without losing position?',
      'What does the platform explicitly NOT do?',
    ],
    keyConcepts: ['internal fit', 'external fit', 'dynamic fit', 'strategic trade-offs', 'differentiation clarity'],
    sampleTopics: ['three fits analysis', 'strategic positioning', 'competitive differentiation', 'what-not-to-do list'],
  },
  {
    id: 'WS11',
    title: 'GTM, Pricing & Packaging',
    description: 'Revenue model, pricing strategy, packaging, and go-to-market narrative.',
    keyQuestions: [
      'How clear and sustainable are revenue streams?',
      'How deep is the moat?',
      'Can revenue grow without proportional cost?',
      'How deep are customer relationships?',
    ],
    keyConcepts: ['revenue model', 'precision pricing (WHAT/WHEN/WHO/WHY/CURRENCY)', 'scalability', 'customer relationship depth'],
    sampleTopics: ['pricing strategy design', 'revenue model innovation', 'GTM narrative', 'packaging optimization'],
  },
  {
    id: 'WS12',
    title: 'Efficiency Frontier',
    description: 'WTP vs Cost positioning chart. Shows who is on the Pareto-efficient frontier.',
    keyQuestions: [
      'Where is your company on the WTP vs Cost chart?',
      'Who is on the efficient frontier?',
      'Should you raise WTP or lower Cost?',
      'What concrete actions improve frontier position?',
    ],
    keyConcepts: ['willingness-to-pay', 'cost of fulfillment', 'Pareto efficiency', 'competitive advantage (CA = ΔWedge)', 'frontier direction'],
    sampleTopics: ['frontier positioning', 'competitive advantage calculation', 'strategic direction choice', 'value vs cost optimization'],
  },
  {
    id: 'WS13',
    title: 'Connected Strategy Matrix (5×4)',
    description: '4 Connected Experiences × 5 Connection Architectures = 20 cells. Empty cells = innovation opportunities.',
    keyQuestions: [
      'Which experiences and architectures do you offer?',
      'Where are your competitors in the matrix?',
      'What cells are empty in your industry?',
      'What if you operated in a new cell?',
    ],
    keyConcepts: ['connected experiences (4 types)', 'connection architectures (5 types)', 'whitespace analysis', 'innovation mapping'],
    sampleTopics: ['matrix positioning', 'whitespace identification', 'cross-cell innovation', 'architecture selection'],
  },
  {
    id: 'WS14',
    title: 'STAR Deconstruction',
    description: 'Sense/Transmit/Analyze/React × Recognize/Request/Respond/Repeat = 16 cells of tech analysis.',
    keyQuestions: [
      'How do you detect customer needs?',
      'How are signals transmitted?',
      'How are patterns analyzed?',
      'How does the system react?',
    ],
    keyConcepts: ['STAR framework', 'subfunctions grid', 'technology mapping', 'TRL readiness levels', 'emerging tech'],
    sampleTopics: ['technology stack audit', 'STAR capability analysis', 'emerging tech evaluation', 'subfunctions optimization'],
  },
  {
    id: 'WS15',
    title: '5 Forces de Porter',
    description: 'Industry structure analysis using Porter\'s Five Forces framework.',
    keyQuestions: [
      'How intense is rivalry among existing competitors?',
      'How easy is it for new entrants?',
      'How threatening are substitutes?',
      'How powerful are buyers and suppliers?',
    ],
    keyConcepts: ['rivalry', 'new entrants', 'substitutes', 'buyer power', 'supplier power', 'industry attractiveness'],
    sampleTopics: ['industry structure analysis', 'barrier assessment', 'competitive pressure mapping', 'strategic defense'],
  },
];

// ─── Diversity Dimensions ─────────────────────────────────────────────────────

const INDUSTRIES = [
  'B2B SaaS / Enterprise Software',
  'Fintech / Digital Banking',
  'Healthcare / HealthTech',
  'EdTech / Online Learning',
  'E-commerce / Marketplace',
  'Logistics / Supply Chain',
  'Real Estate / PropTech',
  'InsurTech',
  'AgriTech / FoodTech',
  'Manufacturing / Industry 4.0',
  'Media / Content Platforms',
  'Travel / Hospitality',
  'Legal Tech',
  'HR Tech / Recruitment',
  'Cybersecurity',
  'Clean Energy / CleanTech',
  'Automotive / Mobility',
  'Retail / DTC Brands',
  'Government / GovTech',
  'Construction / ConTech',
];

const COMPANY_SIZES = [
  'Pre-seed startup (2-5 people)',
  'Seed-stage startup (5-15 people)',
  'Series A startup (15-50 people)',
  'Growth-stage company (50-200 people)',
  'Mid-market company (200-1000 people)',
  'Enterprise (1000-5000 people)',
  'Large enterprise (5000+ people)',
];

const BUSINESS_MODELS = [
  'B2B SaaS (subscription)',
  'B2C marketplace (take rate)',
  'B2B2C platform',
  'Freemium → enterprise upsell',
  'Usage-based pricing',
  'Enterprise license + services',
  'API-first / developer tools',
  'Vertical SaaS + embedded fintech',
];

// ─── LLM Provider (inline, no project imports) ───────────────────────────────

async function callGemini(prompt: string, config: { temperature: number; maxTokens: number }): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

  return { text, tokensUsed };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildGenerationPrompt(
  worksheet: WorksheetInfo,
  industry: string,
  companySize: string,
  businessModel: string,
  batchIndex: number,
  batchSize: number,
): string {
  return `Eres un profesor de estrategia de Wharton Online especializado en Connected Strategy (Siggelkow & Terwiesch).
Tu tarea: generar ${batchSize} pares de instrucción-respuesta de alta calidad para entrenar un modelo de IA especialista.

## Contexto del Worksheet

**${worksheet.id}: ${worksheet.title}**
${worksheet.description}

Conceptos clave: ${worksheet.keyConcepts.join(', ')}

Preguntas guía del worksheet:
${worksheet.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Parámetros del escenario

- **Industria:** ${industry}
- **Tamaño de empresa:** ${companySize}
- **Modelo de negocio:** ${businessModel}
- **Lote:** ${batchIndex + 1} (varía el ángulo de cada pregunta)

## Reglas de generación

1. **Instrucciones (preguntas del usuario):** Deben ser preguntas realistas que haría un CEO/COO/CTO consultando a un estratega. No preguntas genéricas — deben ser específicas al industry/size/model combinado. Variar entre preguntas tácticas y estratégicas.

2. **Respuestas (experto Wharton):** Deben ser análisis profundos de 300-800 palabras que:
   - Apliquen el framework de Connected Strategy correctamente
   - Usen terminología Wharton (WTP, switching costs, connected experiences, STAR, etc.)
   - Den recomendaciones accionables, no solo teoría
   - Incluyan métricas o indicadores cuando aplique
   - Mencionen trade-offs reales y riesgos
   - Referencien los conceptos del worksheet específico

3. **Diversidad:** Cada par debe cubrir un ángulo diferente del worksheet. Evita repetir la misma estructura de pregunta.

4. **Idioma:** TODO en español latinoamericano profesional.

5. **Formato de salida:** JSON array con ${batchSize} objetos, cada uno con:
   - "instruction": la pregunta del usuario (1-3 oraciones)
   - "input": contexto adicional que el usuario proporciona (puede ser "" si la pregunta es autocontenida)
   - "output": la respuesta experta completa

\`\`\`json
[
  {
    "instruction": "¿Cómo debería mapear el customer journey...",
    "input": "Somos una empresa de fintech B2B con 50 empleados...",
    "output": "Para mapear el customer journey en fintech B2B, el framework de Connected Strategy sugiere..."
  }
]
\`\`\`

Genera EXACTAMENTE ${batchSize} pares. Responde SOLO con el JSON array, sin texto adicional.`;
}

// ─── Main Generation Logic ────────────────────────────────────────────────────

function parseArgs(): GenerationConfig {
  const args = process.argv.slice(2);
  const config: GenerationConfig = {
    worksheetIds: WORKSHEETS.map(w => w.id),
    scenariosPerWorksheet: 25,
    batchSize: 5,
    temperature: 0.7,
    maxTokens: 8192,
    outputDir: path.resolve('scripts/training-data/output'),
    dryRun: false,
    delayBetweenBatchesMs: 2000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--worksheets':
        config.worksheetIds = args[++i].split(',').map(s => s.trim().toUpperCase());
        break;
      case '--scenarios':
        config.scenariosPerWorksheet = parseInt(args[++i]);
        break;
      case '--batch-size':
        config.batchSize = parseInt(args[++i]);
        break;
      case '--temperature':
        config.temperature = parseFloat(args[++i]);
        break;
      case '--output':
        config.outputDir = path.resolve(args[++i]);
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--delay':
        config.delayBetweenBatchesMs = parseInt(args[++i]);
        break;
    }
  }

  return config;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return crypto.randomBytes(6).toString('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const config = parseArgs();

  console.log('🎓 Connected Strategy Training Data Generator');
  console.log('═'.repeat(50));
  console.log(`  Worksheets:  ${config.worksheetIds.join(', ')}`);
  console.log(`  Scenarios:   ${config.scenariosPerWorksheet} per worksheet`);
  console.log(`  Batch size:  ${config.batchSize}`);
  console.log(`  Temperature: ${config.temperature}`);
  console.log(`  Output:      ${config.outputDir}`);
  console.log(`  Dry run:     ${config.dryRun}`);
  console.log('');

  const worksheetsToProcess = WORKSHEETS.filter(w => config.worksheetIds.includes(w.id));
  if (worksheetsToProcess.length === 0) {
    console.error('❌ No matching worksheets found');
    process.exit(1);
  }

  const totalBatches = worksheetsToProcess.length * Math.ceil(config.scenariosPerWorksheet / config.batchSize);
  const estimatedTokens = totalBatches * 3000; // ~3K tokens per batch
  const estimatedCostFlash = (estimatedTokens / 1_000_000) * 0.60; // Output-heavy

  console.log(`📊 Estimated: ${totalBatches} batches, ~${estimatedTokens.toLocaleString()} tokens, ~$${estimatedCostFlash.toFixed(2)} (Flash)`);
  console.log('');

  if (config.dryRun) {
    console.log('🏃 DRY RUN — showing first prompt only:\n');
    const ws = worksheetsToProcess[0];
    const prompt = buildGenerationPrompt(ws, pickRandom(INDUSTRIES), pickRandom(COMPANY_SIZES), pickRandom(BUSINESS_MODELS), 0, config.batchSize);
    console.log(prompt);
    return;
  }

  // Verify API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    console.error('   Set it: $env:GEMINI_API_KEY = "your-key"');
    process.exit(1);
  }

  // Create output directory
  fs.mkdirSync(config.outputDir, { recursive: true });

  const allPairs: TrainingPair[] = [];
  let totalTokensUsed = 0;
  let batchCount = 0;
  let failedBatches = 0;

  for (const ws of worksheetsToProcess) {
    console.log(`\n📝 ${ws.id}: ${ws.title}`);
    console.log('─'.repeat(50));

    const batchCount_ws = Math.ceil(config.scenariosPerWorksheet / config.batchSize);
    const wsPairs: TrainingPair[] = [];

    for (let batch = 0; batch < batchCount_ws; batch++) {
      batchCount++;

      // Pick diverse parameters (ensure variety across batches)
      const industry = INDUSTRIES[(batch * 3) % INDUSTRIES.length];
      const companySize = COMPANY_SIZES[(batch * 2) % COMPANY_SIZES.length];
      const businessModel = BUSINESS_MODELS[batch % BUSINESS_MODELS.length];

      const prompt = buildGenerationPrompt(ws, industry, companySize, businessModel, batch, config.batchSize);

      process.stdout.write(`  Batch ${batch + 1}/${batchCount_ws} [${industry.substring(0, 20)}...] `);

      try {
        const { text, tokensUsed } = await callGemini(prompt, {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });
        totalTokensUsed += tokensUsed;

        // Parse response
        let pairs: Array<{ instruction: string; input: string; output: string }>;
        try {
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonText = jsonMatch ? jsonMatch[1].trim() : text.trim();
          pairs = JSON.parse(jsonText);
        } catch {
          // Try to extract JSON array directly
          const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            pairs = JSON.parse(arrayMatch[0]);
          } else {
            throw new Error('Could not parse JSON from response');
          }
        }

        if (!Array.isArray(pairs)) {
          throw new Error('Response is not an array');
        }

        for (const pair of pairs) {
          wsPairs.push({
            id: generateId(),
            worksheetId: ws.id,
            worksheetTitle: ws.title,
            instruction: pair.instruction,
            input: pair.input || '',
            output: pair.output,
            industry,
            companySize,
            businessModel,
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.5-flash',
            tokensUsed: Math.round(tokensUsed / pairs.length),
          });
        }

        console.log(`✅ ${pairs.length} pairs | ${tokensUsed} tokens`);
      } catch (err: any) {
        failedBatches++;
        console.log(`❌ ${err.message}`);
      }

      // Rate limiting
      if (batch < batchCount_ws - 1) {
        await sleep(config.delayBetweenBatchesMs);
      }
    }

    allPairs.push(...wsPairs);
    console.log(`  → ${wsPairs.length} pairs generated for ${ws.id}`);

    // Save per-worksheet file
    const wsFile = path.join(config.outputDir, `pairs-${ws.id.toLowerCase()}.json`);
    fs.writeFileSync(wsFile, JSON.stringify(wsPairs, null, 2), 'utf-8');
  }

  // Save combined file
  const combinedFile = path.join(config.outputDir, 'all-pairs.json');
  fs.writeFileSync(combinedFile, JSON.stringify(allPairs, null, 2), 'utf-8');

  // Save metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    config,
    stats: {
      totalPairs: allPairs.length,
      totalBatches: batchCount,
      failedBatches,
      totalTokensUsed,
      estimatedCostUSD: Number(((totalTokensUsed / 1_000_000) * 0.60).toFixed(4)),
      pairsPerWorksheet: Object.fromEntries(
        worksheetsToProcess.map(ws => [ws.id, allPairs.filter(p => p.worksheetId === ws.id).length])
      ),
      industriesCovered: [...new Set(allPairs.map(p => p.industry))].length,
      companySizesCovered: [...new Set(allPairs.map(p => p.companySize))].length,
    },
  };
  fs.writeFileSync(path.join(config.outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Generation Complete');
  console.log('═'.repeat(50));
  console.log(`  Total pairs:    ${allPairs.length}`);
  console.log(`  Failed batches: ${failedBatches}`);
  console.log(`  Tokens used:    ${totalTokensUsed.toLocaleString()}`);
  console.log(`  Est. cost:      $${((totalTokensUsed / 1_000_000) * 0.60).toFixed(4)}`);
  console.log(`  Output dir:     ${config.outputDir}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review pairs: npx tsx scripts/training-data/export-jsonl.ts');
  console.log('  2. Filter/curate manually or with quality scoring');
  console.log('  3. Export for fine-tuning: npx tsx scripts/training-data/export-jsonl.ts --format alpaca');
}

main().catch(err => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
