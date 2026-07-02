---
type: context
---
# Current Task

**Date:** 2026-06-21
- **Status**: COMPLETADA
- **Fecha**: 2026-06-21 (OKF Documentation Migration)

## Completado: Migración de Documentación al estándar OKF (v2.9.4)

- **Estandarización de Contexto:** Migrados 120 archivos `.md` del proyecto inyectando un bloque de metadatos YAML frontmatter con el tipo lógico asignado según la carpeta correspondiente.
- **Higiene:** Diseñado, ejecutado y posteriormente eliminado el script de migración temporal `scripts/scratch/migrate-okf.ts`.

## Completado Anterior: Transición Total a EDA y Pub/Sub (v2.9.0)

- **EventHub y Pub/Sub:**
  - Integrado `@google-cloud/pubsub` en el núcleo del sistema de eventos.
  - El sistema enruta mensajes por la red con fallback automático a local in-memory.
- **Refactorización Swarm V3:**
  - Migrados los 20 agentes a un patrón pasivo (Listeners) guiado por AST.
- **Pipeline SAGA:**
  - El orquestador ejecuta flujos de forma dirigida por eventos, permitiendo escalabilidad distribuida real.

## Próximos Pasos (Arquitectura)

1. **[x] Implementar ServerLifecycleManager**: Desacoplar `closeDb()` de Express/mantenimiento mediante hooks de apagado centralizados.
2. **[x] Migrar runV3Pipeline a Arquitectura Dirigida por Eventos**: Integración SAGA + GCP Pub/Sub completada.
3. **[x] Limpieza de Código e Higiene (God Files)**: Divididos `worksheets.ts`, `WorksheetsPage.tsx` y `AgentOrchestratorPage.tsx` en módulos y hooks independientes.
4. **[ ] Conectar runWorksheetSynthesizer a la UI**: Implementar el autocompletado anticipativo Zero-UI en `WorksheetsPage.tsx` con RAG pre-flights.
5. **[x] Ingestar Knowledge Base**: Indexar y limpiar automáticamente archivos PDF y texto de Wharton en `data/knowledge` con el nuevo `clean-and-ingest-pdfs.ts`.
6. **[ ] Producción y Escala**: Subir la rama a producción remota tras la remediación de la auditoría.

## Próximos Pasos (Lambda)

1. **[ ] Benchmark en Lambda**: Subir `scripts/lambda-benchmark/` a una instancia Lambda, correr benchmarks con Llama/Mistral/Qwen.
2. **[ ] Generar Training Data**: Correr `npx tsx scripts/training-data/generate-pairs.ts` para crear dataset.
