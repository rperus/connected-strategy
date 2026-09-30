---
type: reference
title: 'Query: query_02ff572c'
description: Raw SQL query extracted from codebase.
timestamp: '2026-09-30T05:23:08Z'
source_hash: b0cbf406a7da
source_count: 565
---

# SQL Code

```sql
SELECT status, COUNT(*) as cnt FROM analysis_jobs GROUP BY status
```

# Source file
Extracted from [jobs.js](file:///C:/dev/Connected_Strategy/apps/server/dist/db/repositories/jobs.js)
