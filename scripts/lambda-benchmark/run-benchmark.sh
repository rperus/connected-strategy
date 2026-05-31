#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# run-benchmark.sh — Connected Strategy Lambda Benchmark
#
# Sets up a vLLM server on a Lambda GPU instance, feeds extracted prompts,
# and saves benchmark results for evaluation.
#
# Prerequisites:
#   1. Lambda GPU instance with >=80GB VRAM (A100 or H100)
#   2. Python 3.10+ with pip
#   3. extracted-prompts.json from extract-prompts.ts
#
# Usage:
#   # On Lambda instance:
#   bash run-benchmark.sh --model llama-3.1-70b
#   bash run-benchmark.sh --model mistral-large --prompts ./extracted-prompts.json
#   bash run-benchmark.sh --model qwen2.5-72b --port 8000
#
# Supported models:
#   llama-3.1-70b     → meta-llama/Llama-3.1-70B-Instruct
#   mistral-large     → mistralai/Mistral-Large-Instruct-2407
#   qwen2.5-72b       → Qwen/Qwen2.5-72B-Instruct
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────────────────────────
MODEL_KEY="llama-3.1-70b"
PROMPTS_FILE="./extracted-prompts.json"
PORT=8000
MAX_MODEL_LEN=16384
TENSOR_PARALLEL=1
GPU_MEMORY_UTILIZATION=0.90
OUTPUT_DIR="./benchmark-results"
SKIP_SERVER=false

# ─── Parse Args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --model) MODEL_KEY="$2"; shift 2 ;;
    --prompts) PROMPTS_FILE="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    --tp) TENSOR_PARALLEL="$2"; shift 2 ;;
    --max-len) MAX_MODEL_LEN="$2"; shift 2 ;;
    --skip-server) SKIP_SERVER=true; shift ;;
    --help)
      echo "Usage: $0 [--model MODEL] [--prompts FILE] [--port PORT] [--tp N] [--skip-server]"
      echo ""
      echo "Models: llama-3.1-70b, mistral-large, qwen2.5-72b"
      exit 0
      ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ─── Model Resolution ─────────────────────────────────────────────────────────
resolve_model() {
  case $1 in
    llama-3.1-70b)    echo "meta-llama/Llama-3.1-70B-Instruct" ;;
    mistral-large)    echo "mistralai/Mistral-Large-Instruct-2407" ;;
    qwen2.5-72b)      echo "Qwen/Qwen2.5-72B-Instruct" ;;
    *)
      echo "❌ Unknown model: $1"
      echo "   Supported: llama-3.1-70b, mistral-large, qwen2.5-72b"
      exit 1
      ;;
  esac
}

MODEL_HF=$(resolve_model "$MODEL_KEY")
echo "🤖 Model: $MODEL_KEY → $MODEL_HF"
echo "📄 Prompts: $PROMPTS_FILE"
echo "🔌 Port: $PORT"
echo "📁 Output: $OUTPUT_DIR"

# ─── Validate Inputs ──────────────────────────────────────────────────────────
if [ ! -f "$PROMPTS_FILE" ]; then
  echo "❌ Prompts file not found: $PROMPTS_FILE"
  echo "   Run 'npx tsx scripts/lambda-benchmark/extract-prompts.ts' first."
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# ─── Install Dependencies ─────────────────────────────────────────────────────
install_deps() {
  echo "📦 Installing dependencies..."

  if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install Python 3.10+ first."
    exit 1
  fi

  pip install --quiet --upgrade pip
  pip install --quiet vllm openai jq

  # Verify GPU
  if command -v nvidia-smi &> /dev/null; then
    echo "🎮 GPU Info:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
  else
    echo "⚠  nvidia-smi not found. Ensure CUDA is available."
  fi
}

