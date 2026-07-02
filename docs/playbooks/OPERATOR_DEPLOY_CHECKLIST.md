---
type: runbook
title: OPERATOR_DEPLOY_CHECKLIST
description: OPERATOR_DEPLOY_CHECKLIST
timestamp: '2026-06-27T17:40:07Z'
---

# OPERATOR_DEPLOY_CHECKLIST

This repo is currently in pre-implementation state. Use this checklist once the product starts existing.

## Before local release

- confirm root state pack is current
- confirm `config/port_registry.yaml` matches intended fixed ports
- confirm `ops/runtime/active_ports.json` reflects current runtime reality or is reset safely
- confirm launcher and portal cards read live ports first
- confirm Electron shell, web shell, and API shell all start
- confirm report printing and PDF export work
- confirm prompt packet generation works

## Before packaging

- confirm icon assets exist
- confirm desktop shortcut works
- confirm taskbar pin-ready packaging works on Windows
- record any manual taskbar step if the OS blocks autopin

## After validation

- update `CURRENT_STATE.md`
- update `CURRENT_TASK.md`
- append `CHANGELOG_PROJECT.md`
- add run evidence under `ops/run_logs/`
