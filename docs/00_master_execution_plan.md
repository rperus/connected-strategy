# Connected_Strategy Master Execution Plan

## 1. Objetivo del producto

Construir una plataforma local que funcione como torre de control estrategica para todos los proyectos dentro de `C:\dev`, con estas capacidades integradas:

- Analizar plataformas y repos con Connected Strategy, competitive advantage y business model design.
- Llenar worksheets vivas y recalcular automaticamente dependencias cuando el usuario cambie una respuesta.
- Generar graficas, puntajes y explicaciones para WTP, cost reduction, switching costs, activity system, competitive positioning y business model strength.
- Investigar competencia y comparar cada plataforma con categorias, players y propuestas rivales.
- Convertir hallazgos y mejoras en prompt packets accionables para Codex o Antigravity.
- Lanzar plataformas y herramientas desde un solo portal local sin colisiones de puertos, procesos o variables.
- Imprimir y exportar reportes.
- Soportar mejora continua y reanudacion total despues de apagones o sesiones interrumpidas.

## 2. Restricciones no negociables

- Todo archivo creado por este proyecto debe vivir en `C:\dev\Connected_Strategy`.
- La experiencia principal debe ser `web app local`, empaquetada luego como app de escritorio con icono.
- La arquitectura debe ser `Gemini-first`, pero con adaptador para otros proveedores. No bloquearse a un solo modelo.
- La plataforma debe ser `approval-gated`: puede analizar, proponer, preparar prompts y preparar cambios, pero no tocar otros proyectos sin aprobacion explicita.
- El sistema debe cubrir tanto proyectos locales como conocimiento externo relevante del curso y business plans.
- Debe incluir lanzamiento de plataformas sin colisiones y acceso directo a herramientas externas como Codex y Antigravity.

## 3. Arquitectura objetivo

### 3.1 Superficie de producto

- `apps/web`: workbench principal con portfolio, worksheets, graficas, proposals, launcher y reportes.
- `apps/server`: API local, jobs, analisis, knowledge ingestion, runtime manager y exportes.
- `apps/desktop`: wrapper Electron para shortcut, icono, tray y taskbar-ready packaging.

### 3.2 Paquetes internos

- `packages/domain`: tipos, schemas, worksheet engine, scoring contracts.
- `packages/knowledge`: ingestion, chunking, indexing y conceptos del curso.
- `packages/agents`: agentes especialistas y orquestacion determinista.
- `packages/runtime`: deteccion de stacks, launch profiles y collision manager.
- `packages/reporting`: report builder, print views y export helpers.
- `packages/prompt-packets`: generacion de prompts para Codex y Antigravity.

### 3.3 Persistencia y estado

- `SQLite` para estado operativo, historial, prompts y checkpoints.
- `FTS` local para busqueda de conocimiento y evidencia.
- Archivos Markdown/JSON en `state/` para reanudacion humana y agentica.

## 4. Capacidades funcionales obligatorias

### 4.1 Portfolio y launcher

- Descubrir proyectos en `C:\dev`.
- Clasificarlos por stack y madurez.
- Crear `LaunchProfile` por proyecto.
- Abrir proyectos con un click.
- Evitar colisiones de puertos, procesos, nombres de sesion y variables.
- Incluir tiles para `Codex`, `Antigravity` y cualquier herramienta/URL configurada.

### 4.2 Strategy workbench

- Editor facil para worksheets.
- Recalculo inmediato cuando el usuario cambia respuestas o pesos.
- Mapeo obligatorio de cada analisis a:
  - `Sense -> Transmit -> Analyze -> React -> Repeat`
  - `Recognize -> Request -> Respond -> Repeat`
- Puntajes transparentes y explicables.
- Historial de versiones por worksheet y comparacion antes/despues.

### 4.3 Competitive advantage y modelo de negocio

- Graficas de posicionamiento competitivo.
- Activity system map.
- WTP vs cost map.
- Switching cost index.
- Business model definition y business model improvement.
- Packaging, pricing, GTM y competitive narrative.

### 4.4 Data science, arquitectura y AI frontier

- Seccion dedicada de mejoras con rigor MITx:
  - experimentacion
  - inferencia causal
  - prediccion
  - segmentacion
  - series de tiempo
  - network/graph analysis
- Seccion de mejoras de arquitectura.
- Seccion de AI frontier con mejoras priorizadas, no hype.

### 4.5 Prompt packets y reportes

- Cada hallazgo relevante genera:
  - `codex_plan_prompt.md` si requiere plan/implementacion compleja
  - `antigravity_execution_prompt.md` si es cambio acotado y ejecutable
- Reportes imprimibles en HTML y PDF.
- Reportes para portfolio, proyecto y propuesta.

## 5. Modelo operativo multiagente

- No usar chat libre entre agentes como mecanismo principal.
- Usar agentes especialistas sobre artefactos estructurados y write scopes separados.
- Mantener un `Program Director` como coordinador continuo.
- Ejecutar por sets con dependencias declaradas y checkpoints frecuentes.
- Todo set debe actualizar `state/TASK_BOARD.json`, `state/CURRENT_STATE.md` y `state/CHECKPOINT_LOG.md`.

## 6. Fases de construccion

### Fase 0 - Preparacion y control

- Crear Program Director y rhythm de reanudacion.
- Crear tablero de sets.
- Bloquear write scopes.

### Fase 1 - Bootstrap

- Crear monorepo base.
- Configurar root scripts, workspace, TypeScript, Electron shell, API shell y web shell.

### Fase 2 - Construccion paralela principal

- Knowledge + domain
- Analysis orchestration
- UI workbench
- Runtime launcher
- Reporting + prompt packets
- Desktop shell + icons

### Fase 3 - Integracion

- Unir modulos.
- Cerrar rutas, estados y eventos.
- Validar lanzamiento sin colisiones.

### Fase 4 - QA, release local y pinning

- Smoke tests.
- Print/export tests.
- Packaging local Windows.
- Shortcut de escritorio y app pin-ready para taskbar.

## 7. Criterios de exito

- La app descubre proyectos reales en `C:\dev`.
- Permite abrir diferentes plataformas sin colisiones.
- Las worksheets se editan facil y recalculan todo lo dependiente.
- Los reportes se imprimen y exportan.
- Los prompts de mejora salen con contexto, evidencia y criterio de aceptacion.
- Si la maquina se apaga, el trabajo puede reanudarse leyendo el estado local.
- El sistema deja lista una ruta clara para que Antigravity construya el producto completo.
