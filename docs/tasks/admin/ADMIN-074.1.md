# TASK ID: ADMIN-074.1
# TITLE: Add Admin: cross-project event timeline
# STATUS: pending
# DEPENDENCIES: ADMIN-073.2
# ALLOWED FILES: product/apps/admin/src/pages/CrossProjectTimeline.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
View all events across all projects at once.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/CrossProjectTimeline.tsx`:

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface CrossEvent {
  project_id: string;
  project_name: string;
  sequence: number;
  event_type: string;
  aggregate_id: string;
  occurred_at: string;
  actor_id: string;
}

export function CrossProjectTimelinePage() {
  const [limit, setLimit] = useState(100);
  const { data: events } = useQuery({
    queryKey: ['cross-timeline', limit],
    queryFn: async () => {
      return await invoke<CrossEvent[]>('cross_project_timeline', { limit });
    },
    refetchInterval: 5_000,
  });
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">All projects · live</h2>
        <select value={limit} onChange={(e) => setLimit(+e.target.value)} className="px-2 py-1 border rounded text-sm">
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={500}>Last 500</option>
          <option value={1000}>Last 1000</option>
        </select>
      </div>
      <div className="space-y-1">
        {(events ?? []).map((e, i) => (
          <div key={i} className="bg-white rounded border px-3 py-2 text-sm flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono">#{e.sequence}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{e.project_name}</span>
            <span className="font-medium">{e.event_type}</span>
            <span className="text-xs text-gray-500">{e.aggregate_id}</span>
            <span className="text-xs text-gray-400 ml-auto">{new Date(e.occurred_at).toLocaleTimeString()}</span>
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
test -f apps/admin/src/pages/CrossProjectTimeline.tsx || { echo "FAIL"; exit 1; }
grep -q "CrossProjectTimelinePage" apps/admin/src/pages/CrossProjectTimeline.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
