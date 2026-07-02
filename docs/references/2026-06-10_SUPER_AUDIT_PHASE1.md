---
type: report
title: MEGA AUDITORÍA ARQUITECTÓNICA Y DOCUMENTAL LOCAL
description: MEGA AUDITORÍA ARQUITECTÓNICA Y DOCUMENTAL LOCAL
timestamp: '2026-06-27T17:40:07Z'
---

# MEGA AUDITORÍA ARQUITECTÓNICA Y DOCUMENTAL LOCAL
**Fecha:** 2026-06-10
**Versión de Plataforma:** 2.9.3 (God Files Split)

## 1. Executive Summary
La plataforma `Connected_Strategy` posee una base sólida y 0 dependencias circulares, pero la higiene estructural está comprometida: el sistema de testing local está roto (ESM conflict), no hay barreras de linting activas, existe código muerto acumulado (19 archivos huérfanos) y el grafo arquitectónico sigue dependiendo de un puñado de "God Nodes". El estado documental presenta lagunas clave como la ausencia del `CAPABILITIES_REGISTRY.md`.

## 2. Estado Real Local
* **Directorio:** `C:\dev\Connected_Strategy`
* **Rama y HEAD:** `main` @ `c8a0224`
* **Git Status:** Dirty (17 modificados, >60 untracked).
* **Tipología:** Monorepo (pnpm). App Web (React), Server (Node), Motor Multi-Agente (20 agentes, EDA), Scripts analíticos, App Desktop (Electron).

## 3. Diagnóstico del Hairball o Complejidad
* **Código Muerto:** 19 archivos no utilizados (incluyendo integraciones recientes como `pdfParser.ts`).
* **God Nodes Restantes:** `runV3Pipeline()` (49 aristas), `callLLMValidated()` (38 aristas) y `EventHub` (33 aristas).
* **Ausencia de Barreras:** No hay `.dependency-cruiser.cjs` para forzar las reglas del `AGENTS.md`.

## 4. Métricas de Topología
* **Tamaño:** 315 archivos, ~278,141 palabras.
* **Dependencias Circulares:** 0 detectadas.
* **Acoplamiento Inesperado:** `scripts/clean-and-ingest-pdfs.ts` importa lógicas de `@cs/agents`.
* **Exportaciones Duplicadas:** `App|default` (Web) y `ports|default` (Runtime).

## 5. Riesgos Reales (Top Críticos)
1. **P0 - Testing Bloqueado:** `vitest` falla por conflicto CJS/ESM (`vite-tsconfig-paths`).
2. **P0 - Linting Roto:** Ningún paquete tiene configurado un script `lint`.
3. **P0 - Dirty State Crítico:** Cambios mayores en UI sin pruebas funcionales de respaldo.
4. **P1 - Fuga de Fronteras:** Ausencia de validación estática de dependencias.
5. **P1 - Documentación Huérfana:** Falta el `CAPABILITIES_REGISTRY.md`.

## 6. Blast Radius por Área Crítica
* **`@cs/domain`:** Nivel 1. Cualquier cambio rompe toda la aplicación.
* **`runV3Pipeline()`:** Nivel 2. Modificarlo rompe el ciclo SAGA.
* **`EventHub`:** Nivel 2. Afecta la telemetría, UI updates y Swarm.

## 7. Recomendación de Siguiente Paso
**Ejecutar Plan A (Restauración de la Red de Seguridad)**:
- Reparar `vitest.config.ts`.
- Configurar `.dependency-cruiser.cjs`.
- Crear el `CAPABILITIES_REGISTRY.md`.
- Sancionar scripts de `lint` o limpiarlos.
