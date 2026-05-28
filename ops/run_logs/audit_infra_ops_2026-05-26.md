# ☁️ Connected Strategy — Infrastructure & Operations Audit (Cloud, Network & Security Stack)
**Fecha de Ejecución:** 2026-05-26  
**Veredicto General:** 🔴 CRITICAL / IMMEDIATE REMEDIATION REQUIRED  
**Auditor:** Research Subagent  
**Stack Detectado:** Node.js + Express | DB: SQLite (better-sqlite3) | Cloud: Local/Desktop + GCP (Cloud Run) + AWS (Terraform Subnets) | OS: Windows  

---

## 📊 Resumen Estadístico de Hallazgos
* 🔴 **P0 (Crítico):** 3
* 🟡 **P1 (Alto):** 3
* 🟢 **P2 (Medio/Bajo):** 4
* ✅ **PASS (Verificados Correctos):** 7

---

## 📋 Tabla de Diagnóstico General

| # | Pilar | Check / Fase | Esperado | Encontrado | Severidad | Estado |
|---|---|---|---|---|---|---|
| 1 | Seguridad API | Aislamiento Multi-Tenant (Fase 9 / 2) | En despliegue público, las consultas SQL deben estar aisladas estrictamente por `tenant_id`. | Columna `tenant_id` existe debido a migraciones pasadas, pero **ningún repositorio** filtra sus queries por ella. | 🔴 **P0** | ❌ **FAIL** |
| 2 | Seguridad API | Path Traversal en ID de Proyecto (Fase 9 / 6) | Validación rigurosa de `projectId` para evitar lecturas/escrituras fuera del root. | `/state/:projectId` and `/context/:projectId` pasan el ID directo a métodos de escritura de archivos en disco en `ProjectStateStore` sin sanear. | 🔴 **P0** | ❌ **FAIL** |
| 3 | Deploy Pipeline | Carga Segura de Secretos en Production (Fase 5) | Todos los secretos críticos (`CLERK_SECRET_KEY`) se cargan de forma segura e impiden el arranque sin ellos. | `requireAuth` crashea intencionalmente si no hay claves de Clerk en producción, pero `cloudbuild.yaml` no las define ni las inyecta de Secret Manager, lo que garantiza el fallo de boot. | 🔴 **P0** | ❌ **FAIL** |
| 4 | Runtime | Crash de Arranque en Enterprise (Fase 7) | Invocación correcta del archivo JavaScript compilado en producción. | `Dockerfile.enterprise` ejecuta `apps/server/dist/main.js` pero el backend compila a `dist/index.js`, resultando en un crash inmediato. | 🟡 **P1** | ❌ **FAIL** |
| 5 | Deploy Pipeline | Lector de Entorno Robusto (Fase 5) | Uso de bibliotecas estándar (ej. `dotenv`) para evitar fallos por comillas o comentarios. | Custom `.env` parser hecho a mano en `index.ts` no remueve comillas ni comentarios al final de la línea (`#`), lo que altera las API keys. | 🟡 **P1** | ❌ **FAIL** |
| 6 | Backup y Prot. | Respaldos Automatizados (Fase 3) | Tareas automáticas de respaldo para el archivo SQLite a almacenamiento externo. | No existe ningún script de backup o automatización cron para respaldar el archivo `connected_strategy.db`. | 🟡 **P1** | ❌ **FAIL** |
| 7 | Runtime | Privilegios de Contenedor (Fase 7) | El proceso del contenedor debe ejecutarse con privilegios reducidos (unprivileged user). | Ambos Dockerfiles omiten `USER node` y ejecutan Express con el usuario `root`, comprometiendo la seguridad. | 🟢 **P2** | ⚠️ **WARN** |
| 8 | Salud Interna | Crecimiento Infinito de DB (Fase 10) | Mantenimiento recurrente de todas las tablas con datos temporales o registros logs. | `cleanOldTelemetryEvents` limpia `telemetry_events` pero ignora `project_telemetry_logs`, la cual crece de forma indefinida en cada iteración del scheduler. | 🟢 **P2** | ⚠️ **WARN** |
| 9 | Runtime | Optimización de Imagen Enterprise (Fase 7) | Exclusión estricta de dependencias de desarrollo (`devDependencies`) en el runtime productivo. | `Dockerfile.enterprise` copia todo `node_modules` directamente desde el builder sin podar dependencias dev, inflando la imagen. | 🟢 **P2** | ⚠️ **WARN** |
| 10 | Higiene / Config | Declaración Real de Overrides (Fase 5) | Aplicación estricta de parches de dependencias reportados en changelogs. | El `CHANGELOG_PROJECT.md` reclama haber agregado strict `pnpm.overrides` contra vulnerabilidades CVE, pero estas no existen en el `package.json` de la raíz. | 🟢 **P2** | ⚠️ **WARN** |
| 11 | Red y Encriptación | Exposición del Motor de Base de Datos (Fase 2) | Bloqueo absoluto de puertos del motor relacional al exterior. | Al usar SQLite (archivo local), no hay puertos de base de datos expuestos a la red, eliminando este vector de ataque. | — | ✅ **PASS** |
| 12 | Red y Encriptación | Control de Acceso por Subredes (Fase 2) | Configuración de políticas de red estrictas. | Terraform (`main.tf`) define subredes VPC privadas (`10.0.1.0/24`) y un Security Group restringido al puerto 4311. | — | ✅ **PASS** |
| 13 | Seguridad API | Límites de Tráfico / Rate Limiting (Fase 9) | Protección contra denegación de servicio (DoS) a nivel global y específico. | Express-rate-limit está globalmente activo (`100 req/15m`) y con restricción extra severa (`5 req/15m`) en endpoints de IA. | — | ✅ **PASS** |
| 14 | Runtime | Health Checks Activos de Backend (Fase 7) | Pings interactivos que verifican el estado del storage. | `/api/health` ejecuta un ping `SELECT 1` activo contra el archivo SQLite en lugar de retornar un JSON estático. | — | ✅ **PASS** |
| 15 | Runtime | Apagado Controlado del Proceso (Fase 7) | Captura de señales para detener procesos asíncronos y storage. | Se capturan correctamente `SIGTERM` y `SIGINT` en `index.ts` para cerrar la base de datos de SQLite y apagar el planificador. | — | ✅ **PASS** |
| 16 | Seguridad API | Protección de Rutas contra Traversal (Fase 9) | Rutas históricas saneadas contra path traversal. | `/api/pipeline/history/:projectId` valida con éxito el input del usuario usando el validador `safeProjectDataPath`. | — | ✅ **PASS** |
| 17 | DNS y Certs. | Integridad de Reglas de Enrutamiento (Fase 9.5) | Reglas de Nginx limpias de reescrituras agresivas de paths. | El servidor Nginx local configura `try_files` estándar sin truncar rutas ni afectar la estructura de redirección de Clerk. | — | ✅ **PASS** |

