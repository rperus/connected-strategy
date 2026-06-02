# Graph Report - .  (2026-05-31)

## Corpus Check
- 324 files · ~273,331 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1528 nodes · 2666 edges · 97 communities (92 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Chief Strategist V3|Chief Strategist V3]]
- [[_COMMUNITY_Runtime Config & Ports|Runtime Config & Ports]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Server Infrastructure & DB|Server Infrastructure & DB]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Briefing & Pipeline UI|Briefing & Pipeline UI]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Strategy Copilot & Context|Strategy Copilot & Context]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Domain Type System|Domain Type System]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]

## God Nodes (most connected - your core abstractions)
1. `callLLMValidated()` - 38 edges
2. `AgentV3Context` - 30 edges
3. `runV3Pipeline()` - 28 edges
4. `ProjectStateStore` - 23 edges
5. `ProjectBanner()` - 21 edges
6. `ProjectStateV3` - 20 edges
7. `AgentV3Result` - 20 edges
8. `useProject()` - 17 edges
9. `DiscoveredFile` - 17 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `runProjectAutonomously()` --calls--> `runV3Pipeline()`  [INFERRED]
  apps/server/src/scheduler.ts → packages/agents/src/v3/pipeline-orchestrator.ts
- `getDb()` --calls--> `getProjectRoot()`  [INFERRED]
  apps/server/src/db/index.ts → packages/runtime/src/port-config.ts
- `telemetryForwarder()` --calls--> `broadcastEvent()`  [EXTRACTED]
  apps/server/src/scheduler.ts → apps/server/src/services/telemetry.ts
- `runProjectAutonomously()` --calls--> `broadcastEvent()`  [EXTRACTED]
  apps/server/src/scheduler.ts → apps/server/src/services/telemetry.ts
- `ApiStatusIndicator()` --calls--> `usePolling()`  [EXTRACTED]
  apps/web/src/components/ApiStatus.tsx → apps/web/src/hooks/usePolling.ts

## Import Cycles
- None detected.

## Communities (97 total, 5 thin omitted)

### Community 0 - "Chief Strategist V3"
Cohesion: 0.05
Nodes (78): ActivitySystemMapperInput, computeImitability(), runActivitySystemMapper(), runChiefStrategist(), CodeCartographerInput, CodeCartographerOutput, runCodeCartographer(), CompetitorIntelligenceInput (+70 more)

