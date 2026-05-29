## 📊 Visualization Premium Audit — Connected Strategy

### 1. Resumen Ejecutivo

| Módulo | Score | Hallazgos |
|--------|-------|-----------|
| V1: Library Hygiene | ✅ 10/10 | 0 legacy imports (No se usan librerías externas de gráficas) |
| V2: Design Tokens | 🔴 2/10 | Múltiples colores hardcodeados; sin `design-tokens.css` |
| V3: Dark Mode Ready | 🔴 0/10 | Ausencia total de soporte dark mode a nivel de variables de entorno UI |
| V4: Data Resilience | 🔴 3/10 | Falta de Skeleton/Shimmers y AbortControllers; sin componentes shell |
| V5: Component Architecture | 🔴 1/10 | Faltan 8 componentes estándar; gráficas generadas manualmente con `<svg>` |
| **Overall Premium Score** | **3.2/10** | **VEREDICTO: NO-GO** |

**Tabla de Severidad:**
- 🔴 **P0 (Críticos):** 6
- 🟠 **P1 (Mayores):** 15 (incluyendo 8 componentes faltantes)
- 🟡 **P2 (Menores):** 8

**Veredicto:** NO-GO. El frontend actualmente usa `<svg>` crudos para visualizaciones complejas (Activity Map, Five Forces, Flywheel, RadarChart) con cientos de códigos HEX inline (`#6366f1`, `#10b981`, etc). No hay un sistema de tokens de diseño, carece de estandarización en ECharts, y los componentes de visualización no soportan el `dark?: boolean` de manera programática.

---

### 2. Tabla Consolidada de Diagnóstico

| ID | Sev | Qué buscar | Estado | Detalle |
|----|-----|------------|--------|---------|
| VIZ-001 | 🔴 P0 | `recharts` | ✅ Pass | No importado |
| VIZ-002 | 🔴 P0 | `chart.js` | ✅ Pass | No importado |
| VIZ-003 | 🔴 P0 | `victory` | ✅ Pass | No importado |
| VIZ-004 | 🟠 P1 | `nivo` | ✅ Pass | No importado |
| VIZ-005 | 🟠 P1 | `react-vis` | ✅ Pass | No importado |
| VIZ-006 | 🟡 P2 | `d3` directo | ✅ Pass | No importado |
| VIZ-007 | 🟡 P2 | Dependencies legacy | ✅ Pass | No detectadas en package.json |
| VIZ-010 | 🔴 P0 | `design-tokens.css` | ❌ Fail | Inexistente. Se usa `index.css` sin centralizar variables `--chart-*`. |
| VIZ-011 | 🔴 P0 | `echarts-theme.ts` | ❌ Fail | Inexistente. |
| VIZ-012 | 🟠 P1 | Colores hex hardcodeados | ❌ Fail | Cientos de variables inline (ej. `RadarChart.tsx`, `Sidebar.tsx`). |
| VIZ-013 | 🟠 P1 | Font family no es Inter | ❌ Fail | Uso inconsistente: `Outfit`, `var(--font-display)`, `monospace`. |
| VIZ-014 | 🟡 P2 | Tooltip glassmorphism | ❌ Fail | No implementado. |
| VIZ-015 | 🟡 P2 | Grid `containLabel` | ❌ Fail | No implementado. |
| VIZ-016 | 🟡 P2 | Animación premium | ❌ Fail | Renderizado `<svg>` estático o sin interpolación bezier centralizada. |
| VIZ-020 | 🔴 P0 | Chart prop `dark` | ❌ Fail | Componentes como `RadarChart` no lo aceptan. |
| VIZ-021 | 🔴 P0 | Tema dark en echarts | ❌ Fail | Inexistente. |
| VIZ-022 | 🟠 P1 | `getThemeName(dark)` | ❌ Fail | Inexistente. |
| VIZ-023 | 🟠 P1 | Gradientes dark | ❌ Fail | Gradientes fijos o con opacidades no adaptativas (`rgba(99,102,241,0.2)`). |
| VIZ-024 | 🟠 P1 | Split line color | ❌ Fail | Harcodeado (ej. `rgba(255,255,255,0.08)`). |
| VIZ-025 | 🟡 P2 | Axis label color | ❌ Fail | No se adapta. |
| VIZ-026 | 🟡 P2 | Inline styles light colors| ❌ Fail | N/A (el soporte dark/light está hardcodeado sin variante light). |
| VIZ-040 | 🔴 P0 | Componentes compartidos | ❌ Fail | Falta `DashboardShell`, `KpiRow`, `KpiCard`, `ChartCard`. |
| VIZ-041 | 🔴 P0 | Gráfica vacía -> EmptyState| ❌ Fail | Se retorna `null` o un spinner manual en componentes principales. |
| VIZ-042 | 🟠 P1 | KPI sparklines/deltas | ❌ Fail | Ausentes en resúmenes. Solo se exponen barras genéricas. |
| VIZ-043 | 🟠 P1 | AbortController fetchers | ❌ Fail | Endpoint pesado `healthDashboard` se invoca sin AbortController. |
| VIZ-044 | 🟡 P2 | Shimmer/skeleton | ❌ Fail | Uso de fallback visual `⟳` estático, sin efecto de carga perceptivo. |
| VIZ-050 | 🟠 P1 | Chart wrapper duplicado | N/A | No hay librerías de charts para duplicar en un wrapper. |
| VIZ-051 | 🟠 P1 | Theme multi-registro | N/A | |
| VIZ-052 | 🟡 P2 | Barrel export (`index.ts`)| ❌ Fail | Ausente en `src/components/`. |
| VIZ-053 | 🟡 P2 | Format utils duplicados | ❌ Fail | `new Date().toLocaleString()` es invocado inline repetidamente. |

