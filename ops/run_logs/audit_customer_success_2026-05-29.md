# 📊 Auditoría Customer Success — Connected Strategy

**Fecha:** 2026-05-29
**CS Config:** `ActivityTracking: ✅ | HealthScores: ✅ | Onboarding: ❌ | AnalyticsTool: Custom (SQLite) | AdminKPIs: ❌ | Compliance: ❌`

## 1. Resumen Ejecutivo (Executive Dashboard)

| Fase | P0 | P1 | P2+ | Skipped | Veredicto |
|------|----|----|-----|---------|-----------|
| F1: Activity Tracking | 0 | 2 | 0 | 0 | 🟡 WARNING |
| F2: Health Scores | 0 | 4 | 1 | 0 | 🟡 WARNING |
| F3: Onboarding/Lifecycle | 0 | 2 | 5 | 0 | 🟡 WARNING |
| F4: Admin KPIs | 0 | 2 | 6 | 0 | 🟡 WARNING |
| F5: Automation | 0 | 2 | 4 | 0 | 🟡 WARNING |
| F6: Compliance | 2 | 2 | 2 | 0 | 🔴 CRITICAL |
| F7: Anti-Patterns | 0 | 0 | 1 | 0 | ✅ PASS |

## 2. Tabla Consolidada de Diagnóstico (Checkpoints)

### Fase 1: Activity Tracking
- **AT.1 (Table exists):** ✅ PASS (`telemetry_events`)
- **AT.2 (Core events):** ✅ PASS (15 eventos definidos en `TelemetryEventName`)
- **AT.3 (Naming convention):** ✅ PASS (Formato `object:action`)
- **AT.4 (Server-side tracking):** ✅ PASS (`broadcastEvent` graba directo en SQLite)
- **AT.5 (Context properties):** 🟡 P1 (Falta `user_id`, solo existe `session_id` y `project_id`)
- **AT.6 (JSONB/flexible):** ✅ PASS (Columna `payload` como TEXT JSON)
- **AT.7 (Timestamps con timezone):** 🟡 P1 (Usa `datetime('now')` de SQLite sin UTC estricto/TIMESTAMPTZ)
- **AT.8 (Indices):** ✅ PASS (Índices existentes `idx_tel_event`, `idx_tel_project`, `idx_tel_created`)

### Fase 2: Health Scores
- **HS.1 (Table exists):** ✅ PASS (Columna `health_score` en `projects`)
- **HS.2 (Score 0-100):** ✅ PASS (Controlado en `churnPredictor.ts`)
- **HS.3 (Weighted calc):** 🟡 P1 (Solo se usa la variable `last_execution_date`, no hay pesos múltiples)
- **HS.4 (Inputs):** 🟡 P1 (Carece de usage/adoption/support)
- **HS.5 (Thresholds):** 🟢 P2 (Límites de tiempo en lugar de puntuación, ej. >21 días es Red Alert)
- **HS.6 (Status field):** 🟡 P1 (No hay enum en DB para healthy/at_risk)
- **HS.7 (Scheduled):** ✅ PASS (Ejecutado vía `scheduler.ts` con `checkChurnRisks()`)
- **HS.8 (Historical):** 🟡 P1 (No se almacena el historial del health_score, se sobrescribe)

### Fase 3: Onboarding & Lifecycle
- **OB.1 (Milestones):** 🟡 P1 (No hay hitos explícitos definidos)
- **OB.2 (Progress tracking):** 🟡 P1 (Sin tabla de progreso)
- **OB.3 (Activation metric):** ✅ PASS (`user:first_value` en telemetría)
- **OB.4 (First-value-moment):** ✅ PASS
- **OB.5 (Time-to-value):** ✅ PASS (Calculado en `getTelemetryStats`)
- **LC/EW (Lifecycle & Warning):** 🟢 P2 (No implementados formalmente)

### Fase 4: Admin Dashboard KPIs
- **KP.1 (User growth):** 🟡 P1 (No visible explicitamente en UI, solo a través de `stats`)
- **KP.5 (At-risk highlighted):** 🟡 P1 (Dashboard de salud clasifica, pero falta visibilidad explícita de riesgo de abandono)
- **Otros:** 🟢 P2 (La mayoría no aplican en una app Local-First)

### Fase 5: Automation
- **BA.2 (Welcome email):** 🟡 P1 (No hay onboarding local, pero podría reemplazarse con un tour in-app)
- **BA.4 (Trial-end):** 🟡 P1 (Inexistente)
- **Otros:** 🟢 P2

### Fase 6: Compliance
- **PC.1 (Consent banner):** 🔴 P0 (Ningún mecanismo de consentimiento previo a iniciar la telemetría)
- **PC.2 (No tracking before consent):** 🔴 P0 (La telemetría arranca por defecto y guarda en SQLite local)
- **PC.3 (Retention doc):** ✅ PASS (Comentado en `maintenance.ts`)
- **PC.4 (Auto deletion):** ✅ PASS (Limpieza a 90 días con `cleanOldTelemetryEvents(90)`)
- **PC.5 (Right to erasure):** 🟡 P1 (No hay endpoint para limpiar específicamente telemetría manual por el usuario)
- **PC.6 (Not public API):** ✅ PASS (API local no expuesta)
- **PC.8 (No PII):** ✅ PASS
- **PC.10 (Data export):** 🟡 P1 (Sin exporte JSON/CSV explícito de la actividad para el usuario)

### Fase 7: Anti-Patterns
- **AP.1 (Client-only tracking):** ✅ PASS (Server-side real)
- **AP.4 (Sin índices):** ✅ PASS
- **AP.5 (Retención infinita):** ✅ PASS (Evitado vía job)
- **AP.7 (Pre-ticked consent):** 🔴 P0 / N/A (Se enmarca dentro del fallo de PC.1)

## 3. Detalle de P0s/P1s with Safe-Fix Plan

### 🔴 P0: Violación de Compliance (PC.1, PC.2)
**Contexto:** La app registra actividad en `telemetry_events` silenciosamente sin consentimiento explícito, aunque sea una DB local.
**Plan de Acción (Safe-Fix):**
1. Crear tabla/config en `settings` para `analytics_opt_in` (BOOLEAN).
2. Modificar el frontend para que despliegue un modal de bienvenida que pida consentimiento para la telemetría de mejora del producto.
3. En `services/telemetry.ts`, envolver el `INSERT INTO telemetry_events` con un chequeo de `settings.analytics_opt_in`.

### 🟡 P1: Fricción en Activity Tracking (AT.5, AT.7)
**Contexto:** Falta el `user_id` (o owner explícito en modo local/multi-perfil) y el tracking del tiempo no asegura UTC.
**Plan de Acción:**
1. Aunque es local, incluir `profile_id` o `user_id` en el esquema de telemetría para futura integración a la nube.
2. Modificar `datetime('now')` por inserciones explícitas ISO 8601 o `CURRENT_TIMESTAMP`.

### 🟡 P1: Health Scores Primitivos (HS.3, HS.4, HS.6, HS.8)
**Contexto:** El score de salud se basa únicamente en la recencia (días desde la última ejecución) y no almacena un histórico.
**Plan de Acción:**
1. Crear tabla `health_score_history` para graficar tendencias.
2. Agregar variables al peso del score en `churnPredictor.ts`: frecuencia de acceso, cantidad de worksheets llenados, alertas activas (N8N).

---
**Resumen Global:** 🔴 P0: 2 | 🟡 P1: 14 | 🟢 P2: 19 | ⏭️ SKIP: 0 | ✅ PASS: 18
