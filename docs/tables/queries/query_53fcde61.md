---
type: reference
title: 'Query: query_53fcde61'
description: Raw SQL query extracted from codebase.
timestamp: '2026-07-02T04:55:17Z'
source_hash: 7b3baf47738b
source_count: 565
---

# SQL Code

```sql
SELECT COUNT(*) as c FROM telemetry_events WHERE created_at >= datetime('now', '-7 days')
```

# Source file
Extracted from [telemetry.js](file:///C:/dev/Connected_Strategy/apps/server/dist/services/telemetry.js)