# ─── Start vLLM Server ────────────────────────────────────────────────────────
start_vllm() {
  echo "🚀 Starting vLLM server on port $PORT..."
  echo "   Model: $MODEL_HF"
  echo "   Tensor Parallel: $TENSOR_PARALLEL"
  echo "   Max Model Length: $MAX_MODEL_LEN"

  # Check if already running
  if curl -s "http://localhost:$PORT/v1/models" > /dev/null 2>&1; then
    echo "✅ vLLM server already running on port $PORT"
    return 0
  fi

  # Launch in background
  python3 -m vllm.entrypoints.openai.api_server \
    --model "$MODEL_HF" \
    --port "$PORT" \
    --tensor-parallel-size "$TENSOR_PARALLEL" \
    --max-model-len "$MAX_MODEL_LEN" \
    --gpu-memory-utilization "$GPU_MEMORY_UTILIZATION" \
    --dtype auto \
    --trust-remote-code \
    --enforce-eager \
    > "$OUTPUT_DIR/vllm-server.log" 2>&1 &

  VLLM_PID=$!
  echo "   PID: $VLLM_PID"

  # Wait for server to be ready (up to 10 minutes for large models)
  echo "⏳ Waiting for vLLM server to load model (up to 10 min)..."
  for i in $(seq 1 120); do
    if curl -s "http://localhost:$PORT/v1/models" > /dev/null 2>&1; then
      echo "✅ vLLM server ready!"
      return 0
    fi
    if ! kill -0 "$VLLM_PID" 2>/dev/null; then
      echo "❌ vLLM server died. Check $OUTPUT_DIR/vllm-server.log"
      tail -20 "$OUTPUT_DIR/vllm-server.log"
      exit 1
    fi
    sleep 5
  done

  echo "❌ vLLM server failed to start within 10 minutes."
  kill "$VLLM_PID" 2>/dev/null || true
  exit 1
}

