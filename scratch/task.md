---
type: scratch
---
# Checklist Auditoría User Settings — Connected Strategy

## Phase 0: Auto-detection
- [x] Auto-detect user settings config & features
- [x] Define SETTINGS_CONFIG

## Phase 1: Connected Accounts
- [x] CA.1: Muestra todos los providers activos con status visual -> ⏭️ SKIPPED
- [x] CA.2: Flow de conectar nuevo provider (popup OAuth, no redirect) -> ⏭️ SKIPPED
- [x] CA.3: Flow de desconectar con modal de confirmación -> ⏭️ SKIPPED
- [x] CA.4: Guard "al menos un método" (no puede deslinkar último) -> ⏭️ SKIPPED
- [x] CA.5: Provider logos/iconos visibles -> ⏭️ SKIPPED
- [x] CA.6: "Primary" badge en identidad principal -> ⏭️ SKIPPED
- [x] CA.7: Re-autenticación requerida antes de link/unlink -> ⏭️ SKIPPED
- [x] CA.8: Toast/notificación de éxito/error -> ⏭️ SKIPPED

## Phase 2: Email Management
- [x] EM.1: `user_emails` tabla o modelo existe -> ⏭️ SKIPPED
- [x] EM.2: Distinción primary/secondary -> ⏭️ SKIPPED
- [x] EM.3: Email verification flow funcional -> ⏭️ SKIPPED
- [x] EM.4: "Make primary" flow con protección -> ⏭️ SKIPPED
- [x] EM.5: "Remove" email con protección (no puede borrar último) -> ⏭️ SKIPPED
- [x] EM.6: Status visual: verified ✅ / unverified ⚠️ -> ⏭️ SKIPPED
- [x] EM.7: "Resend verification" disponible -> ⏭️ SKIPPED

## Phase 3: Security
### 3A: Sessions
- [x] SE.1: Vista de sesiones activas (device + location + IP) -> ⏭️ SKIPPED
- [x] SE.2: Revocación individual por sesión -> ⏭️ SKIPPED
- [x] SE.3: "Sign out everywhere" / "Revoke all" -> ⏭️ SKIPPED
- [x] SE.4: Login history accesible (últimos 90 días) -> ⏭️ SKIPPED
- [x] SE.5: Información de device: browser + OS + location -> ⏭️ SKIPPED

### 3B: Passkeys Management
- [x] PK.1: UI para registrar nuevo passkey -> ⏭️ SKIPPED
- [x] PK.2: Lista de passkeys con nombre amigable -> ⏭️ SKIPPED
- [x] PK.3: Delete passkey (con guard de "al menos uno") -> ⏭️ SKIPPED
- [x] PK.4: Rename passkey -> ⏭️ SKIPPED
- [x] PK.5: Mostrar `last_used_at` -> ⏭️ SKIPPED

### 3C: Password / MFA
- [x] PW.1: Cambio de contraseña requiere contraseña actual -> ⏭️ SKIPPED
- [x] PW.2: MFA setup/toggle disponible (si MFA existe) -> ⏭️ SKIPPED

## Phase 4: Profile
- [x] PR.1: Campos editables: nombre, empresa, rol -> 🟡 P1 (Not implemented)
- [x] PR.2: Avatar: upload o sync de OAuth -> 🟢 P2 (Not implemented)
- [x] PR.3: Campos OAuth-synced mostrados como read-only (NO inputs disabled) -> ⏭️ SKIPPED
- [x] PR.4: "Synced from Google" indicator para datos importados -> ⏭️ SKIPPED
- [x] PR.5: Validación en campos editables -> ⏭️ SKIPPED

## Phase 5: Diseño Visual y UX
- [x] VX.1: Layout: sidebar + content (no tabs in page) -> ✅ PASS
- [x] VX.2: Status colors semánticos (green=active, amber=pending, red=error) -> ✅ PASS
- [x] VX.3: Dark mode support en Settings -> ✅ PASS
- [x] VX.4: Mobile responsive -> 🟢 P2 (Flex-wrap needed for side-by-side inputs)
- [x] VX.5: Loading skeletons (no spinners) -> ✅ PASS
- [x] VX.6: Empty states con guía de acción -> ⏭️ SKIPPED
- [x] VX.7: Color NUNCA es único indicador (icon + text siempre) -> ✅ PASS
- [x] VX.8: Error toasts NO auto-dismiss -> ✅ PASS (Inline errors used)
- [x] VX.9: Typography hierarchy (title > section > body > caption) -> ✅ PASS
- [x] VX.10: Micro-animations (connect success, toast slide) -> 🟢 P2 (Alerts entry animation missing)

## Phase 6: Anti-Patterns
- [x] AP.1: Disabled inputs para read-only data -> ✅ PASS
- [x] AP.2: Confirmshaming ("No thanks, I don't want security") -> ✅ PASS
- [x] AP.3: Feature wall (todo visible en una página sin tabs/sections) -> ✅ PASS
- [x] AP.4: Jargon labels ("OIDC Config", "Token TTL") -> ✅ PASS
- [x] AP.5: Auto-dismiss error toasts -> ✅ PASS
- [x] AP.6: No loading feedback en async actions -> ✅ PASS
