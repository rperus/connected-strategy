# V3 Revenue Model Architect Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the currently orphaned `runRevenueModelArchitect` agent into the V3 orchestration pipeline so that its precision pricing insights are persisted and passed to the synthesis engine.

**Architecture:** We will first update the `ProjectStateV3.wharton` type definition in `state-types.ts` to include a `revenueModel` property. Then we will modify the `pipeline-orchestrator.ts` Phase B execution block to call the agent sequentially after the `ConnectedExperienceMatrix` (which produces the required WS07 and WS08 inputs) and assign the output to the state.

**Tech Stack:** TypeScript, Node.js

---

### Task 1: Update ProjectStateV3 Schema

**Files:**
- Modify: `packages/agents/src/v3/state-types.ts:50-60`

- [ ] **Step 1: Write the failing type test (Mental check)**
The state currently does not accept `revenueModel` in the `wharton` object. We must import the output type and declare it.

- [ ] **Step 2: Write minimal implementation**
In `packages/agents/src/v3/state-types.ts`, import `RevenueModelArchitectOutput` and add it to `ProjectStateV3.wharton`:

```typescript
import type { RevenueModelArchitectOutput } from './agents/revenue-model-architect.js';
```

And in the `ProjectStateV3` interface, inside `wharton`:

```typescript
  wharton?: {
    ws01?: WS01_JourneyMap;
    ws02?: never;                  // merged into ws01
    ws03?: WS03_InfoFlow;
    ws04?: WS04_WhyHowLadder;
    ws05?: WS05_ResponseMatrix;
    ws06?: WS06_RepeatLearning;
    ws07?: WS07_ExistingMatrix;
    ws08?: WS08_NewIdeasMatrix;
    ws09?: WS09_SubfunctionGrid;
    ws10?: WS10_TechSolutions;
    ws11?: WS11_EmergingTech;
    revenueModel?: RevenueModelArchitectOutput;
  };
```

- [ ] **Step 3: Run typescript compiler to verify type validity**
Run: `pnpm tsc -b`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add packages/agents/src/v3/state-types.ts
git commit -m "feat(v3): add revenueModel to ProjectStateV3 wharton object"
```

---

### Task 2: Orchestrate Revenue Model Architect in Phase B

**Files:**
- Modify: `packages/agents/src/v3/pipeline-orchestrator.ts:100-125`

- [ ] **Step 1: Write minimal implementation**
In `packages/agents/src/v3/pipeline-orchestrator.ts`, locate the `skip.has('B')` block. Add the call to `runRevenueModelArchitect` and save it to the state.

```typescript
      const ws09ws10ws11 = await runTechStackMapper({ packageJson: {}, fileDiscovery: { byCategory: {} } }, ctx);
      
      const revenue = await runRevenueModelArchitect({
        ws07Output: ws05ws07ws08.data!.ws07,
        ws08Output: ws05ws07ws08.data!.ws08,
        competitorPricing: competitors
      }, ctx);

      state.wharton = {
        ws01: ws01.data?.ws01,
        ws03: ws03.data?.ws03,
        ws04: ws04ws06.data?.ws04,
        ws05: ws05ws07ws08.data?.ws05,
        ws06: ws04ws06.data?.ws06,
        ws07: ws05ws07ws08.data?.ws07,
        ws08: ws05ws07ws08.data?.ws08,
        ws09: ws09ws10ws11.data?.ws09,
        ws10: ws09ws10ws11.data?.ws10,
        ws11: ws09ws10ws11.data?.ws11,
        revenueModel: revenue.data,
      };
```

- [ ] **Step 2: Run tests to verify the pipeline doesn't break**
Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add packages/agents/src/v3/pipeline-orchestrator.ts
git commit -m "feat(v3): orchestrate RevenueModelArchitect in Wharton Phase"
```
