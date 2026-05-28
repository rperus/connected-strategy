# 📊 Visualización Premium Audit — Connected Strategy Control Tower
**Fecha:** 2026-05-26  
**Auditor:** Antigravity (Advanced Agentic Coding Partner)  
**Proyecto:** Connected Strategy Control Tower  
**Workspace:** `C:\dev\Connected_Strategy`

---

## 1. Executive Summary

La auditoría **Visualización Premium (auditoria5b-viz-premium)** analiza exhaustivamente el diseño visual, la tokenización, el soporte de modo oscuro, la resiliencia en backend/frontend y la arquitectura de componentes de visualización en la plataforma.

| Módulo | Score | Hallazgos Destacados |
|:---|:---:|:---|
| **V1: Library Hygiene** | ✅ **10/10** | 0 librerías legacy detectadas. Uso exclusivo de raw SVGs y canvas customizados. |
| **V2: Design Tokens** | 🔴 **2/10** | Sin `design-tokens.css` ni `echarts-theme.ts`. Múltiples colores hardcodeados. |
| **V3: Dark Mode Ready** | 🔴 **1/10** | Gráficas sin prop `dark`. Colores y transparencias en SVGs no adaptativos. |
| **V4: Data Resilience** | 🔴 **3/10** | Ausencia de `safe_query_with_rollback`, sin query timeouts, y sin `AbortController` en fetchers. |
| **V5: Component Architecture** | 🔴 **1/10** | Lógica de graficación empotrada directamente en páginas sin reusabilidad. Sin barrel exports. |
| **OVERALL PREMIUM SCORE** | 🔴 **3.4/10** | **VEREDICTO: REQUIERE REMEDIACIÓN CRÍTICA (NO-GO para Enterprise)** |

---

## 2. Hallazgos por Severidad

### 🔴 P0 — Críticos (Acción Inmediata)

| ID | Módulo | Archivo | Descripción del Hallazgo | Fix Recomendado |
|:---|:---|:---|:---|:---|
| **VIZ-010** | V2 | `apps/web/src/index.css` | **Ausencia de archivo central de tokens CSS:** No existen variables específicas de gráficas (`--chart-*`), KPIs (`--kpi-*`), ni superficies avanzadas (`--surface-*`). | Crear `design-tokens.css` en `apps/web/src/styles/` o ampliar `:root` en `index.css` con variables CSS para el set completo de colores y sombras. |
| **VIZ-011** | V2 | `apps/web/src/` | **Ausencia de `echarts-theme.ts`:** Falta un motor centralizado de gráficos premium. Toda la lógica está dispersa en SVGs directos de React. | Adoptar `echarts` y `echarts-for-react`. Crear `echarts-theme.ts` que defina la paleta de 8 colores estándar, tooltips glassmórficos y grids optimizados. |
| **VIZ-020** | V3 | `apps/web/src/components/RadarChart.tsx` | **Componentes de gráficas sin prop `dark`:** El gráfico `RadarChart` y las representaciones visuales inline no exponen la propiedad `dark?: boolean` para adaptarse de manera reactiva al modo oscuro. | Agregar la prop `dark?: boolean` a todos los wrappers e implementar cambios de color de fondo y textos condicionales basados en esta propiedad. |
| **VIZ-021** | V3 | `apps/web/src/` | **Sin tema oscuro registrado ni exportado:** Dado que no existe `echarts-theme.ts`, no existe variante `echartsDarkTheme` de alto contraste en fondos negros. | Exportar `echartsDarkTheme` con opacidad incrementada, líneas de división en `#1e293b`, y colores de labels adaptados (`#64748b`). |
| **VIZ-030** | V4 | `apps/server/src/modules/pipeline/routes.ts` | **Endpoints de Dashboard sin protección de rollback:** Las consultas críticas de agregación e histórico se ejecutan sincrónicamente en SQLite sin un wrapper de transacción robusto. | Implementar un middleware de consultas seguras o transacciones explícitas de lectura en SQLite con `db.transaction()` para evitar lecturas sucias o corrupción ante fallos concurrentes. |
| **VIZ-031** | V4 | `apps/server/src/db/index.ts` | **Sin `statement_timeout` en base de datos:** El motor SQLite (`better-sqlite3`) no configura timeouts en consultas concurrentes complejas, exponiendo el backend a bloqueos indefinidos si el archivo `.db` se satura. | Establecer `db.pragma('busy_timeout = 5000')` en la inicialización de SQLite para evitar bloqueos prolongados. |
| **VIZ-040** | V4 | `apps/web/src/App.tsx` | **Falta de Error Boundaries dedicados por componente:** La pantalla de salud y los visualizadores solo cuentan con un `ErrorBoundary` global en el router. Si un SVG interactivo falla, la aplicación completa se cae. | Envolver cada panel de visualización o gráfico en una instancia local del componente `<ErrorBoundary>` para mantener el sidebar y demás KPIs intactos ante fallos individuales. |
| **VIZ-041** | V4 | `apps/web/src/pages/CausalDagPage.tsx` | **Gráficas y flujos en blanco sin EmptyState premium:** Cuando no hay un proyecto seleccionado o datos disponibles, se renderizan textos planos sin estilo como `<div>No project selected.</div>`. | Reemplazar los retornos de fallback por el componente premium `<EmptyState>` (ya disponible en `EmptyState.tsx`) inyectando íconos relevantes, descripciones claras y llamadas a la acción (CTAs). |

