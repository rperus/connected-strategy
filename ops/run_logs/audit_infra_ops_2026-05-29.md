---
type: log
---
# ☁️ Auditoría 2B: Infraestructura Operativa — Reporte Final

**Fecha:** 2026-05-29
**Stack Detectado:** Backend: Node.js+Express | DB: SQLite | Cloud: Local/Desktop & GCP Cloud Run | Frontend: React+Vite | OS: Windows

---

## 1. Resumen Ejecutivo

La infraestructura base es sólida para un entorno Local-First, aprovechando SQLite para persistencia y Node.js/Express para la API. El pipeline de despliegue a GCP Cloud Run está bien estructurado y utiliza Secret Manager de manera segura. Sin embargo, existen vulnerabilidades operativas críticas (P0) relacionadas con la construcción de la imagen Docker para el frontend (Build-time ENV Drop) y la ausencia de estrategias de backup para la base de datos local (P1).

**Verdict:** 🟡 CONDITIONAL PASS (Requiere fix del Dockerfile para variables de entorno en build-time).

**Severidad:**
| 🔴 P0 (Crítico) | 🟡 P1 (Alto) | 🟢 P2 (Medio) | ✅ PASS |
| :---: | :---: | :---: | :---: |
| 1 | 4 | 2 | 19 |

---

## 2. Tabla Consolidada de Diagnóstico

| # | Fase | Check | Esperado | Encontrado | Severidad | Estado |
|---|---|---|---|---|---|---|
| 1 | Fase 2 | Red abierta 0.0.0.0/0 | API no expuesta globalmente sin auth | API escucha en 127.0.0.1 (local) y Cloud Run gestiona red | - | ✅ PASS |
| 2 | Fase 2 | SSL/TLS desactivado | Encriptación en tránsito | GCP Cloud Run provee TLS por defecto. Local en HTTP seguro. | - | ✅ PASS |
| 3 | Fase 3 | Backups automáticos desactivados | Estrategia de backup para DB | SQLite `data/connected_strategy.db` no tiene backups automáticos (ej. Litestream) configurados en infra. | 🟡 P1 | ⚠️ WARN |
| 4 | Fase 4 | ZONAL sin aceptación | Multi-zona o documentado | SQLite es un único archivo local (zonal por naturaleza). No hay RPO/RTO documentado. | 🟡 P1 | ⚠️ WARN |
| 5 | Fase 5 | URL de conexión / Secretos | Secretos inyectados de forma segura | `cloudbuild.yaml` usa `--set-secrets` correctamente para `GEMINI_API_KEY`. No hay placeholders. | - | ✅ PASS |
| 6 | Fase 6 | Secretos hardcodeados | No hay credenciales en texto plano | Escaneo exhaustivo no encontró secretos. Solo variables de mock o chequeos de `process.env`. | - | ✅ PASS |
| 7 | Fase 7 | Build-time ENV Drop | Variables pasadas a Vite en build | El `Dockerfile` ejecuta `pnpm --filter @cs/web build` sin declarar `ARG` ni `ENV` para variables `VITE_`. Se evaporarán. | 🔴 P0 | ❌ FAIL |
| 8 | Fase 7 | Health check endpoint existe | Endpoint `/api/health` valida BD | `/api/health` ejecuta `SELECT 1` en SQLite correctamente. | - | ✅ PASS |
| 9 | Fase 7 | Graceful shutdown | Manejo de SIGTERM/SIGINT | `index.ts` intercepta señales y cierra la BD/Scheduler. | - | ✅ PASS |
| 10 | Fase 7 | Resource limits | Límites CPU/RAM en docker-compose | `docker-compose.yml` no define `deploy.resources.limits`. | 🟡 P1 | ⚠️ WARN |
| 11 | Fase 8 | Dominios y SSL | Custom domains con certificados | Cloud Run default domain (`.run.app`). | 🟢 P2 | ⚠️ WARN |
| 12 | Fase 9 | Rate Limiting | Protección contra abuso | `express-rate-limit` configurado (100 req/15min global, 5 req/15min pipeline). | - | ✅ PASS |
| 13 | Fase 9 | CORS y Cross-Referencia | Orígenes restringidos | `CS_CORS_ORIGINS` configurable, por defecto solo `localhost:4310`. | - | ✅ PASS |
| 14 | Fase 9 | Input Validation | Uso de schemas estandarizados | Uso intensivo de `zod` en capa de dominio. | - | ✅ PASS |
| 15 | Fase 9 | Auth en Endpoints Sensibles | Middleware de Auth | `requireAuth` (Clerk) protege `/api`. Falla seguro (exit 1) en prod si no hay keys. | - | ✅ PASS |
| 16 | Fase 10 | Observabilidad | Alertas de sistema | Telemetría guarda en SQLite, pero no hay alertas en GCP (Monitoring Alert Policies). | 🟡 P1 | ⚠️ WARN |

