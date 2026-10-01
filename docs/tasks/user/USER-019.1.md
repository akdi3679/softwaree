# TASK ID: USER-019.1
# TITLE: Add User: per-entity drilldown (read-only detail view)
# STATUS: pending
# DEPENDENCIES: ADMIN-035.2
# ALLOWED FILES: product/apps/user/src/pages/EntityDetail.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Generic read-only detail view: shows all fields from the projection, plus a "history" link.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/EntityDetail.tsx`:

```typescript
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function EntityDetailPage() {
  const { aggregateType, aggregateId } = useParams({ strict: false }) as { aggregateType?: string; aggregateId?: string };
  const { data } = useQuery({
    queryKey: ['entity', aggregateType, aggregateId],
    queryFn: async () => {
      return await invoke<{ data: any; updated_at: string }>('get_projection_entity', {
        table: aggregateType, id: aggregateId,
      });
    },
  });
  if (!data) return <div>Loading…</div>;
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-2 capitalize">{aggregateType}</h2>
      <p className="text-xs text-gray-500 mb-4">ID: {aggregateId} · Updated {new Date(data.updated_at).toLocaleString()}</p>
      <div className="bg-white rounded border p-4">
        <pre className="text-sm overflow-x-auto">{JSON.stringify(data.data, null, 2)}</pre>
      </div>
      <div className="mt-4">
        <Link to="/timeline/$from/$to" params={{ from: '0', to: '999999999' }} className="text-sm text-primary-600">
          View event history →
        </Link>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/EntityDetail.tsx || { echo "FAIL"; exit 1; }
grep -q "EntityDetailPage" apps/user/src/pages/EntityDetail.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
