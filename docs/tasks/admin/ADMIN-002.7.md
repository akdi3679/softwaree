# TASK ID: ADMIN-002.7
# TITLE: Add TanStack Query
# STATUS: pending
# DEPENDENCIES: ADMIN-002.6
# ALLOWED FILES: product/apps/admin/src/lib/query-client.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add TanStack Query for reactive data fetching on top of the local SQLite database.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm --filter admin add @tanstack/react-query
```

Create `product/apps/admin/src/lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

/**
 * The TanStack Query client. Configured for local-first data:
 * - staleTime is long (data is local, refresh on sync events)
 * - refetchOnWindowFocus is off (we're a desktop app)
 * - retry is conservative
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 5 * 60_000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});
```

## TESTS

```bash
cd product
test -f apps/admin/src/lib/query-client.ts || { echo "FAIL"; exit 1; }
grep -q "QueryClient" apps/admin/src/lib/query-client.ts || { echo "FAIL"; exit 1; }
node -e "
const p = require('./apps/admin/package.json');
if (!p.dependencies['@tanstack/react-query']) process.exit(1);
"
echo "OK"
```
