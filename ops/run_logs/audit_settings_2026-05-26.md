# ⚙️ Auditoría User Settings — Connected Strategy

**Fecha:** 2026-05-26  
**Settings Config:** `Page: ✅ Exists | ConnectedAccounts: ❌ | Emails: ❌ | Sessions: ❌ | Passkeys: ❌ | DarkMode: ❌ (Global custom property CSS theme active, but no page toggle)`  
**Stack de Destino:** Backend: Node.js+Express | DB: SQLite | Cloud: Local/Desktop | Frontend: React+Vite | OS: Windows

---

## 📊 Executive Dashboard

| Fase | P0 | P1 | P2+ | Skipped | Veredicto | Comentarios |
|------|----|----|-----|---------|-----------|-------------|
| **F1: Connected Accounts** | 0 | 1 | 0 | 8 | 🟡 ADVERTENCIA | Clerk auth está integrado de forma opcional para producción, pero no hay interfaz de gestión local de providers. |
| **F2: Email Management** | 0 | 0 | 1 | 7 | 🟢 SALUDABLE | Diseño local-first que opera por defecto bajo un rol de tenant único local (`local-admin`). Multi-email omitido ad-hoc. |
| **F3: Security** | 0 | 1 | 0 | 12 | 🟡 ADVERTENCIA | La clave de la API de Gemini se almacena en texto plano en la tabla SQLite local `settings` sin cifrado o hash básico. |
| **F4: Profile** | 0 | 1 | 1 | 3 | 🟡 ADVERTENCIA | No existen campos editables de identidad (nombre, empresa, rol) o gestión de avatar en el panel local de ajustes. |
| **F5: Visual Design & UX** | 0 | 0 | 2 | 1 | 🟢 SALUDABLE | Excelencia visual premium (dark mode de alta fidelidad, colores semánticos correctos), con detalles menores en responsive y micro-animaciones. |
| **F6: Anti-Patterns** | 0 | 0 | 0 | 0 | 🟢 EXCELENTE | Ningún anti-pattern detectado. No hay confirmshaming, feature wall, jerga técnica excesiva o toasts con auto-dismiss en errores. |

---

## 🔍 Resumen General de Findings

> [!NOTE]  
> **Resumen Métrico:** 🔴 **P0**: 0 | 🟡 **P1**: 3 | 🟢 **P2**: 4 | ⏭️ **SKIP**: 32 | ✅ **PASS**: 14  
> **Veredicto Final:** 🟡 **APROBADO CON CAMBIOS RECOMENDADOS** (Ajustes de UX y almacenamiento seguro recomendados antes de lanzar a producción).

---

## 🛠️ Detalle de Findings por Severidad

### 🔴 Severidad P0 (Bloqueantes / Riesgo Crítico)
*Ningún riesgo de severidad P0 detectado.* Las compuertas de seguridad del backend previenen la edición o adición manual de claves Gemini en entornos de producción, mitigando lockout masivo o fugas de tokens en Cloud Run.

---

### 🟡 Severidad P1 (Riesgo Alto / Deficiencia Funcional)

#### 1. PR.1: Gestión de Identidad y Perfil Inexistente (Fase 4 - Profile)
- **Evidencia:** [SettingsPage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/SettingsPage.tsx) no implementa ningún formulario para que el usuario gestione su perfil local (nombre, rol, empresa).
- **Impacto:** Si la aplicación escala a un entorno multi-usuario o colaborativo fuera de local, los usuarios no podrán actualizar sus datos sin depender directamente del proveedor de Clerk.
- **Remediación Sugerida:** Agregar una tarjeta de perfil dentro de la página con inputs validados para nombre, empresa y rol, persistidos en la tabla SQLite de usuarios.

#### 2. CA.1: Cuentas Conectadas e Interfaz OAuth Ausente (Fase 1 - Connected Accounts)
- **Evidencia:** Clerk está importado en [App.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/App.tsx) pero la UI local no provee controles para vincular o desvincular cuentas colaborativas o proveedores OAuth alternativos de forma explícita.
- **Impacto:** El control tower restringe la modularidad de cuentas conectadas a nivel visual, dejando toda la orquestación a la consola externa de Clerk.
- **Remediación Sugerida:** Incrustar el componente oficial `<UserProfile />` de Clerk en una pestaña dedicada de la página de ajustes cuando se detecte un entorno de producción con claves Clerk activas.

