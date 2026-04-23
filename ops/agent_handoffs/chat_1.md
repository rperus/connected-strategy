SLOT: Chat 1
ESTADO: listo
TASK_ID: SET-08-W5-C1
TASK_TITLE: Wire WorksheetsPage to SQLite API
STARTED_AT: 2026-04-22T16:49:01-06:00
COMPLETED_AT: 2026-04-22T16:51:00-06:00
UPDATED_AT: 2026-04-22T16:51:00-06:00

---

## Summary

WorksheetsPage now uses the SQLite API as primary persistence, with localStorage as a fallback.

---

## What was done

### `apps/web/src/pages/WorksheetsPage.tsx` — full rewrite

#### Data flow
1. **On mount (or project change):** `GET /api/worksheets/:projectId` → merges API answers into local state, updates localStorage cache, sets storageMode = 'sqlite'
2. **Answer change:** updates React state + writes to localStorage immediately (offline cache, no API call on every keystroke)
3. **Guardar button:** `PUT /api/worksheets/:projectId/:worksheetId` with `{ version, answers, confidence }` payload. Toast shows "✓ Guardado en SQLite" or "⚠ Guardado en localStorage" depending on result.
4. **↑ Guardar todo button:** iterates all worksheets with answers and PUT each. Reports total saved count.
5. **Limpiar button:** clears local state + `DELETE /api/worksheets/:projectId/:worksheetId`
6. **Graceful degradation:** if API unavailable, storageMode = 'localstorage'; all edits still work via localStorage

#### New features
- **Project selector dropdown** — switches between projects, re-loads answers from API for the selected project. Last-used project remembered in localStorage.
- **Storage mode badge** — shows "SQLite ✓" (green), "localStorage" (yellow), or "Cargando…" (cyan) at the top of the list and in the editor header.
- **Toast notifications** — fixed bottom-right corner, auto-dismiss 2.5s: "✓ Guardado en SQLite", "⚠ Guardado en localStorage (API no disponible)", count for save-all.
- **Answer count** — shows `N/11 worksheets con datos` in the left panel.
- **Save All** — bulk PUT across all worksheets with answers.

#### Preserved from original
- All 5 question types (text, number, scale, boolean, choice/multi-choice) — JSX unchanged
- Completion % per worksheet and in editor header
- `loadAnswers` / `saveAnswers` ls helpers still used as fallback
- `completionPct()` function unchanged
- All CSS classes unchanged (ws-list, ws-item, ws-active, ws-editor, ws-section, etc.)

---

## Typecheck result

```
pnpm --filter @cs/web typecheck → PASS (0 errors)
```

---

## API contract used

| Method | URL | Purpose |
|---|---|---|
| GET | /api/worksheets/:projectId | Load all answers for a project |
| PUT | /api/worksheets/:projectId/:worksheetId | Save single worksheet answers |
| DELETE | /api/worksheets/:projectId/:worksheetId | Clear a worksheet |

config.ts keys: `api.worksheetsByProject(projectId)`, `api.worksheetAnswer(projectId, worksheetId)`

---

## NO-TOUCH compliance

Only `apps/web/src/pages/WorksheetsPage.tsx` was modified. No other files touched.
