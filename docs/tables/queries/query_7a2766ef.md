---
type: reference
title: 'Query: query_7a2766ef'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-27T17:40:10Z'
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
