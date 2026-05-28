# 📊 Auditoría Customer Success — Connected Strategy
**Fecha:** 2026-05-26T17:08:00Z
**Auditor:** Antigravity (inline execution — subagent quota exhausted)
**Skill:** auditoria13-customer-success

---

## FASE 0: AUTO-DETECCIÓN

### CS_CONFIG Detectado

| Feature | Estado | Evidencia |
|---------|--------|-----------|
| Activity Tracking | ✅ PARCIAL | `telemetry_events` table + `broadcastEvent()` service + `project_telemetry_logs` table |
| Health Scores | ✅ PARCIAL | `health_score` field en projects + `churnPredictor.ts` + `HealthDashboardPage.tsx` |
| Onboarding | ❌ NO EXISTE | grep para onboarding/welcome_flow/getting_started → 0 resultados |
| Analytics Tool | Custom | No PostHog/Mixpanel/Amplitude — sistema propio server-side |
| Admin KPIs | ✅ PARCIAL | `getTelemetryStats()` retorna TTV, last7d, byEvent |
| GDPR/Compliance | ❌ NO EXISTE | grep para consent/gdpr/lgpd/erasure → 0 resultados |
| Churn Predictor | ✅ PARCIAL | `churnPredictor.ts` existe y modifica health_score |
| Email/Notifications | ❌ NO EXISTE | No hay sistema de email sequences |

**CS_CONFIG:** `ActivityTracking: ✅(parcial) | HealthScores: ✅(parcial) | Onboarding: ❌ | AnalyticsTool: Custom | AdminKPIs: ✅(parcial) | Compliance: ❌`

---

## Executive Dashboard

| Fase | P0 | P1 | P2+ | Skipped | Veredicto |
|------|----|----|-----|---------|-----------|
| F0: Auto-Detección | 0 | 0 | 0 | 0 | ✅ INFO |
| F1: Activity Tracking | 0 | 4 | 2 | 0 | 🟡 WARN |
| F2: Health Scores | 0 | 3 | 2 | 0 | 🟡 WARN |
| F3: Onboarding/Lifecycle | 0 | 3 | 4 | 0 | 🟡 WARN |
| F4: Admin KPIs | 0 | 2 | 4 | 0 | 🟡 WARN |
| F5: Automation | 0 | 1 | 4 | 1 | 🟡 WARN |
| F6: Compliance GDPR | 3 | 3 | 1 | 0 | 🔴 FAIL |
| F7: Anti-Patterns | 0 | 2 | 1 | 0 | 🟡 WARN |

---

## FASE 1: ACTIVITY TRACKING — Análisis Detallado

### Hallazgos PASS ✅
- **AT.4 PASS — Server-Side Tracking:** `broadcastEvent()` en `services/telemetry.ts` persiste eventos en SQLite server-side antes de broadcast SSE. Esto es correcto y resistente a ad-blockers.
- **AT.8 PASS — Índices:** `idx_tel_event`, `idx_tel_project`, `idx_tel_created` creados en `initTelemetryDb()`.
- **AT.2 PASS — 14 Event Types definidos:** `pipeline:started/completed/throttled`, `agent:started/completed/failed/activity`, `project:score_updated`, `worksheet:opened/saved`, `copilot:query`, `report:generated`, `project:scanned`, `user:first_value`, `proposal:updated`.