#### 3. SE.SEC: Almacenamiento en Texto Plano de la Gemini API Key (Fase 3 - Security / Backend)
- **Evidencia:** El backend en [routes.ts](file:///C:/dev/Connected_Strategy/apps/server/src/modules/settings/routes.ts#L53-L57) escribe la API Key directamente en texto plano en la tabla SQLite `settings`.
- **Impacto:** Si un atacante obtiene acceso de lectura al archivo local `connected_strategy.db`, o si el archivo de base de datos se comparte accidentalmente en un commit, la clave Gemini queda expuesta al instante.
- **Remediación Sugerida:** Cifrar la clave localmente utilizando algoritmos simétricos básicos (por ejemplo, AES-256-GCM con una llave derivada del entorno de la máquina) o aplicar un hash de obfuscación simple para evitar la visibilidad directa del token `AIzaSy...`.

---

### 🟢 Severidad P2 (Sugerencias de UX / Mejoras Visuales)

#### 1. EM.1: Soporte de Emails Secundarios No Implementado (Fase 2 - Emails)
- **Evidencia:** El esquema de base de datos no contiene una tabla `user_emails`. Todo opera bajo el middleware `requireAuth` que inyecta un tenant local genérico (`local-admin`).
- **Impacto:** Imposibilidad de configurar múltiples cuentas de email para notificaciones o alertas cruzadas de la plataforma.
- **Remediación Sugerida:** Documentar esto como un comportamiento de diseño local-first consciente o mapear una migración para soportar esquemas multi-tenant colaborativos.

#### 2. PR.2: Gestión de Avatar Inexistente (Fase 4 - Profile)
- **Evidencia:** [SettingsPage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/SettingsPage.tsx) carece de soporte para subir imágenes de avatar locales o sincronizar el avatar oficial de Clerk en la barra lateral.
- **Impacto:** Reducción en la personalización visual de la Torre de Control estratégica.
- **Remediación Sugerida:** Agregar un componente de upload de avatar con previsualización circular e integración con la API de Clerk.

#### 3. VX.4: Resiliencia de Controles en Pantallas Extremadamente Estrechas (Fase 5 - Responsive)
- **Evidencia:** El formulario para la API Key de Gemini usa un estilo inline flexible side-by-side (`display: 'flex', gap: 12`) en [SettingsPage.tsx:L127-143](file:///C:/dev/Connected_Strategy/apps/web/src/pages/SettingsPage.tsx#L127-L143) para el input de tipo password y el botón de guardado.
- **Impacto:** En resoluciones de pantalla menores a 480px de ancho, el botón y el input se comprimirán horizontalmente, dificultando la lectura y entrada del texto.
- **Remediación Sugerida:** Cambiar a un layout de columna vertical reactivo (`flex-direction: column`) en móviles utilizando media queries de CSS en el archivo global [index.css](file:///C:/dev/Connected_Strategy/apps/web/src/index.css).

#### 4. VX.10: Transición Abrupta de Alertas de Validación (Fase 5 - Micro-animations)
- **Evidencia:** Los bloques de mensaje de error y éxito de guardado en [SettingsPage.tsx:L167-179](file:///C:/dev/Connected_Strategy/apps/web/src/pages/SettingsPage.tsx#L167-L179) aparecen y desaparecen instantáneamente del DOM sin aplicar transiciones CSS.
- **Impacto:** Salto visual tosco que rompe la estética premium e interactiva de la plataforma.
- **Remediación Sugerida:** Envolver la alerta en un componente animado que implemente una animación suave de entrada tipo fade-in / slide-down.

---

## 📋 Registro Completo de Checks Evaluados

### Fase 0: Auto-Detección
- [x] **Auto-detect user settings config & features:** Completado con éxito. Se determinó la existencia de la página y la ausencia de submódulos locales de sesión, passkeys o emails secundarios.
- [x] **Define SETTINGS_CONFIG:** `Page: ✅ Exists | ConnectedAccounts: ❌ | Emails: ❌ | Sessions: ❌ | Passkeys: ❌ | DarkMode: ❌`

### Fase 1: Connected Accounts (OAuth & Auth Providers)
- [x] **CA.1 (Status visual de providers):** `⏭️ SKIPPED (no settings UI)`
- [x] **CA.2 (Conexión vía popup/OAuth sin redirecciones complejas):** `⏭️ SKIPPED`
- [x] **CA.3 (Confirmación modal antes de desconectar):** `⏭️ SKIPPED`
- [x] **CA.4 (Protección lockout contra desconexión del último método):** `⏭️ SKIPPED`
- [x] **CA.5 (Logotipos/íconos correctos de los proveedores):** `⏭️ SKIPPED`
- [x] **CA.6 (Badge primary en identidad principal):** `⏭️ SKIPPED`
- [x] **CA.7 (Re-autenticación requerida para cambios críticos):** `⏭️ SKIPPED`
- [x] **CA.8 (Mensajería toast tras link/unlink exitoso):** `⏭️ SKIPPED`

### Fase 2: Email Management (Gestión de Emails Secundarios)
- [x] **EM.1 (Tabla de emails estructurada en SQLite):** `⏭️ SKIPPED`
- [x] **EM.2 (Diferenciación primary/secondary):** `⏭️ SKIPPED`
- [x] **EM.3 (Flujo de verificación de email activo):** `⏭️ SKIPPED`
- [x] **EM.4 (Seguridad al marcar email como principal):** `⏭️ SKIPPED`
- [x] **EM.5 (Guard para prevenir eliminación de la última cuenta de email):** `⏭️ SKIPPED`
- [x] **EM.6 (Status visual de verificación checked/warning):** `⏭️ SKIPPED`
- [x] **EM.7 (Opción disponible para re-enviar emails de confirmación):** `⏭️ SKIPPED`

### Fase 3: Security & Session Control
- [x] **SE.1 (Lista de dispositivos y sesiones activas con IP/Location):** `⏭️ SKIPPED`
- [x] **SE.2 (Terminación de sesiones individuales):** `⏭️ SKIPPED`
- [x] **SE.3 (Cierre de sesión global de todos los dispositivos):** `⏭️ SKIPPED`
- [x] **SE.4 (Historial de accesos de los últimos 90 días):** `⏭️ SKIPPED`
- [x] **SE.5 (Parser del User-Agent de dispositivo y navegador):** `⏭️ SKIPPED`
- [x] **PK.1 (Registrar nuevas Passkeys/WebAuthn):** `⏭️ SKIPPED`
- [x] **PK.2 (Nombres amigables para llaves de seguridad):** `⏭️ SKIPPED`
- [x] **PK.3 (Eliminación segura de passkey con guard lockout):** `⏭️ SKIPPED`
- [x] **PK.4 (Edición del nombre de la llave):** `⏭️ SKIPPED`
- [x] **PK.5 (Campos de último uso `last_used_at` activos):** `⏭️ SKIPPED`
- [x] **PW.1 (Cambio de contraseña requiere contraseña actual):** `⏭️ SKIPPED`
- [x] **PW.2 (Habilitar/Deshabilitar MFA de dos factores):** `⏭️ SKIPPED`

### Fase 4: User Profile
- [x] **PR.1 (Formulario editable de datos: nombre, rol, empresa):** `🟡 P1 Finding` (Inexistente)
- [x] **PR.2 (Upload de imagen de avatar o sync):** `🟢 P2 Finding` (Inexistente)
- [x] **PR.3 (Campos OAuth bloqueados mostrados legibles, no inputs deshabilitados):** `⏭️ SKIPPED`
- [x] **PR.4 (Borde o indicator "Synced from Google" claro):** `⏭️ SKIPPED`
- [x] **PR.5 (Validación del formulario de perfil):** `⏭️ SKIPPED`

### Fase 5: Visual Design & UX Premium
- [x] **VX.1 (Estructura Sidebar + Content limpia):** `✅ PASS` (Integrado perfectamente en el layout global)
- [x] **VX.2 (Gama cromática de status coherente):** `✅ PASS` (Verde para conectado, ambar para modo determinista offline)
- [x] **VX.3 (Compatibilidad nativa con Dark Mode):** `✅ PASS` (Tokens de estilo dark premium robustos y armoniosos)
- [x] **VX.4 (Diseño responsivo móvil sin desbordamientos):** `🟢 P2 Finding` (Mejora recomendada en el flex del formulario API Key)
- [x] **VX.5 (Lector loading tipo skeleton, evita spinners tradicionales):** `✅ PASS` (Los skeletons de carga del layout previenen saltos toscos de renderizado)
- [x] **VX.6 (Empty states informativos con call-to-action):** `⏭️ SKIPPED` (No aplicable a formularios puros)
- [x] **VX.7 (Indicadores semánticos dobles: color + texto/icono siempre):** `✅ PASS` (Garantiza accesibilidad WCAG al no apoyarse únicamente en el color de estado)
- [x] **VX.8 (Toasts y alertas de error persisten hasta descarte explícito):** `✅ PASS` (Las notificaciones son inline persistentes en el cuerpo de la tarjeta)
- [x] **VX.9 (Jerarquía tipográfica escalada en Outfit/Inter):** `✅ PASS` (Encabezados e instructivos en perfecta proporción de escala)
- [x] **VX.10 (Micro-animaciones fluidas en cambios de estado):** `🟢 P2 Finding` (Falta animación de entrada en mensajes de alerta)

### Fase 6: Anti-Patterns
- [x] **AP.1 (Inputs deshabilitados grises difíciles de leer):** `✅ PASS` (Se evita el anti-pattern de inputs grises inaccesibles para datos de solo lectura)
- [x] **AP.2 (Confirmshaming manipulativo en diálogos de confirmación):** `✅ PASS`
- [x] **AP.3 (Feature wall abrumador en scroll infinito):** `✅ PASS` (La interfaz es sumamente minimalista, limpia y enfocada)
- [x] **AP.4 (Jerga técnica en etiquetas dirigidas al usuario final):** `✅ PASS`
- [x] **AP.5 (Toasts de error que desaparecen solos antes de leerse):** `✅ PASS`
- [x] **AP.6 (Acciones asíncronas bloqueantes sin feedback visual):** `✅ PASS` (El botón cambia su estado y texto a "Validando..." de forma proactiva)

---

## 🔮 Siguiente Paso Sugerido
> ¿Quieres que ejecute **`auditoria12-admin-backoffice`** para auditar en profundidad la estructura, seguridad y diseño visual de las herramientas administrativas del panel de back-office en Connected Strategy?
