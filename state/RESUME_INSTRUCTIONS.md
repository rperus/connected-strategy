# Resume Instructions

Si la sesion se perdio o la computadora se apago, retoma asi:

1. Leer `state/CURRENT_STATE.md`
2. Leer `state/TASK_BOARD.json`
3. Leer la ultima entrada de `state/CHECKPOINT_LOG.md`
4. Confirmar el set activo o el siguiente set listo
5. Releer el prompt del set correspondiente en `prompts/task-sets/`
6. Continuar exactamente desde el siguiente paso declarado

## Regla de reanudacion

No inventar un nuevo punto de entrada si ya existe uno en `CURRENT_STATE.md`.

## Regla de cierre

Antes de terminar cualquier sesion, dejar:

- estado narrativo actualizado
- estado JSON actualizado
- checkpoint log actualizado

## Archivos que siempre deben existir y mantenerse vivos

- `state/CURRENT_STATE.md`
- `state/TASK_BOARD.json`
- `state/CHECKPOINT_LOG.md`
