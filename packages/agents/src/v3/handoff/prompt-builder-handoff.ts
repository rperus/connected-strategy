import type { MoveManifest } from './manifest-builder.js';

export function buildAntigravityPrompt(
  moveId: string,
  projectId: string,
  manifest: MoveManifest
): string {
  return `# Antigravity Worker Prompt — ${moveId}

Eres un Antigravity worker implementando "${manifest.title}" para el proyecto ${projectId}.

**Lee primero, en este orden:**
1. data/projects/${projectId}/antigravity/${moveId}/strategy.md  ← contexto
2. data/projects/${projectId}/antigravity/${moveId}/manifest.json ← qué archivos
3. data/projects/${projectId}/antigravity/${moveId}/acceptance-tests.md ← criterios

**Workflow:**

1. Aplica TODOS los cambios listados en manifest.json:
   - files_to_create: ${manifest.files_to_create.length} archivos
   - files_to_edit: ${manifest.files_to_edit.length} archivos
   - files_to_delete: ${manifest.files_to_delete.length} archivos
   - dependencies_to_add: ${manifest.dependencies_to_add.length} paquetes
   Preserva código no relacionado.

2. Corre todas las verificaciones de acceptance-tests.md hasta que pasen.

3. Si encuentras inconsistencia entre strategy.md y manifest.json: la strategy
   manda. Actualiza el manifest si es necesario antes de aplicar.

4. Commit con mensaje:
   \`feat: ${moveId} — ${manifest.title.slice(0, 60)}\`

5. Actualiza data/projects/${projectId}/state.json:
   - userContext.completedPriorities += ['${moveId}']

6. STOP y reporta:
   - Files changed (count)
   - Tests passing (count / total)
   - Commit SHA
   - Cualquier desviación del manifest con justificación

**Si te bloqueas:**
- NO uses --no-verify, NO skipees tests
- Diagnostica raíz, fíjala, reintenta
- Si sigue bloqueado tras 3 intentos: escribe \`BLOCKED.md\` en la carpeta del move
  con detalle del problema, marca la priority como blocked en state, STOP.
`;
}
