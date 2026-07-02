---
type: reference
title: 'Query: query_81dd6d76'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-27T17:40:10Z'
---

# SQL Code

```sql
SELECT * FROM analysis_jobs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
```

# Source file
Extracted from [jobs.js](file:///C:/dev/Connected_Strategy/apps/server/dist/db/repositories/jobs.js)
