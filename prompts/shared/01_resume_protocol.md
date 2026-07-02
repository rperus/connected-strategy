---
type: prompt
---
# Resume Protocol

Antes de empezar cualquier set:

1. Leer `state/RESUME_INSTRUCTIONS.md`
2. Leer `state/CURRENT_STATE.md`
3. Leer `state/TASK_BOARD.json`
4. Leer la ultima entrada de `state/CHECKPOINT_LOG.md`
5. Leer este prompt compartido y el prompt especifico del set

## Cuando retomes una sesion

- No rehagas trabajo sin revisar el estado primero.
- No adivines que falta. Usa `CURRENT_STATE.md` y `TASK_BOARD.json`.
- Si algo no coincide, registra la discrepancia y resuelvela antes de seguir.

## Antes de pausar o cerrar

Escribe un checkpoint con:

- timestamp
- set
- owner
- progreso exacto
- blocker exacto
- siguiente paso exacto

## Si te bloqueas

- documenta el bloqueo
- no invadas otro write scope
- pasa el problema al Program Director