### Community 1 - "Runtime Config & Ports"
Cohesion: 0.05
Nodes (75): getDb(), closeDb(), migrate(), LaunchProfile, collisionLog, findFreePort(), getCollisionLog(), isPortFree() (+67 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (67): LaunchProfile, ActivitySystemNode, AnswerConfidence, BusinessModelProfile, ChangeType, CompetitiveLandscape, Competitor, ConnectedExperience (+59 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (48): runBatchReporter(), runMarketIntelAgent(), ConsultantAnswer, parseAndIndexDocument(), parseAndIndexSource(), parseAndIndexText(), ParseResult, getIngestionStatus() (+40 more)

### Community 4 - "Server Infrastructure & DB"
Cohesion: 0.07
Nodes (31): getHistoricalRuns(), saveHistoricalRun(), buildAcceptanceTests(), generateIndex(), runHandoffPhase(), buildManifest(), MoveManifest, buildAntigravityPrompt() (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (45): maturity, path, stack, maturity, path, stack, active_port, health_url (+37 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (38): sunkingActivitySystem, sunkingCompetitor, sunkingDriverScore, sunkingFiveForces, sunkingFrontier, sunkingScenarios, sunkingThreeFits, sunkingWS01 (+30 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (33): AnyReport, escapeHtml(), exportToHtml(), exportToMarkdown(), formatDate(), formatKey(), renderSectionContentHtml(), renderSectionHtml() (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (33): ActivityMapPage, AgentOrchestratorPage, AIFrontierPage, ArchitecturePage, BriefingPage, BusinessModelPage, CausalDagPage, CompetitivePage (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (34): dependencies, better-sqlite3, @clerk/clerk-sdk-node, compression, cors, @cs/agents, @cs/domain, @cs/prompt-packets (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (24): CoachInsight, CoachPanel(), CoachPanelProps, generateInsights(), TYPE_STYLES, EmptyState(), EmptyStateAction, EmptyStateProps (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (20): MATURITY_COLOR, MATURITY_LABEL, ProjectBanner(), Props, ActivityEdge, ActivityNode, CATEGORY_COLORS, CATEGORY_LABELS (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (20): FindingsPanel(), Props, Finding, useFindings(), AGENT_IDS, AIFrontierPage(), CLR, MATRIX (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (28): description, devDependencies, expect, png-to-ico, sharp, vite-tsconfig-paths, vitest, engines (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (28): activitySystemMapSchema, competitorProfileSchema, connectedModeEnum, connectionArchitectureEnum, driverScoreSchema, fiveForcesSchema, forceAnalysisSchema, frontierAnalysisSchema (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (25): dependencies, better-sqlite3, @cs/domain, @cs/knowledge, @google/generative-ai, lru-cache, ts-morph, zod (+17 more)

### Community 16 - "Briefing & Pipeline UI"
Cohesion: 0.10
Nodes (10): CATEGORY_COLORS, ProjectStatus, PipelinePrompt, MetricsMap, LiveFinding, LivePrompt, PipelineHistory, STATIC (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (25): dependencies, @clerk/clerk-react, @cs/domain, echarts, echarts-for-react, react, react-dom, react-router-dom (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (11): CLASS, LoopPhasePill(), Phase, StatusBadge(), StrategicFlags(), ApiListResponse, ApiWorksheetAnswer, completionPct() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (15): cleanDuplicateProjects(), cleanOldTelemetryEvents(), cleanOrphanWorksheetAnswers(), router, requireAuth(), router, router, router (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (20): description, devDependencies, electron, electron-builder, nodemon, rimraf, main, name (+12 more)

### Community 21 - "Strategy Copilot & Context"
Cohesion: 0.16
Nodes (13): Message, StrategyCopilot(), DataSource, ProjectContext, ProjectContextValue, ProjectProvider(), useProject(), AgentOrchestratorPage() (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, rimraf, @types/node, typescript, main, name (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (18): dependencies, @cs/domain, devDependencies, rimraf, @types/node, typescript, main, name (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (18): dependencies, @cs/domain, devDependencies, rimraf, @types/node, typescript, main, name (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (13): AppError, errorHandler(), ContextSchema, pipelineEvents, ProposalStatusSchema, router, RunFullSchema, store (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (18): compilerOptions, composite, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (17): AgentEvaluation, BenchmarkFile, BenchmarkResult, buildComparison(), checkKeyFields(), ComparisonTable, computeQualityScore(), CostEstimate (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (17): dependencies, @cs/domain, devDependencies, rimraf, typescript, main, name, private (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (17): dependencies, @cs/domain, devDependencies, rimraf, typescript, main, name, private (+9 more)

### Community 30 - "Community 30"
Cohesion: 0.17
Nodes (11): ProjectHealth, router, router, AnswerRow, deleteAnswer(), getAnswer(), listAllAnswers(), listAnswers() (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (11): ALL_KNOWLEDGE_SOURCES, getSourceById(), getSourcesByWorksheet(), LOCAL_SOURCES, WHARTON_SOURCES, BusinessPlanSource, IngestionResult, KnowledgeChunk (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (15): AGENT_DEFS, AgentDef, AGENTS_DIR, BenchmarkPromptSet, ExtractedPrompt, extractFromFile(), extractLLMConfig(), extractPlaceholders() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (13): ACTIVE_PORTS, { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog, ipcMain }, createTray(), createWindow(), fallbackTrayPng(), fs, getAppIcon(), getWebAppUrl() (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.26
Nodes (10): computeMoveImitability(), evaluateMove(), MoveCandidate, sumDeltas(), discoverMoves(), estimateCostDeltas(), estimateWtpDeltas(), computeFrontier() (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (12): MATURITY_CLR, MATURITY_PCT, ProjectCard(), Props, PollStatus, usePolling(), UsePollResult, HomePage() (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.52
Nodes (13): clamp(), computeStrategicMetrics(), scoreArchitectureResilience(), scoreBusinessModelStrength(), scoreClosedLoopMaturity(), scoreCompetitivePositioningIndex(), scoreConnectedExperience(), scoreCostReductionPotential() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (13): AlpacaFormat, args, deduplicate(), __dirname, format, formatIdx, inputIdx, main() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (14): buildGenerationPrompt(), BUSINESS_MODELS, callGemini(), COMPANY_SIZES, generateId(), GenerationConfig, INDUSTRIES, main() (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (10): router, store, router, countProjects(), deleteProject(), getProject(), listProjects(), ProjectRow (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (8): buildAntigravityPrompt(), buildCodexPlanPrompt(), buildExpectedTests(), buildStrategicConstraints(), buildStrategicFlagsMd(), generatePacketFromProposal(), packetStore, PromptPacket

### Community 41 - "Community 41"
Cohesion: 0.35
Nodes (9): AgentNode, AGENTS, Crew, CREW_COLORS, Phase, Tier, TIER_COLORS, TIER_LABELS (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (10): lastRunAt, lastRunId, projectId, projectName, projectPath, schemaVersion, userContext, completedPriorities (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (10): lastRunAt, lastRunId, projectId, projectName, projectPath, schemaVersion, userContext, completedPriorities (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (7): BriefingPage(), scoreColor(), CATEGORY_COLORS, CATEGORY_ICONS, PLATFORM_COLORS, STATUS_COLORS, MOCK_PROJECTS

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (10): lastRunAt, lastRunId, projectId, projectName, projectPath, schemaVersion, userContext, completedPriorities (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (10): lastRunAt, lastRunId, projectId, projectName, projectPath, schemaVersion, userContext, completedPriorities (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (9): compilerOptions, lib, module, moduleResolution, outDir, rootDir, types, extends (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (9): blast_radius_1_hop, blast_radius_2_hop, connected_components_split, highest_node, betweenness, id, label, source_file (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (5): GRADE_BG, GRADE_COLORS, HealthData, PortfolioSummary, ProjectHealth

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (8): fs, generateIcoFallback(), ICONS_DIR, main(), path, ROOT, SIZES, SRC_PNG

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (8): compilerOptions, lib, module, moduleResolution, outDir, rootDir, extends, include

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (7): checkChurnRisks(), broadcastEvent(), pipelineEvents, startScheduler(), stopScheduler(), store, telemetryForwarder()

### Community 53 - "Domain Type System"
Cohesion: 0.22
Nodes (8): ActivitySystemMap, CompetitorProfile, DriverScore, FiveForcesAnalysis, ForceAnalysis, FrontierAnalysis, ScenarioAnalysis, ThreeFitsAssessment

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): compilerOptions, jsx, lib, noEmit, outDir, rootDir, extends, include

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (5): getJobDb(), insertJob(), JobRow, rowToJob(), updateJob()

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): ApiStatusIndicator(), HealthResponse, MATURITY_COLOR, NAV, Sidebar()

### Community 58 - "Community 58"
Cohesion: 0.48
Nodes (5): run-benchmark.sh script, install_deps(), main(), run_benchmark(), start_vllm()

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (4): DEFAULT_ENTITIES, EfficiencyFrontierPage(), Entity, scaleX()

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (5): EXPERIENCE_TYPES, INITIAL_STEPS, JourneyStep, OWNER_STYLE, PHASE_CONFIG

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (3): Force, INITIAL_FORCES, RINGS

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (4): CellData, JOURNEY_PHASES, MatrixState, STAR_PHASES

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (4): ARCHITECTURES, CellData, EXPERIENCES, MatrixState

### Community 64 - "Community 64"
Cohesion: 0.38
Nodes (5): getTelemetryStats(), initTelemetryDb(), telemetryBus, TelemetryEventName, router

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (3): getPacketDb(), PacketRow, rowToPacket()

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (3): db, dbPath, tables

### Community 73 - "Community 73"
Cohesion: 0.50
Nodes (3): duplicates, orphan_files, orphan_nodes

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (3): files, fs, path

## Knowledge Gaps
- **619 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+614 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `runV3Pipeline()` connect `Chief Strategist V3` to `Community 25`, `Community 34`, `Community 3`, `Server Infrastructure & DB`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `runProjectAutonomously()` connect `Community 25` to `Chief Strategist V3`, `Community 52`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `closeDb()` connect `Runtime Config & Ports` to `Community 19`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _619 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Chief Strategist V3` be split into smaller, more focused modules?**
  _Cohesion score 0.051274747187010396 - nodes in this community are weakly interconnected._
- **Should `Runtime Config & Ports` be split into smaller, more focused modules?**
  _Cohesion score 0.05471956224350205 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.055900621118012424 - nodes in this community are weakly interconnected._