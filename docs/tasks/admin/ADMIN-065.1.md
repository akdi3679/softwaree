# TASK ID: ADMIN-065.1
# TITLE: Add Admin: read-only event count badge
# STATUS: pending
# DEPENDENCIES: USER-025.2
# ALLOWED FILES: product/apps/admin/src/components/EventCount.tsx
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show a small badge: "12,345 events" on the audit page.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/EventCount.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function EventCount({ projectId }: { projectId: string }) {
  const { data } = useQuery({
    queryKey: ['event-count', projectId],
    queryFn: async () => {
      return await invoke<{ count: number; last_at: string | null }>('event_count', { projectId });
    },
    refetchInterval: 30_000,
  });
  if (!data) return null;
  return (
    <span className="text-xs text-gray-500">
      {data.count.toLocaleString()} events{data.last_at && ` · last ${new Date(data.last_at).toLocaleDateString()}`}
    </span>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/EventCount.tsx || { echo "FAIL"; exit 1; }
grep -q "EventCount" apps/admin/src/components/EventCount.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
