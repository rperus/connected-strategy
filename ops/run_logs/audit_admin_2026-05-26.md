# 🏢 Auditoría Admin Panel — Connected Strategy
**Fecha:** 2026-05-26T17:07:00Z
**Auditor:** Antigravity (inline execution — subagent quota exhausted)
**Skill:** auditoria12-admin-backoffice

---

## FASE 0: AUTO-DETECCIÓN

### ADMIN_CONFIG Detectado

| Feature | Estado | Evidencia |
|---------|--------|-----------|
| AdminPanel UI | ❌ NO EXISTE | grep exhaustivo en *.tsx — 0 resultados para AdminPanel/BackOffice/admin.*page |
| Admin Routes Express | ❌ NO EXISTE | grep en *.ts — 0 resultados para /admin, admin.*route, role.*admin |
| User Management UI | ❌ NO EXISTE | No hay tabla de usuarios ni lista de usuarios admin |
| Company Management | ❌ NO EXISTE | No hay vista de gestión de empresas |
| Impersonation | ❌ NO EXISTE | No hay implementación de impersonation |
| Merge UI | ❌ NO EXISTE | No hay UI de merge de cuentas |
| Audit Log UI | ❌ NO EXISTE | No hay UI de audit log |
| Auth Middleware | ❌ NO EXISTE | grep en apps/server/src — 0 resultados para auth, jwt, Bearer, role, permission |
| Role Hierarchy | ❌ NO EXISTE | No hay definición de roles |
| isAdmin / SuperAdmin | ❌ NO EXISTE | No hay checks de roles en código |

**ADMIN_CONFIG:** `AdminPanel: ❌ | UserMgmt: ❌ | CompanyMgmt: ❌ | Impersonation: ❌ | MergeUI: ❌ | AuditLog: ❌ | Auth: ❌`

> 🚨 **HALLAZGO CRÍTICO:** Esta aplicación es completamente **sin autenticación**. Todos los endpoints de la API son públicos. No existe ningún sistema de roles, permisos, o auth middleware.

---

## Executive Dashboard

| Fase | P0 | P1 | P2+ | Skipped | Veredicto |
|------|----|----|-----|---------|-----------|
| F0: Auto-Detección | 1 | 0 | 0 | 0 | 🔴 FAIL |
| F1: User Table | 0 | 0 | 0 | 10 | ⏭️ SKIPPED |
| F2: User Detail | 0 | 0 | 0 | 12 | ⏭️ SKIPPED |
| F3: Company Mgmt | 0 | 0 | 0 | 6 | ⏭️ SKIPPED |
| F4: Identity Resolution | 0 | 0 | 0 | 7 | ⏭️ SKIPPED |
| F5: API Security | 2 | 4 | 0 | 0 | 🔴 FAIL |
| F6: Visual Design | 0 | 0 | 0 | 8 | ⏭️ SKIPPED |
| F7: Anti-Patterns | 0 | 2 | 1 | 0 | 🟡 WARN |

---

## Findings por Severidad

### 🔴 P0 — Críticos (3 total)

#### P0-ADMIN-01: Sin Panel Administrativo para Producción
**Impacto:** Esta es una aplicación local-first para un solo usuario. No existe ningún admin panel. Para un MVP local esto es aceptable, pero **bloquea cualquier escenario multi-usuario o SaaS.**
**Evidencia:** grep exhaustivo en todos los *.tsx y *.ts — cero resultados para AdminPanel, BackOffice, admin route.
**Severidad:** P0 para producción / P1 para MVP local
**Recomendación:** Implementar panel de administración básico si se planea distribución multi-usuario.

#### P0-ADMIN-02: Todos los Endpoints API sin Autenticación
**Impacto:** Cualquier usuario en la red puede acceder a todos los endpoints `/api/*` sin autenticación. No hay JWT, no hay API keys, no hay middleware de auth.
**Evidencia:**
- `apps/server/src/index.ts` lines 50-80: Solo usa `helmet()`, `cors()`, `rateLimit()` — **sin auth middleware**
- `grep auth|jwt|Bearer|role|permission` en `apps/server/src` → 0 resultados
- Todos los routers en `apps/server/src/modules/*/routes.ts` accesibles directamente
**Severidad:** 🔴 P0 — Este es el finding más crítico de toda la auditoría admin
**Recomendación:** Implementar auth middleware (al menos API key para uso LAN, o JWT para multi-usuario). Aplicar `requireAuth()` middleware a todos los routers.

