---
type: reference
title: 'Query: query_ffa1de5c'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-29T12:49:51Z'
---

# SQL Code

```sql
SELECT event, COUNT(*) as count FROM telemetry_events GROUP BY event ORDER BY count DESC
```

# Source file
Extracted from [telemetry.js](file:///C:/dev/Connected_Strategy/apps/server/dist/services/telemetry.js)