---

### 🟠 P1 — Importantes (Media Prioridad)

| ID | Módulo | Archivo | Descripción del Hallazgo | Fix Recomendado |
|:---|:---|:---|:---|:---|
| **VIZ-012** | V2 | `apps/web/src/components/ScoreGrid.tsx` | **Colores hexadecimales hardcodeados en código JSX:** Se inyectan colores fijos en la UI como `#6366f1` (violeta), `#22c55e` (verde), `#ef4444` (rojo) en lugar de consumir variables semánticas. | Sustituir los strings de color inline por variables CSS (`var(--cs-accent)`, `var(--cs-success)`, `var(--cs-error)`). |
| **VIZ-013** | V2 | `apps/web/src/pages/EfficiencyFrontierPage.tsx` | **Font Family e inline styles sin tokens centrales:** La tipografía y estilos de grids SVG usan strings fijos en vez de heredar del sistema tipográfico tokenizado. | Configurar fuentes usando `var(--font-sans)` en todos los textos y labels dibujados. |
| **VIZ-022** | V3 | `apps/web/src/pages/PortfolioMatrixPage.tsx` | **Lógica de gradientes y opacidades fija:** Se inyectan fondos transparentes rígidos como `fill="#6366f108"` que causan ilegibilidad si el contraste de fondo varía. | Usar gradientes definidos por tokens CSS o aplicar opacidad dinámica según el modo activo (`dark ? 0.15 : 0.06`). |
| **VIZ-024** | V3 | `apps/web/src/pages/PortfolioMatrixPage.tsx` | **Líneas de división de cuadrícula hardcodeadas:** Se pintan ejes cartesianos con `stroke="rgba(255,255,255,0.15)"` que se pierden visualmente en modo claro. | Mapear la cuadrícula del gráfico a variables de borde globales (`stroke="var(--cs-border)"`). |
| **VIZ-032** | V4 | `apps/server/src/modules/pipeline/routes.ts` | **Ausencia de fallbacks de baseline en agregaciones:** Rutas como `/history/:projectId` fallan arrojando códigos `500` ante excepciones de IO en SQLite en lugar de proveer datos simulados seguros. | Envolver consultas en bloques `try/catch` de contingencia y retornar una respuesta mock de baseline cuando el sistema persista en error. |
| **VIZ-043** | V4 | `apps/web/src/pages/HealthDashboardPage.tsx` | **Peticiones pesadas sin `AbortController`:** La consulta a `healthDashboard` y eventos SSE se ejecutan sin mecanismos de cancelación al desmontar el componente. | Implementar `AbortController` en los `useEffect` de llamada de red y abortar las peticiones en la función de limpieza (`cleanup`). |
| **VIZ-050** | V5 | `apps/web/src/pages/PortfolioMatrixPage.tsx` | **Lógica de graficación duplicada empotrada directamente en la página:** El cálculo de coordenadas y los nodos SVG interactivos ocupan más de 100 líneas del archivo de ruta. | Extraer el renderizado interactivo a componentes dedicados bajo `components/charts/` como `<StrategicPositioningMap.tsx>`. |
| **VIZ-051** | V5 | `apps/web/src/` | **Registros duplicados o desordenados de componentes:** La inicialización de configuraciones de graficación no está centralizada en un entry point principal. | Consolidar la inicialización en `main.tsx` o `App.tsx` para evitar ejecuciones repetidas de configuración de canvas/gráficos. |

---

### 🟡 P2 — Menores / Higiene (Baja Prioridad)

| ID | Módulo | Archivo | Descripción del Hallazgo | Fix Recomendado |
|:---|:---|:---|:---|:---|
| **VIZ-014** | V2 | `apps/web/src/pages/CausalDagPage.tsx` | **Tooltips de navegación construidos de forma ad-hoc:** La tarjeta flotante del DAG Pearl simula blur, pero no usa un componente reutilizable de tooltip de la plataforma. | Definir un `<RichTooltip>` estándar con glassmorphism de CSS reutilizable. |
| **VIZ-034** | V4 | `apps/server/src/modules/pipeline/routes.ts` | **Sin cache local para llamadas costosas:** Métodos como `runCausalMapper` en la ruta `/causal/:projectId` recalculan matrices probabilísticas en cada request. | Añadir almacenamiento en caché temporal en memoria o en SQLite para los resultados de agregación e inferencia de red con TTL de 5 minutos. |
| **VIZ-044** | V4 | `apps/web/src/pages/HealthDashboardPage.tsx` | **Carga visual con spinners genéricos:** La app muestra un spinner de refresco texto plano (`⟳ Actualizando...` / `Calculando...`) que rompe la experiencia fluida del usuario. | Diseñar loaders basados en shimmer y skeletons (`<SkeletonCard>`) adaptados al tamaño de los paneles de salud de los proyectos. |
| **VIZ-052** | V5 | `apps/web/src/components/` | **Ausencia de archivo Barrel Export (`index.ts`):** Falta un punto de exportación unificado, forzando importaciones directas de archivos individuales. | Crear `apps/web/src/components/index.ts` que unifique y re-exporte los componentes comunes. |
| **VIZ-053** | V5 | `apps/web/src/components/ScoreGrid.tsx` | **Duplicación de lógica de formateo numérico:** El formateo de escalas `transform: scaleX(val / 100)` y grades se calcula de manera repetida. | Centralizar funciones formateadoras de datos BI en una utilidad `apps/web/src/utils/format.ts`. |

