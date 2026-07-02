---
type: reference
title: 'Query: query_0ace9c7f'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-29T05:51:56Z'
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
}
catch (err) {
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
Extracted from [index.js](file:///C:/dev/Connected_Strategy/apps/server/dist/index.js)
