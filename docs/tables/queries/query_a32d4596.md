---
type: reference
title: 'Query: query_a32d4596'
description: Raw SQL query extracted from codebase.
timestamp: '2026-06-29T05:51:56Z'
---

# SQL Code

```sql
SELECT * FROM prompt_packets WHERE proposal_id = ? ORDER BY generated_at DESC LIMIT ? OFFSET ?
```

# Source file
Extracted from [packets.js](file:///C:/dev/Connected_Strategy/apps/server/dist/db/repositories/packets.js)
