---
type: reference
title: 'Query: query_e3b9f6c7'
description: Raw SQL query extracted from codebase.
timestamp: '2026-07-02T04:55:17Z'
source_hash: 7b3baf47738b
source_count: 565
---

# SQL Code

```sql
SELECT status, COUNT(*) as cnt FROM analysis_jobs GROUP BY status
```

# Source file
Extracted from [jobs.js](file:///C:/dev/Connected_Strategy/apps/server/dist/db/repositories/jobs.js)
