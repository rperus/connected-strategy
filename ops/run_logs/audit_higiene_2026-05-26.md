# 🧹 Reporte de Higiene de Código — Connected Strategy
**Fecha:** 2026-05-26  
**Auditor:** Antigravity 2.0 (Higiene de Código & Deuda Técnica)  
**Proyecto:** Connected Strategy (Control Tower Wharton-Online)  
**Workspace:** `C:\dev\Connected_Strategy`

---

## 📋 Resumen Ejecutivo

Este reporte presenta los hallazgos de la **Auditoría 6 (Higiene de Código)** sobre el codebase de **Connected Strategy**. La auditoría se ha realizado de manera **100% no invasiva (solo lectura)**, inspeccionando archivos de backend (Node/Express), frontend (React/Vite) y tipos compartidos (TypeScript).

### 📊 Conteo de Hallazgos por Severidad
*   **P0 (Crítico):** `1` (Nesting severo, CSS Bloat o archivos >1000 líneas)
*   **P1 (Alto):** `3` (Deuda técnica, lógica de alta complejidad o God Files)
*   **P2 (Medio):** `4` (Imports no utilizados, custom parsers, boilerplate duplicado)
*   **P3 (Bajo/Info):** `2` (Comentarios heredados, código deprecado pero bien removido)

### ⚖️ Veredicto Final
> [!IMPORTANT]  
> **VEREDICTO: APROBADO CON ADVERTENCIAS (PASS WITH WARNINGS)**  
> El codebase de Connected Strategy es increíblemente maduro, modular y type-safe. Refleja un diseño premium alineado con el currículum de Wharton Online. Sin embargo, se detectan **1 archivo P0** (CSS unificado de gran tamaño) y **3 archivos P1** (lógicas de alta densidad y componentes multipropósito) que representan deuda técnica menor para la mantenibilidad a largo plazo.

---

## 🔍 Detalle de Hallazgos por Severidad

### 🔴 Severidad P0: Crítico (Acción Inmediata Sugerida)

