# 🛡️ Zero UI Audit Report — Connected Strategy
**Date:** May 26, 2026  
**Auditor:** Antigravity Zero-UI Agent (Escuadrón 1-4)  
**Target Directory:** `c:\dev\Connected_Strategy`  
**Stack Detected:** React + Vite + TS (Frontend) | Node.js + Express (Backend) | SQLite (Database)  
**Verification:** Static analysis & census of 31 active pages and 12 core components.

---

## 📊 1. Zero-UI Score & Verdict

| Metric | Score / Status | Description |
| :--- | :--- | :--- |
| **Initial Score** | 100 / 100 | Clean state before audits |
| **P0 Penalties** | 0 pts | No global state bugs in loops or identical route overlaps |
| **P1 Penalties** | -40 pts | 4 P1 violations (-10 pts each) |
| **P2 Penalties** | -15 pts | 3 P2 violations (-5 pts each) |
| **P3 Penalties** | 0 pts | No minor ergonomics/coherence violations |
| **Final Score** | **45 / 100** | **CRITICAL (Crítico)** |
| **Verdict** | **NO-GO** | Requires safe refactoring of redundant manual saves and sidebar navigation overlaps. |

---

## 🔍 2. Interactive Element & Page Census

We mapped **31 pages** in [App.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/App.tsx) and all **12 core components** in `apps/web/src/components`. Codebase hygiene is exceptionally high: **0 Zombie Elements** found in disk (every single page file in `src/pages` is active and lazy-loaded via Clerk authentication middleware or local routing).

### Sidebar Navigation Destinations (Source of Truth)
Extracted programmatically from [Sidebar.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/components/Sidebar.tsx):
- `/` (Inicio/Dashboard)
- `/health` (Salud Portfolio)
- `/portfolio` (Proyectos)
- `/worksheets` (Worksheets WS01-11)
- `/competitive` (Ventaja Competitiva)
- `/business-model` (Business Model)
- `/data-science` (Data Science)
- `/architecture` (Arquitectura)
- `/ai-frontier` (AI Frontier)
- `/proposals` (Propuestas)
- `/reports` (Reportes)
- `/launcher` (Pipeline Launcher)
- `/settings` (Configuración)

---

## 🚫 3. Detailed Audit Findings (Enumerate → Cross-reference → Judge)

### 👻 Ghost Buttons (P1)
1. **Redundant Manual "Guardar" Button**  
   - **Location:** [WorksheetsPage.tsx:L528-L534](file:///C:/dev/Connected_Strategy/apps/web/src/pages/WorksheetsPage.tsx#L528-L534)  
   - **Violation:** The worksheet editor already has a **debounced auto-save mechanism** at lines 251-256 that reactively PUTs answers to SQLite via API 1.5 seconds after the user stops typing, and immediately caches them to `localStorage` (line 249). The manual "Guardar" button is redundant and creates a false sense of manual sync pressure.
   - **Cognitive Law:** Locus of Control (Agencia).
   - **Recommended Fix:** Eliminate the button, let the auto-save status indicators do the talking.

2. **Redundant "Guardar todo" Button**  
   - **Location:** [WorksheetsPage.tsx:L390-L398](file:///C:/dev/Connected_Strategy/apps/web/src/pages/WorksheetsPage.tsx#L390-L398)  
   - **Violation:** Renders a primary button in the left sidebar directory to save all worksheets, which is already handled by automatic background debounces on change.
   - **Cognitive Law:** Locus of Control.
   - **Recommended Fix:** Safely prune the button from the sidebar layout.

### 👯 Doppelgänger Navigation & Links (P1)
3. **Redundant "Propuestas" Dashboard Card Link**  
   - **Location:** [HomePage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/HomePage.tsx)  
   - **Violation:** A main action card on the dashboard points directly to `/proposals`. Since `/proposals` is always present on the sticky, persistent static `Sidebar`, this duplicates navigation and triggers excessive cognitive scanning.
   - **Cognitive Law:** Jakob's Law (Consistencia).
   - **Recommended Fix:** Rely on the Sidebar layout for main app routes or change dashboard cards into dynamic metrics pills.

4. **Redundant Worksheet Navigation Cards**  
   - **Location:** [HomePage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/HomePage.tsx)  
   - **Violation:** Dashboard cards listing "WS01", "WS02" duplicate access to `/worksheets` which is already in the main menu.
   - **Cognitive Law:** Jakob's Law.

### 👁️ Phantom Affordances (P2)
5. **Non-Interactive StorageBadge Pill**  
   - **Location:** [WorksheetsPage.tsx:L140-L152](file:///C:/dev/Connected_Strategy/apps/web/src/pages/WorksheetsPage.tsx#L140-L152)  
   - **Violation:** The colored badge status pills (`badge-success` or `badge-warning`) indicating "SQLite ✓" or "localStorage" look like interactive filter chips. They trigger cursor pointers or hover animations but have zero click handlers.
   - **Cognitive Law:** Affordances (Gibson/Norman).
   - **Recommended Fix:** Style as standard flat label/pill without hover animations or cursor-pointer, or add a popover explaining SQLite sync.

### ⚔️ Competing CTAs (P2)
6. **Worksheet Editor Primary Actions Congestion**  
   - **Location:** [WorksheetsPage.tsx:L528-L536](file:///C:/dev/Connected_Strategy/apps/web/src/pages/WorksheetsPage.tsx#L528-L536)  
   - **Violation:** "Guardar" (primary button in action bar) competes directly with "Guardar todo" (primary in left panel) and "Limpiar" (secondary) without a clear focal point.
   - **Cognitive Law:** Hick-Hyman Law (Decision Fatigue).

### 🪞 Filter Schizophrenia (P2)
7. **Conflicting Proposals Filters**  
   - **Location:** [ProposalsPage.tsx:L97](file:///C:/dev/Connected_Strategy/apps/web/src/pages/ProposalsPage.tsx#L97)  
   - **Violation:** A local dropdown to select a project overrides or conflicts with the global `ProjectContext` selected project, confusing the user about which project context currently commands the analysis view.
   - **Cognitive Law:** Miller's Law (Cognitive Overload).

---

## 🛠️ 4. Actionable Remediation Plan

1. **Auto-save Promotion:** Remove all manual "Guardar" and "Guardar todo" buttons in [WorksheetsPage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/WorksheetsPage.tsx). Prominently style the `StorageBadge` to dynamically reflect save state transitions ("Guardando...", "Sincronizado", "Guardado localmente").
2. **Dashboard Simplification:** Redesign the [HomePage.tsx](file:///C:/dev/Connected_Strategy/apps/web/src/pages/HomePage.tsx) to focus exclusively on active high-level metrics (SAC scores, maturity grade, live coach insights) rather than routing buttons that mimic the Sidebar menu.
3. **Sanitize Badges:** Restructure `StorageBadge` class rules so they do not trigger hand pointers (`cursor: default`).
