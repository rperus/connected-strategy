# Local Project State Rhythm

Este documento reemplaza la skill ausente `project-state-rhythm`.

## Objetivo

Hacer que cualquier agente o persona pueda retomar el proyecto despues de:

- apagado de computadora
- cierre de Antigravity
- perdida de contexto
- cambio de modelo o de operador

## Archivos canonicos de reanudacion

1. `state/RESUME_INSTRUCTIONS.md`
2. `state/CURRENT_STATE.md`
3. `state/TASK_BOARD.json`
4. `state/CHECKPOINT_LOG.md`

## Cadencia obligatoria

### Antes de empezar una sesion

- Leer los 4 archivos canonicos.
- Confirmar el set activo y su write scope.
- Confirmar dependencias ya cumplidas.

### Durante la sesion

Actualizar estado:

- al terminar un milestone
- al bloquearse
- al cambiar de set
- al descubrir una decision nueva de arquitectura

### Antes de cerrar la sesion

Siempre actualizar:

- `state/CURRENT_STATE.md`
- `state/TASK_BOARD.json`
- `state/CHECKPOINT_LOG.md`

## Contenido minimo del checkpoint

- timestamp
- set
- owner
- que se completo
- que quedo en progreso
- blockers
- siguiente paso exacto
- archivos tocados
- comandos de verificacion corridos

## Reglas de calidad del estado

- No escribir texto vago.
- No usar "seguir despues" sin un siguiente paso exacto.
- No cerrar una sesion sin dejar claro:
  - donde quedo
  - que falta
  - cual es el siguiente archivo o comando

## Politica de verdad

- `CURRENT_STATE.md` = estado narrativo corto y humano.
- `TASK_BOARD.json` = estado estructurado y machine-readable.
- `CHECKPOINT_LOG.md` = historial de cambios de estado.

Si hay contradiccion:

1. gana `TASK_BOARD.json` para status
2. gana `CHECKPOINT_LOG.md` para historial
3. gana `CURRENT_STATE.md` para contexto inmediato
