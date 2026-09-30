---
type: reference
title: 'Query: query_3bab9e20'
description: Raw SQL query extracted from codebase.
timestamp: '2026-09-30T05:23:08Z'
source_hash: b0cbf406a7da
source_count: 565
---

# SQL Code

```sql
SELECT COUNT(*) as c FROM telemetry_events WHERE created_at >= datetime('now', '-7 days')
```

# Source file
Extracted from [telemetry.js](file:///C:/dev/Connected_Strategy/apps/server/dist/services/telemetry.js)
