---
type: reference
title: 'Query: query_c26740f8'
description: Raw SQL query extracted from codebase.
timestamp: '2026-07-02T04:55:17Z'
source_hash: 7b3baf47738b
source_count: 565
---

# SQL Code

```sql
SELECT event, COUNT(*) as count FROM telemetry_events GROUP BY event ORDER BY count DESC
```

# Source file
Extracted from [telemetry.js](file:///C:/dev/Connected_Strategy/apps/server/dist/services/telemetry.js)