---

## 🔍 Detalle Profundo de Hallazgos Críticos

### 🔴 P0-1: Aislamiento Multi-Tenant Roto en Base de Datos (Tenant Leakage)
* **Ubicación:** `apps/server/src/db/repositories/*.ts` (Toda la capa de persistencia)
* **Mecánica del Fallo:**
  El sistema incluye scripts de migración (`migrate_tenants.ts`) para agregar la columna `tenant_id` y su índice a tablas vitales (`projects`, `worksheet_answers`, `analysis_jobs`, `prompt_packets`, `pipeline_runs`). 
  Sin embargo, los repositorios de datos en `apps/server/src/db/repositories/projects.ts` (y los demás) ejecutan consultas crudas omitiendo por completo este filtro:
  ```typescript
  export function getProject(id: string): Project | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
    return row ? rowToProject(row) : undefined;
  }
  ```
  Al desplegarse en producción multitenant, un inquilino `Tenant-A` puede adivinar el ID de proyecto de `Tenant-B` y secuestrar sus estrategias, cambiar sus estados o robar sus prompts, ya que las consultas son ciegas a nivel de tenant.
* **Solución Propuesta:** Modificar las funciones de repositorio para aceptar un parámetro `tenantId` (recuperado de `req.auth.tenantId`) e incorporarlo en el `WHERE` de cada consulta relacional.

