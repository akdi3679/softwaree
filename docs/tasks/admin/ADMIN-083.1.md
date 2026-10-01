# TASK ID: ADMIN-083.1
# TITLE: Add Admin: top 10 list of all patients by event count
# STATUS: pending
# DEPENDENCIES: ADMIN-082.2
# ALLOWED FILES: product/apps/admin/src/pages/TopPatients.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
See who's most active.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/TopPatients.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Row { aggregate_id: string; event_count: number; }

export function TopPatientsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: rows } = useQuery({
    queryKey: ['top-patients', projectId],
    queryFn: async () => {
      return await invoke<Row[]>('top_aggregates', { projectId, aggregateType: 'patient', limit: 10 });
    },
  });
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Top 10 patients by activity</h2>
      <div className="bg-white rounded border">
        {(rows ?? []).map((r, i) => (
          <div key={r.aggregate_id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <span className="font-mono text-sm text-gray-500 mr-2">#{i + 1}</span>
              <span className="font-medium">{r.aggregate_id}</span>
            </div>
            <div className="text-sm text-gray-500">{r.event_count.toLocaleString()} events</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/TopPatients.tsx || { echo "FAIL"; exit 1; }
grep -q "TopPatientsPage" apps/admin/src/pages/TopPatients.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
