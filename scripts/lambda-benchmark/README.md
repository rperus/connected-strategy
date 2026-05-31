# Lambda Benchmark — Connected Strategy

Benchmark the Connected Strategy V3 pipeline agents against open-source models
on Lambda GPU instances using vLLM, and compare results to the Gemini 2.5 Flash baseline.

## Overview

The V3 pipeline has ~20 agents across 7 phases that make LLM calls. This benchmark
suite extracts their prompts, runs them against self-hosted models on Lambda, and
evaluates quality vs. cost.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ extract-prompts  │────▶│  run-benchmark   │────▶│ evaluate-results │
│   (local, TS)    │     │  (Lambda, bash)  │     │   (local, TS)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
   extracted-prompts.json   results-*.json        evaluation-report.json
```

## Quick Start

### 1. Extract Prompts (Local)

```bash
# From project root
npx tsx scripts/lambda-benchmark/extract-prompts.ts

# Custom output path
npx tsx scripts/lambda-benchmark/extract-prompts.ts --output my-prompts.json
```

This reads all V3 agent files and produces `extracted-prompts.json` with:
- Prompt templates (with `${placeholder}` markers)
- Schema names each agent expects
- LLM config (temperature, max tokens)
- Phase and category metadata

### 2. Run Benchmark on Lambda GPU

```bash
# SSH into your Lambda instance
ssh ubuntu@<lambda-ip>

# Copy the files
scp scripts/lambda-benchmark/run-benchmark.sh ubuntu@<lambda-ip>:~/
scp scripts/lambda-benchmark/extracted-prompts.json ubuntu@<lambda-ip>:~/

# Run with Llama 3.1 70B
bash run-benchmark.sh --model llama-3.1-70b

# Or with Mistral Large
bash run-benchmark.sh --model mistral-large

# Or with Qwen 2.5 72B
bash run-benchmark.sh --model qwen2.5-72b

# If vLLM is already running, skip server startup:
bash run-benchmark.sh --model llama-3.1-70b --skip-server --port 8000
```

**Supported models:**

| Key | HuggingFace Model | VRAM Required |
|-----|-------------------|---------------|
| `llama-3.1-70b` | `meta-llama/Llama-3.1-70B-Instruct` | ~80GB (A100) |
| `mistral-large` | `mistralai/Mistral-Large-Instruct-2407` | ~80GB (A100) |
| `qwen2.5-72b` | `Qwen/Qwen2.5-72B-Instruct` | ~80GB (A100) |

**Lambda instance requirements:**
- GPU: A100 80GB or H100 80GB (1× for inference, 2× for faster TP)
- RAM: 128GB+
- Disk: 200GB+ (model weights)
- Cost: ~$1.10/hr (A100 on Lambda)

### 3. Evaluate Results (Local)

```bash
# Copy results back
scp ubuntu@<lambda-ip>:~/benchmark-results/results-*.json scripts/lambda-benchmark/

# Evaluate a single model
npx tsx scripts/lambda-benchmark/evaluate-results.ts --results scripts/lambda-benchmark/results-llama-3.1-70b-*.json

# Compare multiple models
npx tsx scripts/lambda-benchmark/evaluate-results.ts --compare

# Auto-discover results in default locations
npx tsx scripts/lambda-benchmark/evaluate-results.ts
```

Outputs:
- `evaluation-report.json` — Full metrics per agent
- `DECISION.md` — Decision framework with recommendations

## Evaluation Metrics

| Metric | Description | Gemini Baseline |
|--------|-------------|-----------------|
| API Success Rate | % of calls that return a response | ~99% |
| JSON Parse Rate | % of responses parseable as JSON | ~95% |
| Schema Validation | % of responses with expected key fields | ~90% |
| Spanish Language | % of responses containing Spanish text | ~98% |
| Quality Score | Composite 0-100 score (weighted) | ~85 |

**Quality Score composition:**
- API success: 25 pts
- JSON parseable: 25 pts
- Response length 500-15K chars: 15 pts
- Spanish language detected: 10 pts
- Key schema fields present: 15 pts
- Clean finish (not truncated): 10 pts

## Decision Framework: When to Switch from Gemini

### Stay on Gemini when:
1. **Volume < 100 runs/month** — API cost is negligible ($2-5/mo)
2. **Quality is paramount** — Gemini structured output > open models
3. **Google Search grounding** needed for competitor intelligence agent
4. **Team velocity** — no infrastructure to maintain

### Switch to self-hosted when:
1. **Volume > 500 runs/month** — self-hosted becomes cheaper
2. **Data sovereignty** — prompts/responses can't leave your infra
3. **Latency** — local GPU inference can be <500ms per call
4. **Fine-tuning** — training data generated here can train a specialist model
5. **Benchmark quality score ≥ 80** for the open model

### Cost Comparison (100 runs/month)

| Model | Type | Cost/Run | Monthly Cost |
|-------|------|----------|-------------|
| Gemini 2.5 Flash | API | ~$0.03 | ~$3 |
| Llama 3.1 70B | Self-hosted | ~$0.01* | ~$800** |
| Mistral Large | Self-hosted | ~$0.01* | ~$800** |

\* Per-run marginal cost  
\** Includes 24/7 GPU reservation. Use spot instances or auto-scaling to reduce.

## Files

| File | Purpose |
|------|---------|
| `extract-prompts.ts` | Reads V3 agents, extracts prompts to JSON |
| `run-benchmark.sh` | Launches vLLM + runs benchmark on Lambda |
| `evaluate-results.ts` | Compares results vs Gemini baseline |
| `extracted-prompts.json` | Output: portable prompt dataset |
| `results-*.json` | Output: raw benchmark results |
| `evaluation-report.json` | Output: full evaluation metrics |
| `DECISION.md` | Output: decision framework |

## Agent Coverage

The benchmark covers all LLM-calling agents in the V3 pipeline:

**Phase B (Deep Analysis):** customer-journey-mapper, info-flow-analyzer, deeper-needs-laddering, connected-experience-matrix, tech-stack-mapper, revenue-model-architect

**Phase C (Competitive Intelligence):** industry-structure-analyst, competitor-intelligence, wtp-cost-driver-scorer, activity-system-mapper

**Phase D (Temporal):** temporal-analyst (deterministic, no LLM — included for completeness)

**Phase E (Swarm):** security-auditor, api-design-critic, db-architect, frontend-perf, ml-readiness, observability, performance-engineer

**Phase F (Synthesis):** chief-strategist (uses prompt-builder.ts)
