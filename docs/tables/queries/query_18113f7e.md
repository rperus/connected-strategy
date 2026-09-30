---
type: reference
title: 'Query: query_18113f7e'
description: Raw SQL query extracted from codebase.
timestamp: '2026-09-30T05:23:08Z'
source_hash: b0cbf406a7da
source_count: 565
---

# SQL Code

```sql
SELECT 1').get(); // lightweight DB ping
res.json({
ok: true,
status: 'ok',
service: 'connected_strategy_api',
persistence: 'sqlite',
uptimeSeconds: Math.floor((Date.now() - serverStartedAt) / 1000),
timestamp: new Date().toISOString(),
});
} catch (err) {
res.status(503).json({
ok: false,
status: 'degraded',
service: 'connected_strategy_api',
error: 'Database unavailable',
timestamp: new Date().toISOString(),
});
}
});

// ─── Module route mounts ────────────────────────────────────────
import { requireAuth } from
```

# Source file
Extracted from [index.ts](file:///C:/dev/Connected_Strategy/apps/server/src/index.ts)
