# Definition Of Done

Un set solo esta terminado cuando cumple todo esto:

1. Cumple el objetivo del prompt del set.
2. No invade write scopes ajenos.
3. Deja archivos consistentes y ejecutables.
4. Corre verificaciones locales razonables para su scope.
5. Actualiza estado y checkpoint.
6. Entrega resumen corto con:
   - que hizo
   - archivos tocados
   - comandos corridos
   - riesgos pendientes

## Extra para este proyecto

- Si el set toca launcher, debe considerar colisiones.
- Si el set toca reportes, debe considerar impresion.
- Si el set toca prompts, debe considerar salida para Codex y Antigravity.
- Si el set toca worksheets, debe dejar recalculo o contratos para recalculo.
- Si el set toca packaging, debe dejar icono y shortcut en el plan de salida.