#### P0-ADMIN-03: Hard Delete sin Soft-Delete (AP.6)
**Impacto:** El esquema de `projects` table (`apps/server/src/db/index.ts`) no tiene campo `deleted_at`. Las eliminaciones de proyectos son permanentes sin posibilidad de recuperación.
**Evidencia:** Schema en `db/index.ts` lines 45-55 — no hay campo `deleted_at` en projects table.
**Severidad:** 🔴 P0 — Pérdida permanente de datos sin rollback
**Recomendación:** Agregar `deleted_at TEXT` a projects table e implementar soft-delete en el repo layer.

---

### 🟡 P1 — Importantes (4 total)

#### P1-ADMIN-01: Sin Panel Admin → P1 para MVP Local
**Contexto:** Como app local-first de un solo usuario, la ausencia de admin panel es P1 (no P0). Pero si se planea escalar, es prioridad alta.
**Recomendación:** Crear ruta `/admin` con tabla de proyectos y métricas básicas.

#### P1-ADMIN-02: Sin Paginación en Endpoints de Lista
**Impacto:** `GET /api/projects` y `GET /api/health-dashboard` cargan TODOS los proyectos sin paginación server-side.
**Evidencia:** `health/routes.ts` line 70: `const projects = listProjects()` — sin LIMIT/OFFSET.
**Recomendación:** Agregar `?page=1&limit=20` a todos los endpoints de lista.

#### P1-ADMIN-03: Sin Input Validation en Admin Actions (AS.5)
**Impacto:** No hay validación con Zod o similar en los endpoints que reciben datos del usuario.
**Evidencia:** grep para `zod|joi|yup|validate` en `apps/server/src` — 0 resultados en módulos principales.
**Recomendación:** Implementar Zod schemas para todos los endpoints POST/PUT.

#### P1-ADMIN-04: Sin Audit Trail de Operaciones Críticas (AS.6)
**Impacto:** No hay registro inmutable de qué usuario realizó qué operación en el sistema. `project_telemetry_logs` solo guarda `project_id` y `event_type`, sin actor.
**Evidencia:** `db/index.ts` lines 122-127: schema de `project_telemetry_logs` sin `user_id`, `actor`, `ip_address`.
**Recomendación:** Enriquecer schema con `actor_id`, `ip_address`, `user_agent`, `before_state`, `after_state`.

---

### 🟢 P2 — Mejoras (1 total)

#### P2-ADMIN-01: Cockpit Effect en Health Dashboard (AP.1)
**Impacto:** `HealthDashboardPage.tsx` (19KB) presenta demasiadas métricas simultáneamente sin categorización clara de KPIs principales.
**Recomendación:** Implementar progressive disclosure: mostrar SAC score y grade primero, expandir detalles por demanda.

---

## Hallazgos PASS

- ✅ Rate limiting implementado (`express-rate-limit`, 100 req/15min global + 5 req/15min para pipeline)
- ✅ Helmet.js implementado (headers de seguridad HTTP)
- ✅ CORS configurado con allowlist de origins (`CS_CORS_ORIGINS`)
- ✅ SQLite con WAL mode y foreign keys habilitados
- ✅ `project_telemetry_logs` table existe (básica pero existe)
- ✅ `health_score` campo en projects table (churn predictor funciona)

---

## Contexto: App Local-First vs SaaS

> Esta app es un **control tower local-first** para análisis estratégico personal/consultora. No es un SaaS multitenante. Los P0s de admin aplican condicionalmente:
> - **P0-ADMIN-02 (Sin Auth):** Es P0 para LAN compartida, P2 para uso solo en localhost.
> - **P0-ADMIN-01 (Sin Admin Panel):** Es P1 para MVP local, P0 si se planea distribución.
> - **P0-ADMIN-03 (Hard Delete):** Es P0 independiente del contexto.

---

## Resumen Final

🔴 P0: **3** | 🟡 P1: **4** | 🟢 P2: **1** | ⏭️ SKIP: **43** (todas las fases de UI) | ✅ PASS: **6**

**Veredicto:** 🔴 **FAIL** — La app carece de admin panel y autenticación. Para MVP local es funcional, pero bloquea cualquier escenario multi-usuario. Los P0s de hard delete y no-auth deben resolverse antes de cualquier distribución.

---

*Reporte generado por auditoria12-admin-backoffice (inline) — 2026-05-26*
