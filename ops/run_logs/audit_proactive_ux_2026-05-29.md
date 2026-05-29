# 🧠 Auditoría Proactive UX — Reporte de Diagnóstico

**Fecha:** 2026-05-29
**Proyecto:** Connected Strategy (Local/Desktop, React+Vite, Node+SQLite)
**Frameworks Usados:** Connected Strategy, Anticipatory Design, Jobs-to-be-Done, Friction Auditing, Hook Model, Octalysis.

---

## 1. Resumen Ejecutivo

**Veredicto Final:** 🟡 ACEPTABLE (Score: 68/100)
**Nivel Connected Strategy:** Nivel 2 (Curated Offering / Transitioning to Coach)

| Severidad | Cantidad | Descripción |
|---|---|---|
| **P0 (Crítico)** | 1 | Fricción emocional: Acciones destructivas sin confirmación. |
| **P1 (Alto)** | 4 | Polling ineficiente, Fricción Cognitiva (Jerga), Layout intrusivo, Mobile UX. |
| **P2 (Medio)** | 8 | Falta de notificaciones proactivas, roles, y estados interactivos de Copilot. |

**Top 3 Hallazgos Críticos:**
1. **[P0] Botón Destructivo Inseguro:** El botón "Limpiar Demo" (HomePage) borra datos y recarga inmediatamente sin alerta ni confirmación.
2. **[P1] Fricción Cognitiva (Jerga):** UI expone términos técnicos ("Jobs", "Pipeline", "Prompts") al usuario final que rompen el JTBD.
3. **[P1] Arquitectura de Transmisión (Polling):** Polling agresivo múltiple (`usePolling.ts` cada 5s/8s/10s) en lugar de un canal asíncrono (SSE).

---

## 2. Tabla Consolidada de Diagnóstico (Verification Gate)

| ID | Check | Framework | Resultado | Severidad |
|---|---|---|---|---|
| PX.1 | No User Memory | SENSE | ✅ PASS | - |
| PX.2 | No Role Adaptation | SENSE | ❌ FAIL | P2 |
| PX.3 | No Context Awareness | SENSE | ❌ FAIL | P3 |
| PX.4 | No Usage Analytics | SENSE | ❌ FAIL | P2 |
| PX.5 | No Background Compute | TRANSMIT | ✅ PASS | - |
| PX.6 | No Event Pipeline | TRANSMIT | ❌ FAIL | P1 |
| PX.7 | No Scoring Engine | TRANSMIT | ✅ PASS | - |
| PX.8 | No Real-Time Channel | TRANSMIT | ❌ FAIL | P2 |
| PX.9 | No Curated Highlights | REACT | ✅ PASS | - |
| PX.10 | No Proactive Alerts | REACT | ✅ PASS | - |
| PX.11 | No Deadline Awareness | REACT | ➖ N/A | - |
| PX.12 | No Auto-Reports | REACT | ❌ FAIL | P2 |
| PX.13 | No Smart Defaults | ANTICIPATORY | ✅ PASS | - |
| PX.14 | No Auto-Fill | ANTICIPATORY | ✅ PASS | - |
| PX.15 | No Auto-Save | ANTICIPATORY | ✅ PASS | - |
| PX.16 | No Stale Data Warning | ANTICIPATORY | ❌ FAIL | P2 |
| PX.17 | No Contextual Help | ANTICIPATORY | ✅ PASS | - |
| PX.18 | No Onboarding | ANTICIPATORY | ✅ PASS | - |
| PX.19 | Button Solves Wrong Job | JTBD | ❌ FAIL | P1 |
| PX.20 | Too Many Steps | JTBD | ✅ PASS | - |
| PX.21 | Config Over Result | JTBD | ✅ PASS | - |
| PX.22 | No Direct Integration | JTBD | ❌ FAIL | P2 |
| PX.23 | Cognitive Friction (Jerga) | FRICTION | ❌ FAIL | P1 |
| PX.24 | Operative Friction | FRICTION | ✅ PASS | - |
| PX.25 | Emotional Friction | FRICTION | ❌ FAIL | P0 |
| PX.26 | Can Eliminate | FRICTION | ❌ FAIL | P2 |
| PX.27 | Can Automate | FRICTION | ❌ FAIL | P1 |
| PX.28 | Can Hide | FRICTION | ✅ PASS | - |
| PX.29 | TTV High | FRICTION | ✅ PASS | - |
| PX.30 | No Wow Moment | FRICTION | ✅ PASS | - |
| PX.31 | Habit Hook Triggers | HOOK | ❌ FAIL | P2 |
| PX.32 | Variable Rewards | HOOK | ✅ PASS | - |
| PX.33 | Investment Mechanics | HOOK | ✅ PASS | - |
| PX.34 | Progress & Accomplishment Loop | OCTALYSIS | ✅ PASS | - |
| PX.35 | Power-ups & Mastery | OCTALYSIS | ✅ PASS | - |
| PX.36 | Mobile & PWA Optimization | HOOK | ❌ FAIL | P1 |
| PX.37 | Dopamine Contrast Guard | OCTALYSIS | ✅ PASS | - |
| PX.38 | Gamified Core Loops | OCTALYSIS | ✅ PASS | - |
| PX.39 | Copilot Sidebar Integration | LUMI | ❌ FAIL | P1 |
| PX.40 | Autonomy Bezel Safety | LUMI | ❌ FAIL | P2 |
| PX.41 | Interactive Decision Cards | LUMI | ❌ FAIL | P2 |
| PX.42 | Swarm Directives & Math | LUMI | ❌ FAIL | P3 |
| PX.43 | Landing Page Exclusion | LUMI | ✅ PASS | - |

