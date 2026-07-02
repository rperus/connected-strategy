---
type: reference
title: 'Query: query_29ad1cfb'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-29T05:51:56Z'
---

# SQL Code

```sql
SELECT * FROM analysis_jobs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
```

# Source file
Extracted from [jobs.js](file:///C:/dev/Connected_Strategy/apps/server/dist/db/repositories/jobs.js)
