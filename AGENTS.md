# AGENTS — Connected Strategy

> Punto de entrada para cualquier agente AI que trabaje en este repositorio.

## Workspace Isolation (MANDATORY — READ FIRST)

This agent operates EXCLUSIVELY within `c:\dev\Connected_Strategy`.
Before ANY action, verify the workspace URI matches this path.

**Prohibited actions:**
- Reading, writing, or listing files in any other `c:\dev\*` directory
- Acting on conversation history from other projects (rodrigo-os, Balam, tenders, health, YouTube, grants)
- Providing cross-project context or recommendations

**If the user asks about another project:** Respond with *"Eso pertenece a otro workspace. Ábrelo en otra ventana de VS Code."*

---

## Este Repo Es Una Plataforma Estratégica Local

Connected Strategy es un control tower local-first para análisis de estrategia conectada basado en el curriculum de Wharton Online.

## Antes De Hacer Cualquier Cosa

Lee estos documentos en este orden:

1. `CURRENT_STATE.md`
2. `CURRENT_TASK.md`
3. `CHANGELOG_PROJECT.md`
4. `PROJECT_MANIFEST.yaml`
5. `README.md`

## Reglas Fundamentales

- Todo artefacto nuevo del proyecto debe vivir dentro de `c:\dev\Connected_Strategy`
- El trabajo se coordina por sets (waves). No mezclar write scopes entre agentes paralelos
- El estado canónico vive en la raíz: `CURRENT_STATE.md`, `CURRENT_TASK.md`, `CHANGELOG_PROJECT.md`, `PROJECT_MANIFEST.yaml`
- Antes de arrancar cualquier set, leer los prompts compartidos en `prompts/shared/`

## Convención Operativa

| Ruta | Propósito |
|------|-----------|
| `CURRENT_STATE.md` | Estado operativo vivo |
| `CURRENT_TASK.md` | Tarea actual y próximo wave |
| `CHANGELOG_PROJECT.md` | Registro de cambios |
| `PROJECT_MANIFEST.yaml` | Metadata del proyecto |
| `apps/` | Aplicación web (Vite + React) |
| `packages/` | Paquetes compartidos (domain, agents) |
| `prompts/` | Prompts por set de tareas |
| `config/` | Configuración de puertos y runtime |
| `docs/operations/` | Documentación operativa |

## Antes de Reclamar Completado

Actualizar los artefactos afectados:
- `CURRENT_STATE.md`
- `CURRENT_TASK.md`
- `CHANGELOG_PROJECT.md`

## Arranque

```bat
scripts\start.bat
```

URLs:
- UI: http://127.0.0.1:4310
- API: http://127.0.0.1:4311
