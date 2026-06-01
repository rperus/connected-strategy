# Reporte de Visión Holística y Zero-UI (Fase 4)

Este reporte evalúa la integración entre el cerebro estratégico (los Agentes de IA en `packages/agents/src/v3/`) y los terminales de interacción del usuario (las Páginas Web React en `apps/web/src/pages/`), bajo los marcos de **Connected Strategy (Sense-Transmit-React)** y **Anticipatory Design (Zero-UI)**.

---

## 1. Detección de Silos UI vs AI (Desconexiones Críticas)
En un sistema *Sensing-Responding* ideal, cada página de la interfaz que captura o muestra información estratégica debe estar directamente conectada a un agente o flujo de IA. La auditoría del grafo revela los siguientes silos:

### Silo A: "Worksheets Fragmentados" (`WorksheetsPage.tsx`)
* **Problema:** El usuario pasa horas completando manualmente 15 cuestionarios Wharton (`ws01` a `ws15`) línea por línea en la interfaz de usuario.
* **Diagnóstico del Grafo:** `WorksheetsPage.tsx` está conectado únicamente a la base de datos CRUD (`worksheets/routes.ts` ⇄ `repositories/worksheets.ts`). El agente `runWorksheetSynthesizer()` de IA está completamente desacoplado de esta página; solo se ejecuta al final de todo el pipeline en la sombra.
* **Consecuencia:** Cero proactividad. El sistema actúa como un formulario pasivo (Base de Datos glorificada) en lugar de una Control Tower proactiva.

### Silo B: "El Observador Ciego" (`SwarmComparatorPage.tsx`)
* **Problema:** La página que permite comparar hallazgos entre múltiples proyectos está aislada.
* **Diagnóstico del Grafo:** El agente `runCompetitorIntelligence()` y el comparador del swarm no inyectan de forma dinámica sugerencias ni alertas en esta vista. Los datos son estáticos e históricos.

---

## 2. Tres Oportunidades de Automatización Proactiva (Zero-UI)
Basándonos en la estructura de flujos detectada en el grafo de la plataforma, proponemos transformar tres interacciones manuales pesadas en flujos automatizados de **Cero Interfaz**:

### Oportunidad 1: Llenado Anticipativo de Cuestionarios (Pre-Flight Auto-Fill)
* **Flujo Manual Actual:** El usuario debe leer archivos de un proyecto y responder manualmente las preguntas de Wharton sobre la experiencia del cliente y la cadena de valor en `WorksheetsPage`.
* **Transformación Zero-UI:**
  1. En cuanto el usuario registra la ruta de un proyecto (`LauncherPage`), el agente `runCodeCartographer` mapea la arquitectura y el agente `runSyntheticConsultant` realiza una ingesta RAG de la base de conocimiento Wharton.
  2. El sistema **autocompleta proactivamente el 80% de los campos** de las 15 Worksheets con borradores de alta fidelidad respaldados por citas de código y documentación.
  3. **Interacción Zero-UI:** El usuario no escribe; solo revisa, corrige y aprueba con un solo clic.

### Oportunidad 2: Detección Automática de Churn y Riesgos de Portafolio
* **Flujo Manual Actual:** El usuario entra a `HealthDashboardPage` para buscar anomalías y ver qué proyectos están cayendo en obsolescencia o contradicciones estratégicas.
* **Transformación Zero-UI:**
  1. El programador asíncrono (`scheduler.ts`) ejecuta el agente `runAnomalyDetector()` y `runTemporalAnalyst()` en segundo plano cada vez que hay cambios en los archivos o commits (monitoreados vía `runGit()`).
  2. Si se detecta un declive de salud (ej. aumento del acoplamiento o pérdida de resiliencia en `computeStrategicMetrics`), se envía una notificación proactiva (SSE stream) y se pre-redacta una propuesta de remediación.

### Oportunidad 3: Generación Autónoma de Pull Requests Estratégicos (Self-Healing Code)
* **Flujo Manual Actual:** El usuario lee las propuestas en `ProposalsPage`, copia los constraints, escribe el código y hace commit manualmente.
* **Transformación Zero-UI:**
  1. El agente `runAutonomousExecutor` toma una propuesta aprobada en `ProposalsPage`.
  2. Crea una rama de git (`runGit()`), genera el código de parche, corre `pnpm typecheck` para asegurar compilación limpia y **crea un Pull Request en GitHub de forma autónoma**.
  3. **Interacción Zero-UI:** El desarrollo estratégico ocurre sin fricción manual.

---

## 3. Propuesta de Nuevas Conexiones Estratégicas (Nuevas Aristas)
Para romper los silos UI vs AI, proponemos inyectar 3 nuevas aristas en el grafo del sistema:
1. `runWorksheetSynthesizer() --outputs_draft_to--> WorksheetsPage` (Para autocompletado proactivo).
2. `runAnomalyDetector() --triggers_alert_in--> CoachPanel` (Para inyección de alertas de contradicciones en tiempo real en la HomePage).
3. `runHandoffPhase() --generates_boardroom_deck_for--> BriefingPage` (Exportación automatizada y directa de reportes corporativos).
