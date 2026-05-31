# Current Task

**Date:** 2026-05-30
- **Status**: COMPLETADA
- **Fecha**: 2026-05-30 (Knowledge & Lambda Intelligence)

## Completado: Knowledge Pipeline + Lambda Scripts

- **RAG Pipeline (Component 1):**
  - `vectorStore.ts` → SQLite FTS5 real con BM25 ranking, batch indexing, dedup.
  - `documentParser.ts` → Lectura de archivos, chunking con `@cs/knowledge`, detección de secciones/keywords.
  - `ingestion.ts` → Orquestador de ingesta batch para las 14 fuentes Wharton.
  - Knowledge API → 6 endpoints REST en `/api/knowledge/*`.
  - `synthetic-consultant.ts` → Ahora usa búsqueda real con citaciones.

- **Lambda Benchmark Scripts (Component 2):**
  - `extract-prompts.ts` → Extrae prompts V3 en formato portable JSON.
  - `run-benchmark.sh` → Corre benchmarks en Lambda GPU con vLLM.
  - `evaluate-results.ts` → Compara vs Gemini baseline.

- **Training Data Generator (Component 3):**
  - `generate-pairs.ts` → Genera pares instrucción-respuesta con Gemini.
  - `export-jsonl.ts` → Exporta en formato Alpaca/ShareGPT para fine-tuning.

## Arrancar

```bat
scripts\start.bat
```

## Próximos Pasos (Lambda)

1. **[ ] Ingestar Knowledge Base**: Arrancar el server y llamar `POST /api/knowledge/ingest` para indexar los archivos Wharton disponibles.
2. **[ ] Benchmark en Lambda**: Subir `scripts/lambda-benchmark/` a una instancia Lambda, correr benchmarks con Llama/Mistral/Qwen.
3. **[ ] Generar Training Data**: Correr `npx tsx scripts/training-data/generate-pairs.ts` para crear dataset.
4. **[ ] Producción y Escala**: Subir `main` al repo remoto.
