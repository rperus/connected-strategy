---
type: reference
title: 'Query: query_fe67bf64'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-29T05:51:56Z'
---

# SQL Code

```sql
SELECT COUNT(*) as c FROM telemetry_events WHERE created_at >= datetime('now', '-7 days')
```

# Source file
Extracted from [telemetry.js](file:///C:/dev/Connected_Strategy/apps/server/dist/services/telemetry.js)