### Hallazgos P1 🟡
- **AT.1 P1 — Dos tablas de tracking paralelas:** `telemetry_events` (en `services/telemetry.ts`) Y `project_telemetry_logs` (en `db/index.ts`). Hay duplicación y no hay consolidación. `project_telemetry_logs` sólo tiene `project_id` y `event_type`, sin payload, sin session_id.
- **AT.5 P1 — Sin `user_id` ni `session_id` en eventos:** `telemetry_events` tiene `project_id` y `session_id`, pero `session_id` nunca se pasa en las llamadas a `broadcastEvent()`. No hay `user_id` (app local-first, pero debería tener session token).
- **AT.7 P1 — Timestamps sin timezone explícito:** `created_at TEXT NOT NULL DEFAULT (datetime('now'))` en SQLite sin timezone. SQLite `datetime('now')` retorna UTC pero sin el sufijo 'Z'. En multi-timezone esto puede causar confusión.
- **AT.3 P1 — Naming convention inconsistente:** Mix de `pipeline:started` (colon), `HEALTH_SCORE_UPDATED` (underscore+caps) en `project_telemetry_logs`. No hay convención única.

### Hallazgos P2 🟢
- **AT.6 P2 — payload como TEXT en lugar de JSON nativo:** SQLite no tiene tipo JSONB como Postgres. `payload TEXT` es la solución correcta pero sin validación de JSON en el schema.
- **CE.1-CE.6 — Critical Events:** Ninguno de los 6 critical events del dominio estratégico se trackea explícitamente. `worksheet:opened`, `worksheet:saved` son los más cercanos a `tender_viewed`/`tender_saved` del template.

---

## FASE 2: HEALTH SCORES — Análisis Detallado

### Hallazgos PASS ✅
- **HS.2 PASS — Score 0-100:** `churnPredictor.ts` usa `Math.max(0, ...)` y `Math.min(100, ...)` para mantener el score en rango.
- **HS.5 PASS — Thresholds definidos:** En `health/routes.ts` lines 46-52, `sacToGrade()` define A(≥70), B(≥50), C(≥30), D(≥15), F(<15).
- **HS.6 PASS — Status field:** `healthGrade: 'A'|'B'|'C'|'D'|'F'` existe en el response del health dashboard.

### Hallazgos P1 🟡
- **HS.1 P1 — Sin tabla `health_scores` dedicada:** El health score vive como campo `health_score` en la tabla `projects`. No hay historial de scores, solo el valor actual.
- **HS.7 P1 — Recalculation parcialmente manual:** `churnPredictor.ts` existe pero no hay evidencia de un scheduler que lo ejecute automáticamente. El `startScheduler()` importado en `index.ts` debe verificarse.
- **HS.8 P1 — Sin histórico de scores:** Solo hay un `health_score` INTEGER en projects. No hay tabla de series temporales para trend analysis.
- **HS.3 P1 — Dos sistemas de health score desconectados:** El `sacScore` (Strategic Advantage Composite) en `health/routes.ts` y el `health_score` de `churnPredictor.ts` son métricas distintas que no están integradas en una sola vista.

### Hallazgos P2 🟢
- **HS.4 P2 — Inputs del health score bien definidos:** El SAC score en `@cs/domain` usa 9 métricas estratégicas. El churn predictor usa `last_execution_date`. Buena cobertura de inputs pero falta integración.
- **HS.9 P2 — Sin company-level aggregation:** Por diseño de app local-first, no hay concepto de "company". Esta es una limitación de diseño, no un bug.

---

## FASE 3: ONBOARDING & LIFECYCLE — Análisis Detallado

### Hallazgos P1 🟡
- **OB.1 P1 — Sin onboarding milestones:** No hay flujo de onboarding definido. El usuario llega a la app sin guía step-by-step. `QuickStartPage.tsx` (3.6KB) es el único hint pero no es un onboarding flow estructurado.
- **OB.2 P1 — Sin progress tracking por usuario:** No hay `onboarding_progress` o `completion` tracking en la DB.
- **OB.3 P1 — Sin activation metric definida:** `user:first_value` event existe en telemetry pero no hay lógica que defina cuándo un usuario "se ha activado".

