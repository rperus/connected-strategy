# 🔐 Auditoría Auth & Identity — Connected Strategy

**Fecha:** 2026-05-26T10:37:53-06:00
**Stack detectado:** Node.js+Express | DB: SQLite | Cloud: Local/Desktop + Google Cloud Run | Frontend: React+Vite | OS: Windows

---

## 🛠️ Auto-Detection Results (Fase 0)

La plataforma **Connected Strategy** es un "strategic control tower" local-first. Su arquitectura de autenticación e identidad está diseñada de manera híbrida: utiliza **Clerk** como proveedor de identidad administrado (IdP SaaS) tanto en el backend como en el frontend, y cuenta con un mecanismo de bypass local para desarrollo de cero fricciones en entornos locales (desktop).

| Provider/Feature | Status | Evidence |
|---|---|---|
| **Google OAuth** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en `@clerk/clerk-react` y `@clerk/clerk-sdk-node` en `App.tsx` y `auth.ts`. |
| **Microsoft OAuth** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |
| **LinkedIn OIDC** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |
| **Email/Magic Link** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |
| **Passkeys / WebAuthn**| ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |
| **WhatsApp OTP** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |
| **SAML 2.0** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |
| **Account Linking** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. No hay base de datos local de identidades. |
| **Activity Tracking** | ❌ Not configured | Solo existe telemetría de análisis en `project_telemetry_logs`, pero no historial de login de seguridad. |
| **Multi-Email** | ⏭️ Skipped (Clerk delegated) | Delegado nativamente en Clerk. Sin implementaciones custom. |

### `AUTH_CONFIG`
```properties
Providers: Google=⏭️ SKIPPED, Microsoft=⏭️ SKIPPED, LinkedIn=⏭️ SKIPPED, Email/Magic=⏭️ SKIPPED, Passkeys=⏭️ SKIPPED, WhatsApp=⏭️ SKIPPED, SAML=⏭️ SKIPPED
Features: AccountLinking=⏭️ SKIPPED, ActivityTracking=❌ Not found, MultiEmail=⏭️ SKIPPED
Active Identity Wrapper: Clerk (Vite SDK `@clerk/clerk-react` + Express SDK `@clerk/clerk-sdk-node`)
Local Bypass Mode: Enabled (Active when Clerk keys are absent in development)
```

---

## 📊 Executive Dashboard

| Fase de Auditoría | P0 | P1 | P2+ | Skipped | Veredicto | Razón Principal |
|---|---|---|---|---|---|---|
| **F1: Provider Compliance** | 0 | 0 | 0 | 33 | 🟢 **PASS** | Toda la lógica de proveedores está delegada con éxito a Clerk. |
| **F2: Identity Graph** | 1 | 0 | 0 | 8 | 🟡 **DEGRADED** | Falta de modelo local de usuarios e identidades (diseño local-first simplificado). |
| **F3: Session Management** | 0 | 0 | 1 | 1 | 🟢 **PASS** | Clerk maneja expiración, firmas RS256 de tokens y revocación nativa. |
| **F4: Security Rules** | 2 | 1 | 1 | 6 | 🔴 **CRITICAL FAIL**| Brecha de aislamiento multi-inquilino en base de datos local y riesgo de Path Traversal. |

---

## 🔴 P0 Findings (BLOQUEANTES)

