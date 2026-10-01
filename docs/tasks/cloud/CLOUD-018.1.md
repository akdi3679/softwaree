# TASK ID: CLOUD-018.1
# TITLE: Add Cloud: full-text search across all customer events
# STATUS: pending
# DEPENDENCIES: USER-019.2
# ALLOWED FILES: platform-cloud/src/search/full_text.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Use Postgres FTS to search across events for support.

## REQUIRED IMPLEMENTATION

Add migration `add_event_search.sql`:
```sql
CREATE INDEX IF NOT EXISTS event_search_idx ON events USING gin(to_tsvector('english', payload::text));
```

Create `platform-cloud/src/search/full_text.ts`:

```typescript
import { db } from '../db';

export async function searchEvents(opts: {
  account_id: string;
  query: string;
  from?: string;
  until?: string;
  limit?: number;
}) {
  const limit = opts.limit ?? 50;
  return await db('events')
    .join('projects', 'projects.id', 'events.project_id')
    .where('projects.account_id', opts.account_id)
    .andWhere(function() {
      this.whereRaw("to_tsvector('english', events.payload::text) @@ plainto_tsquery('english', ?)", [opts.query]);
    })
    .modify((q) => { if (opts.from) q.where('events.occurred_at', '>=', opts.from); })
    .modify((q) => { if (opts.until) q.where('events.occurred_at', '<=', opts.until); })
    .select('events.*', 'projects.name as project_name')
    .orderBy('events.occurred_at', 'desc')
    .limit(limit);
}
```

## TESTS

```bash
cd platform-cloud
test -f src/search/full_text.ts || { echo "FAIL"; exit 1; }
grep -q "searchEvents" src/search/full_text.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
