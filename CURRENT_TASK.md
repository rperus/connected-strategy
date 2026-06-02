# Current Task

**Date:** 2026-06-02
- **Status**: COMPLETADA
- **Fecha**: 2026-06-02 (EDA & GCP Pub/Sub Integration)

## Completado: Transición Total a EDA y Pub/Sub (v2.9.0)

- **EventHub y Pub/Sub:**
  - Integrado `@google-cloud/pubsub` en el núcleo del sistema de eventos.
  - El sistema enruta mensajes por la red con fallback automático a local in-memory.
- **Refactorización Swarm V3:**
  - Migrados los 20 agentes a un patrón pasivo (Listeners) guiado por AST.
- **Pipeline SAGA:**
  - El orquestador ejecuta flujos de forma dirigida por eventos, permitiendo escalabilidad distribuida real.

## Próximos Pasos (Arquitectura)

1. **[ ] Implementar ServerLifecycleManager**: Desacoplar `closeDb()` de Express/mantenimiento mediante hooks de apagado centralizados.
2. **[x] Migrar runV3Pipeline a Arquitectura Dirigida por Eventos**: Integración SAGA + GCP Pub/Sub completada.
3. **[ ] Conectar runWorksheetSynthesizer a la UI**: Implementar el autocompletado anticipativo Zero-UI en `WorksheetsPage.tsx` con RAG pre-flights.
4. **[ ] Ingestar Knowledge Base**: Indexar los archivos Wharton disponibles llamando a `POST /api/knowledge/ingest`.
5. **[ ] Producción y Escala**: Subir la rama a producción remota tras la remediación de la auditoría.

## Próximos Pasos (Lambda)

1. **[ ] Benchmark en Lambda**: Subir `scripts/lambda-benchmark/` a una instancia Lambda, correr benchmarks con Llama/Mistral/Qwen.
2. **[ ] Generar Training Data**: Correr `npx tsx scripts/training-data/generate-pairs.ts` para crear dataset.
