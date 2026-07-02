---
type: reference
title: 'Query: query_ef8b6378'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-29T05:51:56Z'
---

# SQL Code

```sql
SELECT status, COUNT(*) as cnt FROM analysis_jobs GROUP BY status
```

# Source file
Extracted from [jobs.js](file:///C:/dev/Connected_Strategy/apps/server/dist/db/repositories/jobs.js)
