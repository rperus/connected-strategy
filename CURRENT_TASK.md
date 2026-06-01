# Current Task

**Date:** 2026-06-01
- **Status**: COMPLETADA
- **Fecha**: 2026-06-01 (Structural Re-Architecture & Zero-UI)

## Completado: Re-Arquitectura Estructural y Zero-UI (v2.8.2)

- **Mapeo y Salud Base (Fase 1):**
  - AST sincronizado exitosamente (1,638 nodos y 2,912 aristas).
  - Identificadas comunidades principales, God Nodes e importaciones circulares en el Swarm V3.
- **Higiene de Código (Fase 2 & Fase 5):**
  - Eliminación física de **21 archivos de agentes heredados V2** completamente huérfanos.
  - Generado reporte de huérfanos y duplicados en `scratch/fase2_findings.md`.
- **Resolución de Ciclos Circulares (Fase 3 & Fase 5):**
  - Disueltos los acoplamientos en el Swarm V3 al independizar `state-types.ts` del directorio de agentes especialistas.
  - Evaluada la centralidad de red (Betweenness Centrality) de `closeDb()` y `runV3Pipeline()`. Reporte en `scratch/fase3_findings.md`.
- **Visión Holística y Zero-UI (Fase 4):**
  - Detectados silos funcionales en worksheets e interfaz React.
  - Diseñadas 3 propuestas de automatización proactiva Zero-UI (Auto-Fill RAG, SSE Alerts, Auto-Healing PRs). Reporte en `scratch/fase4_findings.md`.

## Próximos Pasos (Arquitectura)

1. **[ ] Implementar ServerLifecycleManager**: Desacoplar `closeDb()` de Express/mantenimiento mediante hooks de apagado centralizados.
2. **[ ] Migrar runV3Pipeline a PipelineMediator**: Desacoplar la orquestación monolítica de agentes mediante una arquitectura dirigida por eventos (Event-Driven).
3. **[ ] Conectar runWorksheetSynthesizer a la UI**: Implementar el autocompletado anticipativo Zero-UI en `WorksheetsPage.tsx` con RAG pre-flights.
4. **[ ] Ingestar Knowledge Base**: Indexar los archivos Wharton disponibles llamando a `POST /api/knowledge/ingest`.
5. **[ ] Producción y Escala**: Subir la rama a producción remota tras la remediación de la auditoría.

## Próximos Pasos (Lambda)

1. **[ ] Benchmark en Lambda**: Subir `scripts/lambda-benchmark/` a una instancia Lambda, correr benchmarks con Llama/Mistral/Qwen.
2. **[ ] Generar Training Data**: Correr `npx tsx scripts/training-data/generate-pairs.ts` para crear dataset.