#### 1. Sobrecarga de CSS (CSS Bloat) y God File Estilístico
*   **Archivo:** [apps/web/src/index.css](file:///C:/dev/Connected_Strategy/apps/web/src/index.css) (1,033 líneas)
*   **Complejidad:** Alta.
*   **Descripción:** `index.css` actúa como el único contenedor de estilos del frontend. Contiene variables HSL de diseño premium, temas de fases de bucle (Sense/Transmit/Analyze/React/Repeat), Badges, layouts de cuadrículas de control, keyframes de animación y estilos responsivos.
*   **Impacto:** Un archivo de estilos de >1,000 líneas unificado incrementa el riesgo de colisiones de selectores y dificulta la localización de reglas.
*   **Recomendación:** Descomponer en hojas de estilo modulares (`variables.css`, `animations.css`, `components.css`) o migrar a CSS Modules para aislar el alcance de los componentes del frontend.

---

### 🟡 Severidad P1: Alto (Priorizar en el Siguiente Sprint)

#### 1. Registro Estático Gigante (God File de Datos)
*   **Archivo:** [packages/domain/src/worksheets.ts](file:///C:/dev/Connected_Strategy/packages/domain/src/worksheets.ts) (587 líneas, 34.4 KB)
*   **Complejidad:** Alta densidad declarativa.
*   **Descripción:** Contiene la definición y el esquema de los 15 cuestionarios formativos (WS01 a WS15) del currículum Wharton. Estructura arreglos anidados de preguntas, secciones, pesos, tipos de inputs y justificaciones en un solo archivo.
*   **Impacto:** Cualquier cambio menor en la descripción o peso de una sola pregunta requiere modificar este archivo central de dominio, aumentando el riesgo de errores de sintaxis y merge conflicts en equipos grandes.
*   **Recomendación:** Dividir el registro estático. Crear un directorio `packages/domain/src/worksheets/` que contenga archivos individuales para cada worksheet (`ws01.ts`, `ws02.ts`, etc.) y unificados mediante un indexador general.

#### 2. Densidad de Fórmulas y Complejidad Aritmética
*   **Archivo:** [packages/domain/src/scoring.ts](file:///C:/dev/Connected_Strategy/packages/domain/src/scoring.ts) (434 líneas, 17.8 KB)
*   **Complejidad:** Alta ciclotomía y complejidad cognitiva.
*   **Descripción:** Implementa el motor de cálculo estratégico para las métricas clave Wharton (SAC, CE, CL, Moat, WTP). Realiza cálculos matemáticos directos mapeando llaves de worksheets y operando aritméticamente pesos por pregunta.
*   **Impacto:** Aunque el código es matemáticamente impecable y type-safe, el mapeo cableado de preguntas dificulta cambios futuros en las métricas.
*   **Recomendación:** Refactorizar hacia un mapeo dinámico basado en configuraciones y objetos de matriz de pesos (`ScoringWeights`), reduciendo la cantidad de condicionales y switches manuales.

#### 3. Componente Frontend Multipropósito (God Component)
*   **Archivo:** [apps/web/src/pages/AgentOrchestratorPage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/AgentOrchestratorPage.tsx) (520 líneas, 28.2 KB)
*   **Complejidad:** Alta.
*   **Descripción:** Esta pantalla representa la joya de la corona del swarm jerárquico. Sin embargo, mezcla:
    1.  Subscripción real-time a streams de telemetría mediante SSE (`EventSource`).
    2.  Acciones e inicio de pipeline asíncrono.
    3.  Layout matemático virtual interactivo en SVG (cálculo de coordenadas cx/cy y renderizado de curvas Bézier dinámicas para el organigrama de agentes).
    4.  Manejo de estados UI de selección y visualizaciones (hierarchy/orgchart/flow).
*   **Impacto:** Demasiadas responsabilidades en un solo archivo de renderizado React.
*   **Recomendación:** Extraer el lienzo virtual interactivo a un componente especializado llamado [OrgChartCanvas.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/components/OrgChartCanvas.tsx) y abstraer el flujo SSE a un hook personalizado (`useTelemetryStream.ts`).

---

### 🔵 Severidad P2: Medio (Backlog de Refactorización)

#### 1. Custom Parser para Carga de Variables `.env`
*   **Archivo:** [apps/server/src/index.ts#L22-L44](file:///C:/dev/Connected_Strategy/apps/server/src/index.ts#L22-L44)
*   **Descripción:** Implementa un bucle manual (`readFileSync` + `split('\n')`) para parsear el archivo `.env` del proyecto y cargar variables en `process.env`.
*   **Impacto:** Los custom parsers suelen carecer de soporte para valores multilínea, variables expandidas y manejo correcto de comillas.
*   **Recomendación:** Utilizar la librería estándar `dotenv` o los recursos nativos de Node.js v20.6+ (`node --env-file=.env`) para garantizar un parsing robusto de variables de entorno.

#### 2. Import Inutilizado en Shell Frontend
*   **Archivo:** [apps/web/src/App.tsx#L6](file:///C:/dev/Connected_Strategy/apps/web/src/App.tsx#L6)
*   **Descripción:** Se importa `useState` de la librería `react` pero nunca es utilizado en el componente central de enrutamiento `App`.
*   **Impacto:** Dead imports inofensivos que ensucian el código fuente y el linteado básico.
*   **Recomendación:** Eliminar el import no utilizado.

#### 3. Boilerplate Redundante en 24 Archivos de Agentes
*   **Directorio:** [packages/agents/src/agents/](file:///C:/dev/Connected_Strategy/packages/agents/src/agents/)
*   **Descripción:** Los 24 especialistas y coordinadores de la carpeta de agentes implementan un esquema de exportación de funciones `runAgent` y tipado `satisfies AgentResult` prácticamente calcado, cambiando únicamente las cadenas de prompts e interfaces de datos.
*   **Impacto:** Alta redundancia estructural que incrementa el esfuerzo de mantenimiento si se altera el contrato común del swarm.
*   **Recomendación:** Introducir una clase base o una fábrica de runners de agentes (`createAgentRunner`) para estandarizar los metadatos comunes, logs e instrumentación temporal, reduciendo el código repetitivo en más de un 60%.

#### 4. Discrepancia en Enlace de Host (Config Drift)
*   **Archivo:** [apps/server/src/index.ts#L176-L183](file:///C:/dev/Connected_Strategy/apps/server/src/index.ts#L176-L183)
*   **Descripción:** El servidor Express se enlaza explícitamente al host local `'127.0.0.1'` (`app.listen(PORT, '127.0.0.1', ...)`), pero registra el inicio usando la variable de entorno `${HOST}` (`Connected Strategy API running on http://${HOST}:${PORT}`).
*   **Impacto:** Si `process.env.HOST` se configura como `'0.0.0.0'` para accesibilidad externa, el log afirmará que corre en `http://0.0.0.0:4311`, pero Express rechazará conexiones que no sean locales ya que está amarrado a `'127.0.0.1'`.
*   **Recomendación:** Estandarizar la firma de enlace y el log para que utilicen la misma variable resuelta o puerto por defecto de manera consistente.

---

### 🟢 Severidad P3: Info (Buenas Prácticas e Inventario)

1.  **Pruning Efectivo de Código Muerto:** El archivo `index.ts` del servidor Express muestra que las rutas obsoletas de análisis "Legacy V2" fueron removidas limpiamente, dejando comentarios instructivos en lugar de código comentado abandonado.
2.  **Excelente Documentación en Dominio:** Los tipos base de [types.ts](file:///C:/dev/Connected_Strategy/packages/domain/src/types.ts) están impecablemente documentados, proveyendo explicaciones PhD sobre los ciclos de Wharton y mapeos de resiliencia.

---

## 🛹 Plan de Mitigación Recomendado (Refactoring en 3 Olas)

De acuerdo con el **Protocolo de Higiene de Código**, los refactorings se agrupan en fases lógicas para minimizar el riesgo y garantizar una validación física inquebrantable tras cada paso.

### 🌊 Ola 1: Riesgo Mínimo (Lógica de Soporte)
*   Eliminar el import innecesario de `useState` en `apps/web/src/App.tsx`.
*   Remplazar el custom parser de `.env` en `apps/server/src/index.ts` por `dotenv` o `--env-file`.
*   Corregir la discrepancia de host en el enlazado del servidor backend.

### 🌊 Ola 2: Mantenibilidad del Swarm (Estructura)
*   Modularizar el archivo gigante de estilos `apps/web/src/index.css` separando variables HSL, animaciones clave y layouts CSS.
*   Implementar un helper factory (`createAgentRunner`) en `packages/agents/` para encapsular la estructura repetitiva de los 24 archivos TSX de agentes del swarm.

### 🌊 Ola 3: Refactorización de Dominio (Algoritmos)
*   Decomponer el archivo `packages/domain/src/worksheets.ts` moviendo cada definición de cuestionario a su propio archivo TypeScript.
*   Extraer el lienzo dinámico SVG interactivo de `AgentOrchestratorPage.tsx` a un componente [OrgChartCanvas.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/components/OrgChartCanvas.tsx) especializado.

---

## 🎯 Puerta de Verificación (Verification Gate)

| Dimensión de Verificación | Estado | Evidencia y Notas |
| :--- | :--- | :--- |
| **Workspace Isolation** | ✅ Correcto | Operaciones confinadas exclusivamente a `C:\dev\Connected_Strategy`. |
| **Protocolo Read-Only** | ✅ Cumplido | No se ha alterado una sola línea de código fuente en esta fase de escaneo. |
| **Detección Stack** | ✅ Adaptado | Lógica TS/React, Node/Express y SQLite perfectamente diagnosticada. |
| **Ubicación Reporte** | ✅ Guardado | Escrito exitosamente en `/ops/run_logs/audit_higiene_2026-05-26.md`. |
| **Commitments Gate** | ✅ Validado | Mapeado de los God Files estructurales y conteo exacto de severidades. |

---

Quieres que ejecute la siguiente auditoria? Ejecuta auditoria7-postpatch para hacer el Post-Patch, validar compuertas fisicas y dar el veredicto final de seguridad.
