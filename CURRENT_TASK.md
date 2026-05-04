# Current Task

**Date:** 2026-04-27
**Status:** done
**Version:** 2.2.0

## Completado Esta Sesión

### v2.2.0 — Hierarchical Agent Swarm
- [x] Extender types.ts: AgentTier, CrewId, canDelegate, runsAutonomously
- [x] Crear strategist-supervisor.ts (Level 0: HTN planning)
- [x] Crear recon-lead.ts (Level 1: cache invalidation, data quality gate)
- [x] Crear analysis-lead.ts (Level 1: dependency scheduling, early stopping)
- [x] Crear action-lead.ts (Level 1: publication gate, cost budget)
- [x] Crear temporal-analyst.ts (Level 2: Z-score trend detection)
- [x] Crear validation-agent.ts (Level 2: Jaccard + constraint satisfaction)
- [x] Crear anomaly-detector.ts (Level 2: statistical outlier detection)
- [x] Crear causal-mapper.ts (Level 2: Pearl 2000 DAG, causal SAC)
- [x] Reescribir registry.ts: 20 agentes, 3 tiers, 4 crews
- [x] Reescribir AgentOrchestratorPage: jerarquía visual 3 niveles
- [x] Typecheck ✅ 0 errores (web + agents)
- [x] Browser verification ✅

### v2.1.0 — Platform Elevation
- [x] CoachPanel.tsx: 18 alertas proactivas Wharton en HomePage
- [x] PortfolioMatrixPage.tsx: gráfico 2×2 WTP×SCI con cuadrantes
- [x] BriefingPage.tsx: ranking + export clipboard Antigravity
- [x] mockData.ts: recalibración evidence-based (BALAM SAC 66→76)
- [x] Sidebar: nueva sección "Inteligencia"
- [x] Fix: eliminar duplicate 'connected-strategy' key en mockData
- [x] Typecheck ✅ 0 errores
- [x] Browser verification ✅

## Arrancar

```bat
scripts\start.bat
```

## Próximo Wave Sugerido (Wave 7 — Phase 2)

1. **Telemetría en tiempo real**: conectar eventos del backend (`POST /api/pipeline/run-full`) a los nodos de agentes para visualización live
2. **Memoria temporal**: persistir historical runs en SQLite para que temporal-analyst tenga datos reales
3. **Strategist auto-mode**: permitir que el Strategist se auto-ejecute cada N horas (runsAutonomously=true)
4. **Causal DAG UI**: nueva página `/causal` para visualizar el DAG de Pearl con scores ajustados
5. **Cross-agent message bus**: implementar SharedFindingsStore para que Analysis Lead propague hallazgos mid-run