# ─── Run Benchmark ─────────────────────────────────────────────────────────────
run_benchmark() {
  local RESULTS_FILE="$OUTPUT_DIR/results-${MODEL_KEY}-$(date +%Y%m%d-%H%M%S).json"
  local BASE_URL="http://localhost:$PORT/v1"

  echo ""
  echo "🏃 Running benchmark..."
  echo "   Results → $RESULTS_FILE"

  # Use Python for robust JSON handling and API calls
  python3 - "$PROMPTS_FILE" "$BASE_URL" "$MODEL_HF" "$MODEL_KEY" "$RESULTS_FILE" << 'PYTHON_SCRIPT'
import json
import sys
import time
from datetime import datetime

prompts_file = sys.argv[1]
base_url = sys.argv[2]
model_hf = sys.argv[3]
model_key = sys.argv[4]
results_file = sys.argv[5]

try:
    from openai import OpenAI
except ImportError:
    print("❌ openai package not installed. Run: pip install openai")
    sys.exit(1)

# Load prompts
with open(prompts_file) as f:
    prompt_set = json.load(f)

client = OpenAI(base_url=base_url, api_key="not-needed")

results = {
    "version": "1.0.0",
    "benchmarkedAt": datetime.utcnow().isoformat() + "Z",
    "model": model_key,
    "modelHF": model_hf,
    "totalPrompts": prompt_set["totalPrompts"],
    "results": [],
    "summary": {}
}

total = len(prompt_set["prompts"])
successes = 0
json_parse_ok = 0
total_tokens = 0
total_duration_ms = 0

for i, prompt in enumerate(prompt_set["prompts"]):
    agent_id = prompt["agentId"]
    phase = prompt["phase"]
    template = prompt["promptTemplate"]
    config = prompt["llmConfig"]

    print(f"\n[{i+1}/{total}] {agent_id} (Phase {phase})...", flush=True)

    # Build the full prompt with JSON instruction
    full_prompt = f"{template}\n\nRespond ONLY with valid JSON matching the schema."

    start = time.time()
    try:
        response = client.chat.completions.create(
            model=model_hf,
            messages=[
                {
                    "role": "system",
                    "content": "Eres un consultor estratégico Wharton experto en Connected Strategy. Siempre respondes en español con JSON válido."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            temperature=config["temperature"],
            max_tokens=config["maxOutputTokens"],
        )
        duration_ms = int((time.time() - start) * 1000)
        text = response.choices[0].message.content or ""
        usage = response.usage
        prompt_tokens = usage.prompt_tokens if usage else 0
        completion_tokens = usage.completion_tokens if usage else 0
        finish_reason = response.choices[0].finish_reason

        # Try to parse as JSON
        json_ok = False
        json_error = None
        try:
            # Handle markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
            json_text = json_match.group(1).strip() if json_match else text.strip()
            parsed = json.loads(json_text)
            json_ok = True
        except json.JSONDecodeError as e:
            json_error = str(e)

        result = {
            "agentId": agent_id,
            "phase": phase,
            "category": prompt["category"],
            "success": True,
            "jsonParseOk": json_ok,
            "jsonError": json_error,
            "responseLength": len(text),
            "promptTokens": prompt_tokens,
            "completionTokens": completion_tokens,
            "totalTokens": prompt_tokens + completion_tokens,
            "durationMs": duration_ms,
            "finishReason": finish_reason,
            "response": text[:5000],  # Truncate for storage
            "expectedSchema": prompt["expectedSchema"],
        }

        successes += 1
        if json_ok:
            json_parse_ok += 1
        total_tokens += prompt_tokens + completion_tokens
        total_duration_ms += duration_ms

        status = "✅" if json_ok else "⚠️ JSON parse failed"
        print(f"  {status} | {duration_ms}ms | {prompt_tokens + completion_tokens} tokens | {finish_reason}")

    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        result = {
            "agentId": agent_id,
            "phase": phase,
            "category": prompt["category"],
            "success": False,
            "error": str(e),
            "durationMs": duration_ms,
        }
        total_duration_ms += duration_ms
        print(f"  ❌ Error: {e}")

    results["results"].append(result)

# Summary
results["summary"] = {
    "totalPrompts": total,
    "successCount": successes,
    "jsonParseOkCount": json_parse_ok,
    "successRate": round(successes / total * 100, 1) if total > 0 else 0,
    "jsonParseRate": round(json_parse_ok / total * 100, 1) if total > 0 else 0,
    "totalTokens": total_tokens,
    "totalDurationMs": total_duration_ms,
    "avgDurationMs": round(total_duration_ms / total) if total > 0 else 0,
    "avgTokensPerPrompt": round(total_tokens / total) if total > 0 else 0,
}

with open(results_file, 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"📊 Benchmark Complete: {model_key}")
print(f"{'='*60}")
print(f"  Success rate:    {results['summary']['successRate']}%")
print(f"  JSON parse rate: {results['summary']['jsonParseRate']}%")
print(f"  Total tokens:    {results['summary']['totalTokens']:,}")
print(f"  Total duration:  {results['summary']['totalDurationMs']:,}ms")
print(f"  Avg per prompt:  {results['summary']['avgDurationMs']:,}ms")
print(f"  Results saved:   {results_file}")
PYTHON_SCRIPT

  echo ""
  echo "✅ Benchmark complete. Results: $RESULTS_FILE"
}

# ─── Main Flow ─────────────────────────────────────────────────────────────────
main() {
  install_deps

  if [ "$SKIP_SERVER" = false ]; then
    start_vllm
  else
    echo "⏭  Skipping server start (--skip-server)"
  fi

  run_benchmark

  echo ""
  echo "📋 Next steps:"
  echo "   1. Copy results to local machine:"
  echo "      scp lambda:$OUTPUT_DIR/results-*.json scripts/lambda-benchmark/"
  echo "   2. Run evaluation:"
  echo "      npx tsx scripts/lambda-benchmark/evaluate-results.ts --results results-*.json"
}

main