### 🔴 P0-1: Aislamiento Incompleto Multi-Inquilino (Broken Tenant-Level Authorization)
* **Archivo afectado:** Repositorios SQLite en `apps/server/src/db/repositories/` ([projects.ts](file:///C:/dev/Connected_Strategy/apps/server/src/db/repositories/projects.ts), [worksheets.ts](file:///C:/dev/Connected_Strategy/apps/server/src/db/repositories/worksheets.ts), [jobs.ts](file:///C:/dev/Connected_Strategy/apps/server/src/db/repositories/jobs.ts), [v3-runs.ts](file:///C:/dev/Connected_Strategy/apps/server/src/db/repositories/v3-runs.ts)) y rutas.
* **Descripción:** Se corrió la migración `migrate_tenants.ts` que agrega con éxito la columna `tenant_id TEXT NOT NULL DEFAULT 'local-workspace'` en todas las tablas principales. El middleware `requireAuth` inyecta correctamente el `req.auth = { userId, tenantId }` tras verificar la firma del token de Clerk. Sin embargo, **ningún repositorio del backend filtra sus operaciones de consulta, inserción, actualización o eliminación mediante `tenant_id`**. Todas las consultas SQL en los repositorios locales (e.g. `SELECT * FROM projects WHERE id = ?` o `SELECT * FROM projects`) se ejecutan a nivel global sin el filtro `tenant_id = ?`.
* **Impacto:** En producción multi-inquilino (Clerk), cualquier usuario autenticado de un `Tenant A` puede leer, modificar o eliminar proyectos y worksheet_answers de un `Tenant B` simplemente adivinando o conociendo el `id` (Broken Object/Tenant Level Authorization - OWASP API5:2023).
* **Remediación:**
  1. Modificar las funciones de los repositorios para que requieran obligatoriamente el argumento `tenantId` (ej. `listProjects(tenantId: string)`).
  2. Modificar las queries SQL agregando la condición `WHERE tenant_id = ?` (ej. `SELECT * FROM projects WHERE id = ? AND tenant_id = ?`).
  3. Modificar las rutas para obtener el `tenantId` de `(req as any).auth.tenantId` y pasarlo como argumento al repositorio.

### 🔴 P0-2: Configuración Incompleta del Pipeline de Despliegue en Cloud Build (Boot Failure)
* **Archivo afectado:** [cloudbuild.yaml](file:///C:/dev/Connected_Strategy/cloudbuild.yaml#L24-L30) y [auth.ts](file:///C:/dev/Connected_Strategy/apps/server/src/middleware/auth.ts#L12-L20).
* **Descripción:** Para proteger la plataforma en entornos de producción, el middleware de Clerk (`auth.ts`) valida con rigor si las llaves secretas de Clerk están definidas. Si `process.env.NODE_ENV === 'production'` y faltan `CLERK_SECRET_KEY` o `CLERK_PUBLISHABLE_KEY`, el servidor imprime un mensaje de error fatal y **crashea inmediatamente** (`process.exit(1)`). Sin embargo, el archivo de despliegue [cloudbuild.yaml](file:///C:/dev/Connected_Strategy/cloudbuild.yaml) solo inyecta el secreto `GEMINI_API_KEY:latest`, omitiendo por completo las llaves de Clerk.
* **Impacto:** Cualquier intento de despliegue a producción a través del pipeline de Google Cloud Build fallará inmediatamente, ya que el contenedor de Cloud Run crasheará en el arranque al no recibir las llaves de Clerk.
* **Remediación:** Modificar [cloudbuild.yaml](file:///C:/dev/Connected_Strategy/cloudbuild.yaml) agregando los secretos correspondientes:
  ```yaml
  - '--set-secrets'
  - 'GEMINI_API_KEY=GEMINI_API_KEY:latest,CLERK_SECRET_KEY=CLERK_SECRET_KEY:latest,CLERK_PUBLISHABLE_KEY=CLERK_PUBLISHABLE_KEY:latest'
  ```

### 🔴 P0-3: Path Traversal / Escritura y Lectura Arbitraria de Archivos en ProjectStateStore
* **Archivo afectado:** [state-store.ts](file:///C:/dev/Connected_Strategy/packages/agents/src/v3/state-store.ts#L29-L31) y [routes.ts](file:///C:/dev/Connected_Strategy/apps/server/src/modules/pipeline/routes.ts#L146-L195).
* **Descripción:** Varios endpoints específicos de proyectos en [routes.ts](file:///C:/dev/Connected_Strategy/apps/server/src/modules/pipeline/routes.ts) (tales como `/state/:projectId`, `/moves/:projectId` y `/context/:projectId`) reciben el `projectId` directo de los parámetros de URL y lo pasan directamente a la clase `ProjectStateStore` sin validar si contiene caracteres de escape de directorios. `ProjectStateStore` ejecuta `path.join('data/projects', projectId)` para leer y escribir el estado de la aplicación.
* **Impacto:** Un atacante malintencionado puede enviar valores maliciosos en `projectId` (e.g., `..\..\..\evil_dir`) para crear directorios o leer/escribir archivos fuera del directorio seguro `data/projects/`, escalando a una vulnerabilidad de Path Traversal y Escritura Arbitraria de Archivos. Cabe notar que solo `/history/:projectId` implementa la función de escape seguro `safeProjectDataPath`.
* **Remediación:** Utilizar la función de validación `safeProjectDataPath` universalmente en todos los endpoints que reciben `projectId` de la URL para evitar que se puedan inyectar secuencias de escape (e.g., `..`).

---

## 🟡 P1 Findings

### 🟡 P1-1: Falta de Validación y Tipado Estricto de Parámetros URL (Zod URL Params Validation)
* **Archivo afectado:** [routes.ts](file:///C:/dev/Connected_Strategy/apps/server/src/modules/pipeline/routes.ts).
* **Descripción:** Aunque el proyecto hace un excelente uso de `Zod` para validar el cuerpo (body) de las peticiones HTTP (`RunFullSchema.safeParse(req.body)` en `/run-full` y `ContextSchema` en `/context/:projectId`), no valida la estructura o límites de los parámetros pasados a través de la URL como `req.params.projectId` y `req.params.moveId`.
* **Impacto:** Mayor susceptibilidad a inyecciones de caracteres inválidos o strings sumamente largos en la API antes de llegar a la lógica interna de almacenamiento.
* **Remediación:** Definir esquemas Zod simples para parámetros de URL (e.g., `z.string().min(3).max(100).regex(/^[a-z0-9-_]+$/)`) y validarlos antes de procesarlos.

---

## 🟢 P2+ y Mejoras

### 🟢 P2-1: Ausencia de Tabla Local `login_history` para Seguridad y Auditoría
* **Archivo afectado:** Base de datos SQLite (`db/index.ts`).
* **Descripción:** Al delegar la autenticación de forma local-first a Clerk o usar el mock bypass, la base de datos no registra los intentos de sesión o el historial de logins por dispositivo. Aunque Clerk ofrece un dashboard, no existe una réplica de seguridad en la consola del administrador local ni logs locales.
* **Remediación:** Agregar una tabla sencilla `login_history` en SQLite que reciba un webhook o evento de sesión de Clerk y guarde la IP, el dispositivo, el estado de autenticación y la fecha.

### 🟢 P2-2: Falta de Notificaciones sobre Cambio/Enlace de Nueva Identidad (Identity Links)
* **Archivo afectado:** Sistema de telemetría y Clerk configuration.
* **Descripción:** Si bien Clerk notifica al correo principal por defecto sobre logins desde nuevos dispositivos, la aplicación local no gatilla notificaciones internas o logs en el control tower (ej. telemetría) cuando se enlaza un nuevo método de autenticación a la cuenta de Clerk de un usuario.
* **Remediación:** Configurar Webhooks de Clerk para interceptar eventos de tipo `identity.linked` y emitir una alerta crítica en la vista de administración.

---

## ⏭️ Skipped Checks (Fase 1 & Fase 2 Completa)

Dado que la autenticación está delegada por completo en la infraestructura SaaS de **Clerk**, todos los checks relacionados con la criptografía y lógica interna de bajo nivel de OAuth y seguridad de credenciales han sido saltados, ya que Clerk los implementa bajo estándares líderes del sector (OWASP, NIST SP 800-63-4).

1. **Google OAuth Checks (G.1 - G.8):** Clerk usa Google Identity Services (GIS), valida `sub` como ID único, maneja CSRF con nonce/state interno de Clerk y verifica los JWTs en servidor. **STATUS: ⏭️ SKIPPED (Clerk delegated)**
2. **Microsoft / Entra ID OAuth Checks (M.1 - M.6):** Clerk provee flujos PKCE nativos con redirecciones estrictas y compatibilidad de Graph. **STATUS: ⏭️ SKIPPED (Clerk delegated)**
3. **LinkedIn OAuth Checks (L.1 - L.3):** Clerk maneja de forma transparente los flujos de re-autenticación y rate limiting. **STATUS: ⏭️ SKIPPED (Clerk delegated)**
4. **Email & Magic Link Checks (E.1 - E.4):** Clerk controla las políticas de expiración (por defecto < 15 minutos), single-use y entrega con soporte nativo de SPF/DKIM/DMARC. **STATUS: ⏭️ SKIPPED (Clerk delegated)**
5. **Passkeys / WebAuthn (P.1 - P.6):** Clerk implementa WebAuthn de forma nativa sobre HTTPS, incluyendo sign count validation (replay protection) y almacenamiento seguro de llaves criptográficas. **STATUS: ⏭️ SKIPPED (Clerk delegated)**
6. **SAML 2.0 Enterprise (S.1 - S.6):** Clerk maneja la parseo seguro de XML libre de ataques XXE, firmas fuertes SHA-256 e invalidación de Assertion IDs. **STATUS: ⏭️ SKIPPED (Clerk delegated)**
7. **Identity Graph / Linking (IG.2, IG.4 - IG.9):** Clerk realiza de forma segura el linking de múltiples proveedores a una sola identidad física verificando obligatoriamente el email antes del auto-link (mitigando OWASP Account Takeover). **STATUS: ⏭️ SKIPPED (Clerk delegated)**

---

## 🏁 Resumen Operativo de Auditoría

* **🔴 P0 Findings:** 3 (Aislamiento Incompleto Multi-Inquilino | Missing Clerk Secrets en Deploy | Path Traversal en State Store)
* **🟡 P1 Findings:** 1 (Zod params missing validation)
* **🟢 P2 Findings:** 2 (Falta de login_history | Sin Webhook de Identity Link en telemetría)
* **⏭️ SKIP Checks:** 31 (Proveedores e Identidad delegados a Clerk)
* **✅ PASS Checks:** 15 (Bypass local robusto, algoritmo RS256, expiración razonable, CORS con orígenes literales, rate-limit general y estricto, Zod body validation, ausencia de secretos en logs, cookie flags seguras en Clerk)

### **VEREDICTO FINAL DE SEGURIDAD:** 🔴 **NO-GO**
*La plataforma está excelentemente diseñada en local-first y el uso de Clerk simplifica drásticamente la seguridad de identidad. No obstante, los tres hallazgos P0 descritos (especialmente la brecha multi-inquilino a nivel de consultas de base de datos SQL y la vulnerabilidad de Path Traversal para crear archivos arbitrarios) representan un riesgo crítico e inaceptable para su despliegue seguro en producción. Estos puntos deben resolverse obligatoriamente antes de lanzar la versión SaaS multi-inquilino en Google Cloud Run.*

---

## Siguiente Paso

¿Quieres que ejecute `auditoria11-user-settings` para auditar el panel de configuración del usuario?