---

### 3. Detalle de P0s/P1s y Safe-Fix Plan

#### Hallazgos Críticos (P0 & P1)

1. **[P0] Ausencia de `ECharts` y Estandarización Gráfica:** 
   - *Impacto:* Se construyeron visualizaciones a mano con `<svg>` (ej. RadarChart, FiveForces, CausalDag), lo que no es escalable, no es resiliente ni facilita tooltips interactivos o responsividad de primer nivel.
   - *Archivo(s):* Múltiples páginas y `src/components/RadarChart.tsx`.
2. **[P0] Inexistencia de Design Tokens y Tema Oscuro Centralizado:**
   - *Impacto:* Rompe el principio de plataforma $10K/mes. La paleta de colores vive regada a lo largo del codebase (`#6366f1`, `#10b981`, `#f59e0b`).
   - *Archivo(s):* `index.css`, y docenas de componentes con estilos `style={{ color: '#ef4444' }}`.
3. **[P1] Faltan 8 Componentes Core de Visualización:**
   - *Impacto:* Violación directa al catálogo estándar de Balam OS (TrendAreaChart, DistributionBar, ProductTreemap, PipelineDonut, DashboardShell, KpiCard, KpiRow, ChartCard).
4. **[P1] Manejo de Fetchers sin AbortController:**
   - *Impacto:* Riesgo de memory leaks y race conditions en `HealthDashboardPage.tsx` al despachar peticiones sin abortar las en vuelo al desmontar el componente.

#### Safe-Fix Plan (Orden de Ejecución Sugerido)

1. **V2 & V3 - Instaurar Ecosistema de Diseño (Tokens):**
   - Crear `src/design-tokens.css` y mover los colores inline hacia el archivo, exponiendo `--chart-1` hasta `--chart-8` y sus correspondientes de Kpi (e.g., `--kpi-positive`).
2. **V1 - Implementación de ECharts:**
   - Instalar `echarts` y `echarts-for-react`.
   - Generar la base `echarts-theme.ts` implementando el tema light y dark (`getThemeName`).
3. **V5 - Arquitectura y Catálogo UI:**
   - Desarrollar la librería compartida de KPIs (`KpiCard`, `KpiRow`) y Shell (`DashboardShell`).
   - Mover el formateo de datos dispersos (`toLocaleString`) a `src/utils/format.ts`.
4. **V4 - Refactorización de Resiliencia y Datos:**
   - Añadir soporte a `AbortController` en los `useEffect` de las llamadas pesadas de APIs (ej. en `HealthDashboardPage`).
   - Substituir `null` y strings por `<EmptyState />` o el shimmer de `React.Suspense` en los loaders.
5. **V4 - Migración Gradual de SVGs a ECharts:**
   - Refactorizar gradualmente `<RadarChart />` y las gráficas interactivas (`FiveForcesPage`, `FlywheelPage`) para utilizar ReactECharts.