### 🔴 P0-2: Vulnerabilidad Crítica de Path Traversal en ProjectStateStore
* **Ubicación:** `packages/agents/src/v3/state-store.ts` y `apps/server/src/modules/pipeline/routes.ts`
* **Mecánica del Fallo:**
  El endpoint `/api/pipeline/history/:projectId` cuenta con protección. Sin embargo, los endpoints `/api/pipeline/state/:projectId` y `/api/pipeline/context/:projectId` invocan directamente los métodos `load`, `save` y `appendContext` de `ProjectStateStore` pasando el string sin sintonizar.
  En `state-store.ts`, se hace:
  ```typescript
  private getProjectPath(projectId: string): string {
    return path.join(this.rootDir, projectId);
  }
  ```
  Si se realiza un request con `projectId` igual a `../../malicious_dir`, `ensureProjectDir()` resolverá la ruta fuera de `data/projects`, creará el directorio de forma remota y el método `appendContext` escribirá un archivo `context.md` arbitrario de forma persistente.
* **Solución Propuesta:** Adoptar el helper `safeProjectDataPath` implementado en las rutas de historial y aplicarlo globalmente en todos los endpoints que acepten `:projectId`.

### 🔴 P0-3: Despliegue Fallido por Inyección Incompleta de Clerk Secrets
* **Ubicación:** `cloudbuild.yaml` (L24-29) y `apps/server/src/middleware/auth.ts` (L13-20)
* **Mecánica del Fallo:**
  El middleware de Express `requireAuth` obliga a la API en producción a finalizar el proceso inmediatamente si faltan las variables de autenticación:
  ```typescript
  if (process.env.NODE_ENV === 'production') {
    console.error('[AUTH] FATAL: CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY are required in production.');
    process.exit(1);
  }
  ```
  Sin embargo, el pipeline en `cloudbuild.yaml` solo tiene configurado inyectar el secreto `GEMINI_API_KEY`, dejando `CLERK_SECRET_KEY` y `CLERK_PUBLISHABLE_KEY` completamente fuera de la especificación del deploy de Cloud Run. Esto causa un fallo inmediato de arranque en cada despliegue automático.
* **Solución Propuesta:** Actualizar `cloudbuild.yaml` agregando los flags `--set-secrets` correspondientes para Clerk.

---

## 🛠️ Plan de Mitigación y Código Seguro (Safe-Fix Plan)

### 1. Saneamiento contra Path Traversal en `apps/server/src/modules/pipeline/routes.ts`:
Aplicar el filtro `safeProjectDataPath` a los endpoints de carga de estado y contexto para invalidar `..` en el ID del proyecto:
```typescript
router.get('/state/:projectId', (req, res, next) => {
  try {
    safeProjectDataPath(req.params.projectId); // Validador de escape de directorios
    const state = store.load(req.params.projectId);
    if (!state) return next(new AppError('No v3 state for this project', 404, 'NOT_FOUND'));
    res.json({ ok: true, state });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
```

### 2. Corrección de Arranque en `Dockerfile.enterprise` (L40):
Corregir la instrucción de inicio en el Dockerfile para apuntar al archivo compilado correcto `index.js`:
```diff
-CMD ["node", "apps/server/dist/main.js"]
+CMD ["node", "apps/server/dist/index.js"]
```