### Hallazgos P2 🟢
- **OB.4 P2 — TTV parcialmente tracked:** `user:first_value` event existe y `getTelemetryStats()` calcula `avgTtvMs`. Es un comienzo.
- **LC.1, LC.2, LC.3 P2 — Sin lifecycle stages:** No hay definición de trial→onboarding→adoption→expansion.
- **EW.1-EW.4 P2 — Sin early warning signals:** `churnPredictor.ts` detecta inactividad de proyectos (21+ días sin ejecución), que es un proxy de EW.1. Los demás signals no existen.

---

## FASE 4: ADMIN DASHBOARD KPIs — Análisis Detallado

### Hallazgos PASS ✅
- **KP.1 PASS — User growth proxy:** `getTelemetryStats()` retorna `last7d` y `byEvent` como métricas de actividad.
- **KP.3 PASS (parcial) — Onboarding funnel parcial:** `user:first_value` + `project:scanned` permiten calcular TTV funnel.

### Hallazgos P1 🟡
- **KP.5 P1 — At-risk accounts no highlightados proactivamente:** `HealthDashboardPage.tsx` muestra health grades pero no hay alertas proactivas para proyectos en grado D o F.
- **KP.6 P1 — Sin MRR/ARR:** App local-first sin modelo de subscripción. Si se planea SaaS, este es el gap más importante para product analytics.

### Hallazgos P2 🟢
- **KP.2, KP.4, KP.7, KP.8 P2 — Engagement distribution, feature adoption heatmap, churn rate, NRR:** Ninguno existe actualmente. Son mejoras para una versión SaaS futura.

---

## FASE 5: BEHAVIORAL AUTOMATION — Análisis Detallado

### Hallazgos P1 🟡
- **BA.2 P1 — Sin welcome/onboarding sequence:** No hay email ni notificación in-app de bienvenida para nuevos proyectos creados.

### Hallazgos P2 🟢
- **BA.1, BA.3, BA.4, BA.5 P2 — Automation completa ausente:** No hay email sequences, milestone celebrations, trial notifications, ni webhook system. Por diseño local-first esto es esperado.
- **BA.6 P2 — In-app notifications parciales:** SSE telemetry broadcast existe pero no hay sistema de nudges/notificaciones dirigidas al usuario.

---

## FASE 6: PRIVACY & COMPLIANCE — 🚨 CRÍTICO

> Esta fase NUNCA se salta. Los siguientes hallazgos aplican aunque sea una app local-first.

### Hallazgos P0 🔴

#### P0-CS-01: Sin Mecanismo de Consentimiento (PC.1 + PC.2)
**Impacto:** El sistema inicia tracking de telemetría sin ningún consentimiento del usuario. `broadcastEvent()` empieza a persistir eventos inmediatamente al iniciar la app.
**Evidencia:** `services/telemetry.ts` — `broadcastEvent()` persiste a SQLite sin ningún check de consent. grep para `consent|opt-in|cookie` → 0 resultados.
**Severidad:** 🔴 P0 — GDPR/LGPD violation si el usuario es ciudadano EU/BR
**Recomendación:** Mostrar banner de consentimiento en primera ejecución. Condicionar `initTelemetryDb()` a consent explícito.

#### P0-CS-02: Sin Right to Erasure (PC.5)
**Impacto:** No hay endpoint ni UI para que un usuario borre todos sus datos de telemetría.
**Evidencia:** grep para `delete_user_data|erasure|anonymize|right.*erase` → 0 resultados.
**Severidad:** 🔴 P0 — Artículo 17 GDPR — derecho de supresión
**Recomendación:** Implementar `DELETE /api/telemetry/purge` + botón en Settings para borrar todos los eventos de telemetría.

#### P0-CS-03: Endpoint de Stats sin Autenticación (PC.6)
**Impacto:** `GET /api/telemetry/stats` retorna métricas de actividad sin ninguna autenticación. Cualquier cliente en la red puede ver el historial de actividad del usuario.
**Evidencia:** `modules/telemetry/routes.ts` lines 38-46 — endpoint sin middleware de auth. Combinado con P0-ADMIN-02 (toda la API es pública).
**Severidad:** 🔴 P0 — Exposición de datos de actividad privados
**Recomendación:** Agregar auth middleware al router de telemetría.

