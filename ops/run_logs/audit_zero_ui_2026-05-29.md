# Auditoría Zero UI con Superpowers v2.0.1
**Fecha:** 2026-05-29
**Proyecto:** Connected Strategy
**Alcance:** `apps/web/src` (Frontend React + Vite)

## 1. Resumen Ejecutivo

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| **P0** (Crítico) | 1 | Bugs de estado, Doppelgängers de navegación |
| **P1** (Alto) | 2 | Ghost Buttons, Doppelgängers de interfaz, Integridad de datos |
| **P2** (Medio) | 4 | Affordances engañosas, CTAs competitivos, Carga cognitiva |
| **P3** (Bajo) | 0 | Problemas ergonómicos menores |

**Cálculo del Score Zero UI:**
$S_{\text{Friction}} = 100 - (15 \times 1 + 10 \times 2 + 5 \times 4 + 2 \times 0) = 100 - 55 = 45$

**Veredicto:** 🔴 **45/100 (Crítico / Fricción Severa)**. La interfaz presenta una carga cognitiva moderada a alta debido a la redundancia de acciones, CTAs competitivos que violan la Ley de Hick y dependencias de acciones manuales que ya tienen mecanismos automáticos en segundo plano.

---

## 2. Tabla Consolidada de Diagnóstico (Checkpoints)

| Archivo | Cat | Elemento / Línea | Severidad | Descripción del Hallazgo |
|---------|-----|------------------|-----------|--------------------------|
| `HomePage.tsx` | 🐛 | Links a proyecto (`L228`, `L461`) | **P0** | **Navigation Doppelgänger**: Existen dos enlaces con textos distintos (`[Nombre] →` en los chips superiores, y `Ver →` en la tabla inferior) que navegan al mismo destino `/project/${p.id}`. |
| `WorksheetsPage.tsx` | 👻 | Botón "Guardar" (`L529`) | **P1** | **Ghost Button**: El usuario tiene un botón primario de "Guardar" que no aporta nada porque existe un debouncer automático en `setAnswer` (`L253`) que ya hace el PUT al API (`putAnswerToApi`). |
| `WorksheetsPage.tsx` | 👯 | "Guardar" vs "Guardar todo" (`L390`, `L529`) | **P1** | **Doppelgänger**: Hay dos botones de guardado compitiendo en la misma página (uno abajo del formulario y otro en el sidebar). Redundancia pura. |
| `HomePage.tsx` | ⚔️ | 3 CTAs principales (`L232-256`) | **P2** | **Competing CTAs**: Existen 3 botones primarios juntos (`▶ Analizar + IA`, `🚀 Pipeline (sin costo)`, `✦ Pipeline + Gemini`), violando la Ley de Hick. |
| `WorksheetsPage.tsx` | ⚔️ | Opciones Booleanas (`L474`) | **P2** | **Competing CTAs**: Las opciones "Sí" y "No" se renderizan como botones contiguos de igual peso. |
| `HealthDashboardPage.tsx`| 🤖 | Botón "Refrescar" (`L168`) | **P2** | **Manual-Should-Be-Auto**: El botón para hacer `fetchHealth` es manual a pesar de que la vista ya tiene conexión SSE global (`liveEvents`), por lo que los datos deberían recargarse solos al terminar un job del pipeline. |
| `AgentOrchestratorPage.tsx`| 👁️ | SVG Nodes (`L286`) | **P2** | **Phantom Affordance**: Los nodos de agentes tienen `cursor: pointer` y estilos de selección, pero no ejecutan ninguna acción más que mostrar texto local en un panel. |

---

## 3. Detalle de P0s/P1s con Safe-Fix Plan

### 🐛 P0: Navigation Doppelgänger (`HomePage.tsx`)
**Problema:** Tener múltiples rutas visuales que dicen cosas distintas pero hacen lo mismo confunde al usuario y fragmenta la intención de click.
**Safe-Fix:** 
1. Eliminar el botón explícito `Ver →` de la tabla y hacer que toda la fila de la tabla sea clickeable (`cursor: pointer`, con un `onClick` que navegue al proyecto), o estandarizar el texto a la convención del chip.

### 👻 P1: Ghost Button & Doppelgänger de Guardado (`WorksheetsPage.tsx`)
**Problema:** La aplicación tiene auto-save funcional (con debounce de 1500ms y SQLite backend persistence). Exigir o sugerirle al usuario que presione "Guardar" y "Guardar todo" añade fricción y lo hace dudar del auto-save.
**Safe-Fix:**
1. Eliminar por completo el botón primario de `Guardar` de la parte inferior.
2. Eliminar el botón `↑ Guardar todo` del sidebar.
3. Cambiar la UX para que el indicador de `StorageBadge` cambie a "Guardando..." pasivamente y luego a "✓ Guardado" cuando el debounce se resuelva, sin requerir clics.

---

### Verification Gate (Superpowers)
| Checklist | Estado | Evidencia / Razón |
|-----------|--------|-------------------|
| 1. Cero Lecturas Masivas | ✓ Pass | Uso de list_dir y view_file focalizados en src/. |
| 2. Checklist Inquebrantable | ✓ Pass | Evaluadas las 4 categorías (Zombies checkeados, no confirmados). |
| 3. Estrategia Write-to-Disk | ✓ Pass | Reporte escrito en logs locales, no devuelto completo por chat. |
| 4. Regla de Adyacencia / Cruce | ✓ Pass | Encontrados doble CTAs de guardado e inputs auto-trigger. |
