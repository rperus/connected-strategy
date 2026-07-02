---
type: reference
title: 'Query: query_c09a15cf'
description: Raw SQL query extracted from codebase.
timestamp: '2026-07-02T04:55:17Z'
source_hash: 7b3baf47738b
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