### 3. Mitigación de Pérdida de Datos en SQLite (Backups Automatizados):
Crear una tarea programada simple en `apps/server/src/scheduler.ts` para copiar periódicamente de forma atómica el archivo de la base de datos:
```typescript
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export function runDatabaseBackup() {
  try {
    const src = resolve('data', 'connected_strategy.db');
    const dest = resolve('data', `connected_strategy_backup_${new Date().toISOString().slice(0, 10)}.db`);
    copyFileSync(src, dest);
    console.log(`[BACKUP] Atomic copy created at ${dest}`);
  } catch (e) {
    console.error('[BACKUP] Failed to create backup:', e);
  }
}
```

### 4. Mantenimiento Completo de Telemetría (`apps/server/src/db/maintenance.ts`):
Extender el mantenimiento de telemetría para podar la tabla huérfana `project_telemetry_logs`:
```typescript
export function cleanOldProjectTelemetryLogs(daysToKeep = 90): number {
  const db = getDb();
  try {
    const result = db.prepare(`
      DELETE FROM project_telemetry_logs 
      WHERE timestamp < datetime('now', '-' || ? || ' days')
    `).run(daysToKeep);
    return result.changes;
  } catch {
    return 0;
  }
}
```

---

## 🏁 Próximos Pasos en el Pipeline de Auditoría
El control tower de infraestructura presenta brechas severas en producción multitenant y configuraciones de contenedores enterprise. Se solicita al equipo estratégico aplicar el **Safe-Fix Plan** anterior de forma prioritaria. Una vez remediados físicamente los fallos, el código estará listo para someterse a la validación estricta de seguridad y lógica de negocio del **Guardián** (`auditoria1-guardian`).

---

## 🛡️ VERIFICATION GATE TABLE (Auto-Auditoría Superpowers)

| File / Route / Target | Check Type | Verification Tool | Result | Notes |
|---|---|---|---|---|
| `apps/server/src/db/repositories/projects.ts` | Multi-tenant isolation | `grep_search` & `view_file` | 🔴 **CRITICAL FAIL** | No se detectó ninguna query filtrando por la columna `tenant_id` existente. |
| `packages/agents/src/v3/state-store.ts` | Security (Path Traversal) | `view_file` | 🔴 **CRITICAL FAIL** | `ensureProjectDir` y `load`/`save` aceptan IDs de proyectos con secuencias de escape. |
| `cloudbuild.yaml` | Deploy Configuration | `view_file` | 🔴 **CRITICAL FAIL** | Faltan inyecciones de Secrets en Cloud Run para Clerk (`CLERK_SECRET_KEY`). |
| `Dockerfile.enterprise` | Production Runtime Target | `view_file` | 🟡 **HIGH FAIL** | La directiva de ejecución llama a `main.js`, el cual no existe. El correcto es `index.js`. |
| `apps/server/src/index.ts` | Environment Variables Parser | `view_file` | 🟡 **HIGH FAIL** | Custom parsing no soporta quotes ni comentarios inline en variables del `.env`. |
| `data/connected_strategy.db` | Data Resiliency & Backups | `grep_search` | 🟡 **HIGH FAIL** | No hay rutinas de backup configuradas ni automatizadas en el backend. |
| `apps/server/src/db/maintenance.ts` | Observability & Cleanup | `view_file` & `grep_search` | 🟢 **LOW FAIL** | Tabla `project_telemetry_logs` no posee limpieza periódica de registros. |
| `Dockerfile` | Image Security (Root User) | `view_file` | 🟢 **LOW FAIL** | El proceso Express se ejecuta con privilegios de `root` sin usar `USER node`. |
| `package.json` | Dependency Integrity | `grep_search` | 🟢 **LOW FAIL** | Changelog menciona strict overrides de dependencias que no están físicamente en el archivo. |
| `apps/server/src/index.ts` | General Endpoint Security | `view_file` | ✅ **PASS** | Rate limiters bien estructurados y aplicados uniformemente. |