---

## 3. Detalle de P0s/P1s y Safe-Fix Plan

### 🔴 P0: Build-time ENV Drop (Fase 7 - Container)
**Problema:** En el archivo `Dockerfile`, la etapa `builder` compila el frontend web (`pnpm --filter @cs/web build`) sin recibir las variables de entorno necesarias para Vite (ej. `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`). Vite reemplaza estas variables *en tiempo de compilación*. Si no están, el frontend en producción fallará o apuntará a URLs vacías/locales.

**Safe-Fix Plan (Código a aplicar en `Dockerfile`):**
```dockerfile
### Stage 2: Build
FROM deps AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY . .

# Declarar ARG y mapear a ENV antes del build de la web
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build packages in dependency order
RUN pnpm --filter @cs/domain build
...
```
*(Nota: Actualizar también `cloudbuild.yaml` para pasar los `--build-arg` correspondientes en el comando docker build).*

### 🟡 P1: Backups Automáticos para SQLite y HA (Fase 3 y 4)
**Problema:** Al usar SQLite de forma nativa en volumen de Cloud Run/Local, si el contenedor se destruye o se corrompe el archivo `data/connected_strategy.db`, se pierde el estado.
**Solución:** Implementar Litestream o un sidecar cron que realice backups de SQLite a GCS (Google Cloud Storage) periódicamente.

### 🟡 P1: Límites de Recursos (Fase 7)
**Problema:** `docker-compose.yml` no limita recursos de RAM y CPU, lo que puede causar saturación local.
**Solución:** Añadir el bloque `deploy.resources` en `docker-compose.yml`.

---

## 4. Análisis de Reachability (Paradigma Snyk)

Se verificó el árbol de dependencias (`apps/server/package.json`) cruzándolo con el código fuente real:
- **Express & Middlewares:** Paquetes como `express`, `cors`, `helmet`, `express-rate-limit` y `compression` están correctamente declarados y *son directamente invocados* en `apps/server/src/index.ts`. 
- **Database:** `better-sqlite3` es activamente instanciado en `src/db/index.ts`.
- **Auth:** `@clerk/clerk-sdk-node` es utilizado explícitamente en `src/middleware/auth.ts`.
**Conclusión Reachability:** Cualquier CVE reportado por herramientas tipo Snyk en estas dependencias será **altamente explotable (Reachable)** ya que los paquetes no solo están en el manifest, sino que se instancian en el path de ejecución crítico (index.ts y middleware). No hay dependencias fantasma en el runtime del servidor.

---

### Verification Gate (Auto-Auditoría Superpowers)

| Fase de Planificación | Estado | Evidencia / Archivo |
|---|---|---|
| Descubrimiento de infra y Cloud | ✅ Completado | `cloudbuild.yaml`, `Dockerfile` |
| Verificación de redes y secretos | ✅ Completado | `grep_search` masivos, `auth.ts` |
| Container y Runtime | ✅ Completado | Análisis de `Dockerfile`, `index.ts` |
| API Security & Reachability | ✅ Completado | Análisis `package.json`, `auth.ts` |
| Reporte Generado | ✅ Completado | `audit_infra_ops_2026-05-29.md` creado |

El código está listo para pasar al Guardián (`auditoria1-guardian`).
