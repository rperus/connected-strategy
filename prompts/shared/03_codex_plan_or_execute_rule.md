# Codex Plan Or Execute Rule

Usa esta regla cada vez que generes una mejora o una tarea derivada:

## Pide plan a Codex primero si pasa cualquiera de estas condiciones

- toca 3 o mas archivos
- cambia arquitectura o contratos
- agrega dependencia nueva
- cambia modelo de datos
- cambia runtime, launcher, puertos o procesos
- cambia seguridad, permisos o aprobaciones
- requiere secuencia de tareas y no un solo cambio aislado

## Manda prompt directo a Antigravity si todas estas condiciones se cumplen

- el cambio es pequeno
- el contexto es claro
- el impacto esta acotado
- el criterio de aceptacion es directo
- no requiere redisenar arquitectura

## Formato obligatorio de salida

Siempre entrega una de estas dos opciones:

1. `CODEX_PLAN_PROMPT`
2. `ANTIGRAVITY_EXECUTION_PROMPT`

Nunca respondas con sugerencia vaga. Debe quedar un prompt listo para pegar.
