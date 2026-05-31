# Connected Strategy — Training Data Generator

> Genera datos de entrenamiento para fine-tunear un modelo experto en Connected Strategy usando QLoRA en Lambda AI.

## Prerequisitos

- Node.js ≥ 20
- `GEMINI_API_KEY` configurada en `.env` o como variable de entorno
- Para fine-tuning: acceso a Lambda AI con GPU (H100 o A100)

## Paso 1: Generar Pares de Entrenamiento

```bash
# Desde la raíz del proyecto
npx tsx scripts/training-data/generate-pairs.ts
```

**Output**: `data/training/raw-pairs.jsonl`

**Qué genera**:
- 15 worksheets × 10 industrias × 2-3 pares = ~300-450 pares de entrenamiento
- Cada par: instrucción (pregunta), input (contexto), output (respuesta experta)
- Variación: industrias, tamaños de empresa, regiones, tipos B2B/B2C

**Costo estimado**: ~$2-5 USD en Gemini Flash API

**Tiempo estimado**: ~15-30 minutos (con delays anti-rate-limit)

## Paso 2: Exportar en Formato de Fine-Tuning

```bash
# Formato Alpaca (recomendado para Llama/Mistral)
npx tsx scripts/training-data/export-jsonl.ts --format alpaca

# Formato ShareGPT (alternativo, incluye system prompt)
npx tsx scripts/training-data/export-jsonl.ts --format sharegpt
```

**Output**:
- `data/training/training-alpaca.jsonl` — formato `{instruction, input, output}`
- `data/training/training-sharegpt.jsonl` — formato conversacional

El exportador aplica automáticamente:
- ✅ Filtro de calidad (elimina respuestas muy cortas o con errores)
- ✅ Deduplicación por instrucción

## Paso 3: Fine-Tune en Lambda AI

### Configuración del ambiente (en Lambda GPU)

```bash
# SSH a tu instancia Lambda
ssh ubuntu@<tu-ip-lambda>

# Instalar dependencias
pip install transformers datasets peft bitsandbytes accelerate trl

# Subir datos
scp data/training/training-alpaca.jsonl ubuntu@<tu-ip-lambda>:~/training/
```

### Script de fine-tuning con QLoRA

```python
# fine_tune.py
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
from trl import SFTTrainer, SFTConfig

# Modelo base
MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct"

# Configuración de cuantización (4-bit para QLoRA)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype="bfloat16",
)

# Cargar modelo y tokenizer
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID, quantization_config=bnb_config, device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
tokenizer.pad_token = tokenizer.eos_token

# Preparar para QLoRA
model = prepare_model_for_kbit_training(model)

# Configuración LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)

# Cargar dataset
dataset = load_dataset("json", data_files="training/training-alpaca.jsonl", split="train")

# Formatear para Alpaca
def format_instruction(sample):
    if sample["input"]:
        return f"""### Instruction:
{sample["instruction"]}

### Input:
{sample["input"]}

### Response:
{sample["output"]}"""
    return f"""### Instruction:
{sample["instruction"]}

### Response:
{sample["output"]}"""

# Entrenar
training_config = SFTConfig(
    output_dir="./connected-strategy-lora",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    logging_steps=10,
    save_strategy="epoch",
    bf16=True,
    max_seq_length=2048,
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    formatting_func=format_instruction,
    args=training_config,
    tokenizer=tokenizer,
)

trainer.train()
trainer.save_model("./connected-strategy-lora")
```

### Estimaciones de tiempo y costo

| GPU | Tiempo estimado | Costo estimado |
|-----|----------------|----------------|
| 1x A100 (80GB) | ~1-2 horas | ~$2-4 |
| 1x H100 (80GB) | ~30-60 min | ~$2-3 |

## Paso 4: Validar el Modelo Fine-Tuned

Después del fine-tuning, puedes servir el modelo con vLLM:

```bash
# En la instancia Lambda
pip install vllm

# Servir con LoRA adapter
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --enable-lora \
  --lora-modules connected-strategy=./connected-strategy-lora \
  --port 8000
```

Luego puedes usar la API compatible con OpenAI para probar:

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "connected-strategy",
    "messages": [
      {"role": "system", "content": "Eres un consultor experto en Connected Strategy."},
      {"role": "user", "content": "¿Cómo diseñarías un connected loop para una plataforma de telemedicina?"}
    ]
  }'
```

## Estructura de archivos

```
scripts/training-data/
├── generate-pairs.ts      # Genera pares con Gemini API
├── export-jsonl.ts         # Exporta en formato Alpaca/ShareGPT
└── README.md               # Este archivo

data/training/              # Output (generado)
├── raw-pairs.jsonl         # Pares crudos con metadata
├── training-alpaca.jsonl   # Formato Alpaca para fine-tuning
└── training-sharegpt.jsonl # Formato ShareGPT alternativo
```

## Notas importantes

> ⚠️ **Antes de hacer fine-tuning**, lee el análisis en `lambda_ai_strategy_analysis.md`.
> Para la mayoría de los casos, **RAG + Gemini API** es más efectivo y 10x más barato.
> Fine-tuning solo vale la pena si necesitas:
> - Un modelo offline que funcione sin internet
> - Un "tono consultor Wharton" específico que el prompting no logra
> - IP propia sobre los pesos del modelo para vender como producto