---

## 3. Detalle de P0s/P1s y Safe-Fix Plan

### P0. Acción Destructiva sin Confirmación (PX.25)
- **Problema:** El botón "Limpiar Demo" (`HomePage.tsx`) hace un DELETE seguido de un `window.location.reload()` sin advertencia.
- **Safe-Fix Plan:** Modificar el `onClick` para desplegar un Modal o un popconfirm seguro. O mover este botón a una sección "Avanzada" en `/settings`.
- **Justificación:** Fricción emocional crítica al no proveer red de seguridad ante clics accidentales.

### P1. Polling Ineficiente (PX.6, PX.27)
- **Problema:** `usePolling.ts` efectúa polling HTTP intenso. Múltiples timers en `HomePage.tsx` congestionan el network loop.
- **Safe-Fix Plan:** Migrar los stats de colas (`api.analysisStats`) y la métricas vivas a Server-Sent Events (SSE). 
- **Justificación:** Transmit dimension (Connected Strategy) requiere canales directos y no consumo innecesario de recursos.

### P1. Fricción Cognitiva por Jerga Técnica (PX.19, PX.23)
- **Problema:** Labels técnicos como "Pipeline", "Prompts para Antigravity", y "Jobs".
- **Safe-Fix Plan:** Cambiar botón "Pipeline" por "Analizar Portafolio Completo". Reemplazar el conteo de "Jobs" por "Tareas procesadas".
- **Justificación:** JTBD establece que el usuario quiere resultados de negocio, no controlar procesos backend.

### P1. Layout Invasivo de StrategyCopilot (PX.39)
- **Problema:** El chat renderiza de forma flotante con z-index alto en lugar de empujar el layout.
- **Safe-Fix Plan:** Actualizar el grid de `App.tsx` (`app-layout`) usando variables de CSS para reservar ancho en pantalla de escritorio cuando `isOpen` sea true.
- **Justificación:** Prevención de oclusión de datos, alineado a UX B2B premium.

### P1. Mobile Responsiveness Ausente (PX.36)
- **Problema:** El menú lateral asume viewport infinito; carece de drawer state para teléfonos.
- **Safe-Fix Plan:** Implementar un botón "Hamburguesa" y estado colapsable mediante CSS media-queries (`@media (max-width: 768px)`).
- **Justificación:** Las mecánicas de Hook/Notificaciones requieren visualización perfecta en Mobile/PWA.
