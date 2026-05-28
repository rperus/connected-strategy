# 👁️ Reporte de Auditoría Visual — Connected Strategy

**Fecha:** 2026-05-26
**URL auditada:** http://127.0.0.1:4310
**Páginas inspeccionadas:** 10 routes (/, /quick-start, /health, /portfolio, /launcher, /worksheets, /competitive, /business-model, /causal, /agents, /proposals)
**Score Visual:** 30/100 (Crítico)

---

## 📊 Executive Summary

| Check | Hallazgos P0 | P1 | P2 | P3 |
|---|:---:|:---:|:---:|:---:|
| **V.1 Primera Impresión** | 0 | 0 | 0 | 0 |
| **V.2 Data Sanity** | 0 | 0 | 0 | 0 |
| **V.3 Contraste** | 2 | 1 | 0 | 0 |
| **V.4 Sidebar Doppelgängers** | 0 | 0 | 0 | 0 |
| **V.5 Micro-Scroll Traps** | 0 | 0 | 0 | 0 |
| **V.6 Coherencia Semántica** | 0 | 0 | 1 | 0 |
| **V.7 Indicadores Redundantes** | 0 | 0 | 0 | 0 |
| **V.8 Componentes Rotos (CORS)** | 1 | 0 | 0 | 0 |
| **V.9 Responsive** | 0 | 1 | 0 | 0 |

---

## 🔴 TOP Findings

### 1. P0 — Error de Política CORS en la API (Bloqueo de Peticiones Live)
- **Tipo:** Componente Roto/Conexión Fallida (V.8)
- **Síntomas:** La consola del navegador se inunda con errores `net::ERR_FAILED` al intentar hacer fetch a `http://127.0.0.1:4311/api/projects`, `http://127.0.0.1:4311/api/health`, etc.
- **Evidencia:** 
  > Access to fetch at 'http://127.0.0.1:4311/api/projects' from origin 'http://127.0.0.1:4310' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
- **Impacto:** Rompe toda la integración activa del backend (live pipelines) en el frontend.
- **Fix recomendado:** Añadir middleware CORS en Express (`apps/server/src/index.ts` o equivalente) que permita explícitamente el origen `http://127.0.0.1:4310` y soporte cabeceras/métodos requeridos.

### 2. P0 — Contraste Crítico en el Selector de Proyecto Activo
- **Tipo:** Contraste WCAG (V.3)
- **Síntomas:** El color del texto del botón del selector de proyecto activo (que renderiza "BALAM Licitaciones" y "antigravity-tenders-p") se calcula como negro puro `rgb(0,0,0)` sobre un fondo azul oscuro `rgb(26,29,46)`.
- **Ratio de Contraste:** **1.26:1** (Muy por debajo del mínimo de 4.5:1 o 3.0:1 de las pautas WCAG AA/AAA).
- **Impacto:** Texto completamente ilegible para el usuario, haciéndole casi imposible ver qué proyecto está seleccionado en el sidebar.
- **Fix recomendado:** Asegurar que el color del texto del botón se defina explícitamente en CSS/inline style como `color: var(--cs-text)` o `color: #ffffff` y no herede el color por defecto de algunos navegadores.

### 3. P0 — Contraste Crítico en Etiquetas de Sección del Sidebar
- **Tipo:** Contraste WCAG (V.3)
- **Síntomas:** Las etiquetas de sección del sidebar como `INICIO`, `PROYECTOS`, `ANÁLISIS` tienen color gris opaco `rgb(84,89,122)` sobre el fondo oscuro general del sidebar `rgb(18,21,31)`.
- **Ratio de Contraste:** **2.68:1** (Crítico).
- **Impacto:** Fricción cognitiva inmediata. Cuesta mucho leer los nombres de las secciones principales.
- **Fix recomendado:** Incrementar la luminosidad del color CSS `var(--cs-text-muted)` de `#54597a` a una variante más clara como `#8a90bd` o similar.

