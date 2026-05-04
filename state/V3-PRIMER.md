# V3 Upgrade — Primer para Antigravity

**Pega esto en Antigravity para ejecutar la siguiente fase del upgrade V3.**
**Modelo recomendado: Opus 4.7 (max thinking).**

Cada sesión ejecuta UNA sola fase y se detiene. Cuando termines, pega este mismo
prompt de nuevo para avanzar a la siguiente.

---

## LO QUE NECESITAS HACER (en este orden, sin saltarte nada)

### Paso 1 — Lee el checkpoint

```
Read C:\dev\Connected_Strategy\state\V3_CHECKPOINT.md
```

Identifica la primera fila cuyo Status sea `⬜ pending` o `🔴 blocked`.
Esa es tu **fase activa**.

- Si todas las fases son `✅ done` → ve al **Paso 4 (Release)**.
- Si la fase activa es `🔴 blocked` → **DETENTE** y reporta el bloqueador al humano.
  No intentes desbloquear solo; el humano necesita intervenir.

### Paso 2 — Ejecuta la fase activa

```
Read C:\dev\Connected_Strategy\prompts\task-sets\V3-PHASE-{NN}_{nombre}.md
```

Ejecuta **todas** las tareas listadas en ese archivo:
- Crea los archivos indicados
- Implementa el código exactamente como lo describe el SET
- Corre las verificaciones que el SET pide (tsc, tests, curl, etc.)

Reglas de implementación:
- NO toques `apps/server/src/modules/pipeline/routes.ts` ni el AGENT_REGISTRY existente
- NO toques migraciones SQLite existentes (solo agrega tablas nuevas)
- Valida TypeScript después de cada cambio: `pnpm --filter @cs/agents exec tsc --noEmit`
- Toda respuesta de LLM debe pasar validación zod antes de usarse
- NUNCA uses `--no-verify` ni `git push --force`

### Paso 3 — Cierra la fase

Cuando **todas** las verificaciones del SET pasen:

1. Edita `state/V3_CHECKPOINT.md`: cambia el status de la fase a `✅ done`
   y agrega la fecha y tu nombre como ejecutor.

2. Commit exactamente así:
   ```
   feat(v3): phase {NN} — {título corto del SET}
   ```

3. **DETENTE** y reporta al humano:
   - Fase completada: **PHASE-{NN}**
   - Archivos creados/editados: (lista)
   - Tests que pasaron: (lista)
   - Commit SHA
   - Cualquier desviación del plan con justificación

Si alguna verificación **falla**:
- Diagnostica la raíz (no parchees ni saltes tests)
- Si puedes arreglarlo: arréglalo, reintenta
- Si NO puedes tras 3 intentos: marca la fase como `🔴 blocked` en el checkpoint,
  escribe el bloqueador en detalle, y **DETENTE** — el humano necesita intervenir

### Paso 4 — Release (solo cuando todas las 7 fases estén ✅ done)

```bash
pnpm build
curl -X POST http://localhost:3000/api/pipeline/run-v3 \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","projectName":"Test Project","repoPath":"."}'
```

Verifica que existan:
```
data/projects/test/antigravity/INDEX.md
data/projects/test/antigravity/move-1/manifest.json
data/projects/test/antigravity/move-1/prompt.md
```

Si todo OK:
```
release(v3): mega-professional analyzer ready
```

---

## CONTEXT INICIAL (primera vez que corres esto)

Si es la primera vez (todas las fases en pending), antes de ejecutar PHASE-01,
dedica los primeros tool calls a entender el repo:

1. `Read C:\dev\Connected_Strategy\state\V3_MASTER_PLAN.md` — diseño completo
2. `Read C:\dev\Connected_Strategy\packages\domain\src\worksheets.ts` — IDs que NO romper
3. `Read C:\dev\Connected_Strategy\packages\agents\src\registry.ts` — entender v1/v2
4. `Read C:\dev\Connected_Strategy\apps\server\src\index.ts` — cómo se montan rutas
5. `Glob C:\dev\Connected_Strategy\packages\**\src\**\*.ts` — vista panorámica

Si ya ejecutaste fases anteriores, **NO repitas la exploración** — ve directo al checkpoint.

---

## SI ALGO NO ESTÁ CLARO

Antes de inventarte algo:
1. Re-lee la sección relevante de `state/V3_MASTER_PLAN.md`
2. Lee el SET de la fase con más cuidado
3. Si sigue ambiguo: marca `🔴 blocked` con la pregunta exacta y DETENTE

**NO inventes IDs de worksheet. NO inventes estructuras de Wharton.**
El propósito de v3 es eliminar la licencia creativa que tomó v2.

---

## RECUERDA: UNA FASE POR SESIÓN

No intentes ejecutar múltiples fases en una sola sesión. Cuando la fase activa
termine (o se bloquee), **DETENTE siempre**. El humano pega este prompt de nuevo
para la siguiente fase.