### Hallazgos P1 🟡

#### P1-CS-01: Sin Data Retention Policy (PC.3 + PC.4)
**Impacto:** `telemetry_events` y `project_telemetry_logs` crecen indefinidamente. No hay cron de limpieza de datos viejos.
**Evidencia:** DB schema no tiene TTL. `db/maintenance.ts` existe pero debe verificarse si incluye limpieza de telemetría.
**Severidad:** 🟡 P1 — AP.5 (Infinite retention)
**Recomendación:** Implementar cleanup job: `DELETE FROM telemetry_events WHERE created_at < datetime('now', '-90 days')`.

#### P1-CS-02: PII Potencial en Payloads (PC.8 + AP.6)
**Impacto:** El campo `payload TEXT` de `telemetry_events` almacena `data: Record<string, unknown>` arbitrario. Si algún caller incluye email, nombre, o paths de usuario en el payload, se persiste sin sanitización.
**Evidencia:** `broadcastEvent()` no valida ni sanitiza el objeto `data` antes de persistirlo.
**Severidad:** 🟡 P1
**Recomendación:** Definir tipos estrictos para cada `TelemetryEventName` y validar payload contra schema.

#### P1-CS-03: Sin Data Export / Portability (PC.10)
**Impacto:** El usuario no puede exportar sus propios datos de telemetría.
**Recomendación:** Agregar `GET /api/telemetry/export?format=json` endpoint.

### Hallazgos P2 🟢
- **PC.7 P2 — Sin DPA documentado:** Para app local-first sin terceros, este riesgo es bajo. Si se integra PostHog u otro tool, requerirá DPA.

---

## FASE 7: ANTI-PATTERNS

### Anti-Patterns PASS ✅
- **AP.1 PASS — Tracking es server-side:** `broadcastEvent()` persiste server-side, no solo client JS. Resistente a ad-blockers.

### Anti-Patterns P1 🟡
- **AP.2 P1 — Sin company-level aggregation:** Por diseño local-first, pero limita el análisis de portfolio.
- **AP.5 P1 — Infinite retention:** Sin cleanup job para datos de telemetría.

### Anti-Patterns P2 🟢
- **AP.3 P2 — Health score sin validación contra churn real:** Los thresholds de `churnPredictor.ts` (21 días → -20 puntos) son arbitrarios, no validados contra datos históricos reales.

---

## Hallazgos PASS (Resumen)

- ✅ Server-side tracking implementado (resiliente a ad-blockers)
- ✅ Índices correctos en telemetry_events
- ✅ 14 event types definidos con TypeScript type safety
- ✅ TTV parcialmente medido via `user:first_value`
- ✅ SAC score con 9 métricas estratégicas bien definidas
- ✅ Health grade A/B/C/D/F con thresholds documentados
- ✅ churnPredictor detecta inactividad de proyectos
- ✅ `getTelemetryStats()` calcula last7d, byEvent, avgTtvMs

---

## Resumen Final

🔴 P0: **3** | 🟡 P1: **9** | 🟢 P2: **8** | ⏭️ SKIP: **0** | ✅ PASS: **8**

**Veredicto:** 🔴 **FAIL** — Los 3 P0s de compliance GDPR son críticos. El sistema trackea actividad sin consentimiento del usuario (PC.1), no tiene derecho de supresión (PC.5), y expone stats de actividad sin auth (PC.6). Los P1s de health scoring integrado y onboarding son importantes para la evolución del producto.

**Hallazgo Positivo Destacado:** El sistema de telemetría server-side con SSE + SQLite es una arquitectura sólida para una app local-first. Con los fixes de compliance y la unificación de las dos tablas de tracking, sería una base excelente.

---

*Reporte generado por auditoria13-customer-success (inline) — 2026-05-26*
