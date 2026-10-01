# TASK ID: ADMIN-048.1
# TITLE: Add Admin: read-only activity heatmap (per hour/day)
# STATUS: pending
# DEPENDENCIES: CLOUD-021.2
# ALLOWED FILES: product/apps/admin/src/components/ActivityHeatmap.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
GitHub-style heatmap showing when activity happens.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/ActivityHeatmap.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Cell { day: string; hour: number; count: number; }

export function ActivityHeatmap({ projectId }: { projectId: string }) {
  const { data: cells } = useQuery({
    queryKey: ['heatmap', projectId],
    queryFn: async () => {
      return await invoke<Cell[]>('activity_heatmap', { projectId, days: 90 });
    },
  });
  // Group by day
  const days = [...new Set((cells ?? []).map((c) => c.day))].sort();
  const cellMap = new Map((cells ?? []).map((c) => [`${c.day}-${c.hour}`, c.count]));
  const max = Math.max(1, ...(cells ?? []).map((c) => c.count));
  function color(count: number): string {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / max;
    if (intensity < 0.25) return 'bg-green-200';
    if (intensity < 0.5) return 'bg-green-400';
    if (intensity < 0.75) return 'bg-green-600';
    return 'bg-green-800';
  }
  return (
    <div className="bg-white rounded border p-4 overflow-x-auto">
      <h3 className="font-medium mb-3">Activity (last 90 days)</h3>
      <div className="flex gap-px">
        {days.map((d) => (
          <div key={d} className="flex flex-col gap-px">
            {Array.from({ length: 24 }).map((_, h) => {
              const count = cellMap.get(`${d}-${h}`) ?? 0;
              return <div key={h} className={`w-3 h-3 ${color(count)}`} title={`${d} ${h}:00 — ${count}`} />;
            })}
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
test -f apps/admin/src/components/ActivityHeatmap.tsx || { echo "FAIL"; exit 1; }
grep -q "ActivityHeatmap" apps/admin/src/components/ActivityHeatmap.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
