# TASK ID: FOODLAB-004.2
# TITLE: Add food-lab CoC admin UI
# STATUS: pending
# DEPENDENCIES: FOODLAB-004.1
# ALLOWED FILES: product/apps/admin/src/pages/Custody.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Admin UI to view and add custody transfers for a sample.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Custody.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function CustodyPage() {
  const { projectId, sampleId } = useParams({ strict: false }) as { projectId?: string; sampleId?: string };
  const { data: events } = useQuery({
    queryKey: ['foodlab', 'custody', projectId, sampleId],
    queryFn: async () => {
      return await invoke<any[]>('module_query', {
        projectId, queryType: 'sample.custody', payload: { sample_id: sampleId },
      });
    },
    enabled: !!sampleId,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Chain of custody</h2>
      <div className="bg-white rounded border p-4">
        <div className="font-medium mb-2">Sample: {sampleId}</div>
        <ol className="space-y-2">
          {(events ?? []).map((e, i) => (
            <li key={i} className="flex gap-3">
              <div className="text-gray-400 text-sm w-32">{e.transferred_at}</div>
              <div>
                <div className="font-medium">{e.from_user} → {e.to_user}</div>
                <div className="text-sm text-gray-600">{e.reason} at {e.location}{e.temperature_c ? ` · ${e.temperature_c}°C` : ''}</div>
                {e.notes && <div className="text-sm text-gray-500 italic">{e.notes}</div>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Custody.tsx || { echo "FAIL"; exit 1; }
grep -q "CustodyPage" apps/admin/src/pages/Custody.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
