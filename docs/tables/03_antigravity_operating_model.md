---
type: documentation
title: Antigravity Operating Model
description: Antigravity Operating Model
timestamp: '2026-06-27T17:40:07Z'
---

# Antigravity Operating Model

## Rol de Antigravity en este proyecto

Antigravity es el implementador principal de la plataforma. Debe trabajar con agent manager, modelos fuertes y ejecucion por sets.

## Regla de trabajo

- Si la tarea es pequena y aislada, ejecutar directo.
- Si la tarea toca arquitectura, varios archivos, nuevos contratos o integracion, primero escribir plan breve y luego ejecutar.
- Nunca invadir el write scope de otro set.

## Stack objetivo

- Monorepo con `pnpm`
- `Vite + React + TypeScript` para la web app
- `Electron` para desktop shell y shortcuts
- `Node + TypeScript` para API local y jobs
- `SQLite` para estado local

## Conocimiento obligatorio

Todos los agentes deben actuar como expertos en:

- Connected Strategy de Wharton
- Competitive advantage
- Business model innovation
- MITx MicroMasters in Data Science
- Mejora de arquitectura de software
- AI frontier aplicada con criterio

## Regla de salida de prompts

Cada mejora importante debe terminar en una de estas dos salidas:

- prompt para `Codex` cuando haga falta plan serio o ayuda de implementacion estructurada
- prompt para `Antigravity` cuando el cambio sea claro y ejecutable

## Regla de tools launcher

La plataforma final debe tener tiles/cards para:

- proyectos locales en `C:\dev`
- `Codex`
- `Antigravity`
- cualquier URL o herramienta externa configurada por el usuario

## Nota sobre taskbar

Windows puede limitar el pinning automatico a taskbar. El objetivo tecnico obligatorio es:

- shortcut de escritorio con icono
- instalacion local limpia
- app pin-ready para taskbar
- si el SO bloquea autopin, dejar experiencia lista para pin manual inmediato