### 4. P1 — Desbordamiento en Viewport Móvil (Scroll Horizontal)
- **Tipo:** Responsive Spot Check (V.9)
- **Síntomas:** En viewports con ancho móvil (por ejemplo, 375px/500px), los contenedores de `.sidebar-section`, `.sidebar-nav` y varios elementos de tablas (`TABLE`) tienen anchos fijos de `560px` y `708px` que desbordan la pantalla de forma masiva.
- **Impacto:** Destruye completamente la experiencia táctil, obligando al usuario a realizar scroll horizontal incómodo y ver contenido cortado.
- **Fix recomendado:** Añadir media-queries (`@media (max-width: 768px)`) en `index.css` que reduzcan el padding del sidebar, contraigan o colapsen el sidebar por completo a un menú hamburguesa, y hagan que las tablas usen scroll interno local (`overflow-x: auto`) en lugar de estirar toda la página.

### 5. P1 — Bajo Contraste en Iconos del Sidebar
- **Tipo:** Contraste WCAG (V.3)
- **Síntomas:** Los iconos emoji (`📖`, `🏥`, etc.) tienen un color violeta oscuro `rgb(99,102,241)` sobre el fondo del sidebar `rgb(18,21,31)`.
- **Ratio de Contraste:** **4.08:1** (Bajo contraste, mínimo recomendado es 4.5:1 para iconos funcionales o interactivos).
- **Fix recomendado:** Usar colores más brillantes/vivos para los estados activos y en reposo de los iconos interactivos del menú.

### 6. P2 — Incoherencia Semántica en Worksheets (Customer Journey Map)
- **Tipo:** Coherencia Semántica (V.6)
- **Síntomas:** En la ruta `/worksheets`, el título prominente de sección es `CUSTOMER JOURNEY MAP`. Sin embargo, debajo de él solo hay formularios de texto plano y campos de entrada; no existe ningún componente visual interactivo de mapa, canvas, o diagrama de flujo.
- **Impacto:** Confusión o decepción en el usuario al esperar un diagrama interactivo/mapa cuando solo es un cuestionario textual.
- **Fix recomendado:** Cambiar el título a "Customer Journey Questionnaire" o añadir un pequeño flujo gráfico interactivo o SVG dinámico como "Affordance" del mapa conceptual.

---

## 📸 Screenshots Evidencia
El screenshot de la página de inicio se ha guardado exitosamente en local en:
- `C:\Users\Admin\.gemini\antigravity\brain\9fa8fbb5-ed0a-442d-a975-4d299f087217\screenshot_home.png`

---

## 🏁 Verification Gate

Para cumplir el proceso estricto de auditorías visuales y la validación de Antigravity, completamos la siguiente matriz:

| Fase de Verificación | Método | Estatus | Notas / Evidencia |
|---|---|---|---|
| **0. Detención de Servidor** | Inspección de puertos local | **PASS** | El puerto `4310` responde activamente con la UI del dashboard en runtime. |
| **1. Mapeo de Spider** | Análisis de `App.tsx` + `Sidebar.tsx` | **PASS** | Identificados más de 10 destinos, cubriendo inicio, estrategia, inteligencia y acción. |
| **2. Contraste WCAG** | DOM Evaluator Script (Luminance ratio) | **FAIL (P0)** | El botón del Selector de Proyecto Activo dio un ratio crítico de `1.26:1`. Las etiquetas de sección dieron `2.68:1`. |
| **3. Data Sanity** | DOM Evaluator Regex Matchers | **PASS** | No se encontraron porcentajes superiores a 100%, ni strings `NaN` o `undefined` visibles en la UI estática. |
| **4. Doppelgängers** | Comparación cruzada Main vs Sidebar links | **PASS** | La distribución y links del dashboard son coherentes con las rutas globales. |
| **5. Micro-Scroll Traps** | DOM Overflow Inspector | **PASS** | Ningún contenedor inferior a 200px con tabla tiene scroll forzado insano. |
| **6. Coherencia Semántica** | Keywords Regex vs DOM Children libraries | **FAIL (P2)** | Se detectó "CUSTOMER JOURNEY MAP" sin representación gráfica en `/worksheets`. |
| **7. Indicadores Redundantes**| Detección de roles y badges repetidos | **PASS** | El rol de la plataforma se muestra únicamente una vez en la cabecera. |
| **8. Componentes Rotos** | Auditoría de Consola de Runtime | **FAIL (P0)** | La API en el puerto `4311` bloquea los fetches debido a políticas CORS no configuradas. |
| **9. Responsive Spot Check**| Window resize a 375px/500px + ClientRect overflows | **FAIL (P1)** | Varios elementos del sidebar y tablas se estiran a 560px y 708px desbordando la pantalla móvil. |
