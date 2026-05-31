/**
 * Connected Strategy — Training Data Exporter
 *
 * Converts raw training pairs (JSONL) into standard fine-tuning formats:
 * - Alpaca: { instruction, input, output }
 * - ShareGPT: { conversations: [{ from, value }] }
 *
 * Usage: npx tsx scripts/training-data/export-jsonl.ts [--format alpaca|sharegpt] [--input path]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const formatIdx = args.indexOf('--format');
const format: 'alpaca' | 'sharegpt' = (formatIdx >= 0 ? args[formatIdx + 1] : 'alpaca') as any;
const inputIdx = args.indexOf('--input');
const inputPath = inputIdx >= 0
  ? args[inputIdx + 1]
  : path.join(PROJECT_ROOT, 'data', 'training', 'raw-pairs.jsonl');

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawPair {
  worksheetId: string;
  worksheetTitle: string;
  instruction: string;
  input: string;
  output: string;
  industry: string;
  companySize: string;
  region: string;
  generatedAt: string;
}

interface AlpacaFormat {
  instruction: string;
  input: string;
  output: string;
}

interface ShareGPTFormat {
  conversations: Array<{ from: 'human' | 'gpt' | 'system'; value: string }>;
}

// ─── Converters ───────────────────────────────────────────────────────────────

function toAlpaca(pair: RawPair): AlpacaFormat {
  return {
    instruction: pair.instruction,
    input: pair.input || '',
    output: pair.output,
  };
}

function toShareGPT(pair: RawPair): ShareGPTFormat {
  const conversations: ShareGPTFormat['conversations'] = [
    {
      from: 'system',
      value: `Eres un consultor estratégico experto en Connected Strategy (framework de Wharton, Siggelkow & Terwiesch). Respondes en español con conocimiento profundo de los frameworks: STAR loops, connected experiences, efficiency frontier, WTP/cost drivers, switching costs, y los 15 worksheets del curriculum.`,
    },
  ];

  if (pair.input) {
    conversations.push({
      from: 'human',
      value: `${pair.instruction}\n\nContexto: ${pair.input}`,
    });
  } else {
    conversations.push({
      from: 'human',
      value: pair.instruction,
    });
  }

  conversations.push({
    from: 'gpt',
    value: pair.output,
  });

  return { conversations };
}

// ─── Quality filters ──────────────────────────────────────────────────────────

function isValidPair(pair: RawPair): boolean {
  // Skip pairs with very short outputs (likely errors)
  if (!pair.output || pair.output.length < 100) return false;
  // Skip pairs with very short instructions
  if (!pair.instruction || pair.instruction.length < 20) return false;
  // Skip if output contains obvious error markers
  if (pair.output.includes('error') && pair.output.length < 200) return false;
  return true;
}

function deduplicate(pairs: RawPair[]): RawPair[] {
  const seen = new Set<string>();
  return pairs.filter((pair) => {
    const key = pair.instruction.substring(0, 100).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('📦 Connected Strategy — Training Data Exporter');
  console.log(`   Format: ${format}`);
  console.log(`   Input: ${inputPath}\n`);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    console.error(`   Run first: npx tsx scripts/training-data/generate-pairs.ts`);
    process.exit(1);
  }

  // Read and parse JSONL
  const lines = fs.readFileSync(inputPath, 'utf-8').split('\n').filter((l) => l.trim());
  const rawPairs: RawPair[] = [];

  for (const line of lines) {
    try {
      rawPairs.push(JSON.parse(line));
    } catch {
      console.warn(`  ⚠️ Skipped invalid JSON line`);
    }
  }

  console.log(`   Raw pairs loaded: ${rawPairs.length}`);

  // Filter and deduplicate
  const validPairs = rawPairs.filter(isValidPair);
  console.log(`   After quality filter: ${validPairs.length}`);

  const uniquePairs = deduplicate(validPairs);
  console.log(`   After deduplication: ${uniquePairs.length}`);

  // Convert to target format
  const outputDir = path.join(PROJECT_ROOT, 'data', 'training');
  fs.mkdirSync(outputDir, { recursive: true });

  if (format === 'alpaca') {
    const outputPath = path.join(outputDir, 'training-alpaca.jsonl');
    const stream = fs.createWriteStream(outputPath);
    for (const pair of uniquePairs) {
      stream.write(JSON.stringify(toAlpaca(pair)) + '\n');
    }
    stream.end();
    console.log(`\n✅ Exported ${uniquePairs.length} pairs to: ${outputPath}`);
  } else {
    const outputPath = path.join(outputDir, 'training-sharegpt.jsonl');
    const stream = fs.createWriteStream(outputPath);
    for (const pair of uniquePairs) {
      stream.write(JSON.stringify(toShareGPT(pair)) + '\n');
    }
    stream.end();
    console.log(`\n✅ Exported ${uniquePairs.length} pairs to: ${outputPath}`);
  }

  // Print stats by worksheet
  console.log('\n📊 Distribution by worksheet:');
  const wsStats = new Map<string, number>();
  for (const pair of uniquePairs) {
    wsStats.set(pair.worksheetId, (wsStats.get(pair.worksheetId) || 0) + 1);
  }
  for (const [ws, count] of [...wsStats.entries()].sort()) {
    console.log(`   ${ws}: ${count} pairs`);
  }

  console.log(`\n   Next: Upload to Lambda and fine-tune with QLoRA`);
  console.log(`   See README.md for instructions`);
}

main();