---

### 🟢 P3 — Oportunidades de Mejora

- **VIZ-054 (Ausencia de README de Adopción):** No hay guías para desarrolladores en el codebase que detallen el estándar premium de gráficos ni cómo interactuar con el modelo causal Pearl o el frontier chart de manera visual. *Fix recomendado:* Escribir `apps/web/src/components/charts/README.md` con especificaciones de diseño y código modelo.

---

## 3. Catálogo de Componentes Compartidos

| Componente Estándar | Existe | Ubicación | Soporte Dark | Observaciones |
|:---|:---:|:---|:---:|:---|
| **TrendAreaChart** | ❌ **No** | N/A | ❌ | Faltante crítico. Requerido para tendencias SAC históricas. |
| **DistributionBar** | ❌ **No** | N/A | ❌ | Faltante crítico. Requerido para desgloses de KPIs de proyectos. |
| **ProductTreemap** | ❌ **No** | N/A | ❌ | No requerido de inmediato, pero deseable para el análisis de portafolio. |
| **PipelineDonut** | ❌ **No** | N/A | ❌ | Deseable para visualizar la distribución de hallazgos del Swarm. |
| **DashboardShell** | ❌ **No** | N/A | ❌ | Reemplazado por layout ad-hoc directamente en `App.tsx` y `Sidebar.tsx`. |
| **KpiCard** | ❌ **No** | N/A | ❌ | Se usan cards personalizadas genéricas (`class="card"`) sin modularización. |
| **KpiRow** | ❌ **No** | N/A | ❌ | Lógica de grid empotrada en las páginas principales. |
| **ChartCard** | ❌ **No** | N/A | ❌ | No se tiene un contenedor común con controles de fullscreen o descarga. |

---

## 4. Safe-Fix Plan (Ordenado por Impacto)

Para elevar la plataforma de un score de **3.4 a 10/10**, se propone la siguiente ruta de refactorización progresiva y segura:

### Fase 1: Cimientos y Tokens de Diseño (Estabilidad y Diseño)
1. **Ampliar `index.css` / Crear `design-tokens.css`:** Mapear todos los colores de marca (`--chart-1` a `--chart-8`), colores KPI semánticos (`--kpi-positive`, `--kpi-negative`, `--kpi-warning`), y variables de superficie.
2. **Reemplazar hexadecimales hardcodeados:** Sustituir los strings de colores inline en `ScoreGrid.tsx`, `PortfolioMatrixPage.tsx` y `EfficiencyFrontierPage.tsx` por las variables CSS recién creadas.

### Fase 2: Robustez en Capa de Datos (Resiliencia Backend)
1. **Configurar Timeout SQLite:** Añadir `db.pragma('busy_timeout = 5000')` en `apps/server/src/db/index.ts`.
2. **Implementar Manejo Seguro en Rutas:** Crear un helper simple de rollback o transacciones seguras para consultas pesadas del pipeline estratégico.
3. **Caché en Backend:** Configurar un caché básico con expiración de 5 minutos para el endpoint de inferencia causal probabilística (`/causal/:projectId`).

### Fase 3: Modularidad en Frontend (Experiencia Premium)
1. **Refactorizar SVGs a Componentes Reutilizables:** Extraer los gráficos de `PortfolioMatrixPage` y `EfficiencyFrontierPage` a componentes aislados en la carpeta `components/charts/`.
2. **Implementar variante `dark` en visualizaciones:** Incorporar la prop `dark` en los componentes de gráficos para reaccionar fluidamente a los cambios de tema del layout de Connected Strategy.
3. **Integrar `<EmptyState>` y Skeletons:** Cambiar las pantallas en blanco o con spinners de texto por skeletons estilizados y el componente EmptyState premium disponible.
4. **Agregar `AbortController`:** Modificar los hooks de fetch en dashboards para cancelar llamadas de red pendientes cuando el usuario navegue velozmente entre proyectos.

### Fase 4: Limpieza e Higiene de Arquitectura
1. **Crear Barrel Exports:** Unificar exportaciones mediante `index.ts` en `components/`.
2. **Centralizar utilidades de formato:** Reubicar formateadores BI en un único helper compartido.
3. **Escribir documentación de adopción:** Crear el manual `README.md` en la carpeta de componentes visuales.
