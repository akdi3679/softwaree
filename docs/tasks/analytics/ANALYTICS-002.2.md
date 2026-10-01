# TASK ID: ANALYTICS-002.2
# TITLE: Add Admin analytics — Food-lab KPIs
# STATUS: pending
# DEPENDENCIES: ANALYTICS-002.1
# ALLOWED FILES: product/apps/admin/src/pages/AnalyticsFoodLab.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show: samples this month, average turnaround, pending, rejected rate.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/AnalyticsFoodLab.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface FoodLabKpis {
  samples_total: number;
  samples_this_month: number;
  samples_in_progress: number;
  samples_rejected: number;
  avg_turnaround_hours: number;
  reports_issued: number;
  rejection_rate: number;
}

export function AnalyticsFoodLabPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: k } = useQuery({
    queryKey: ['foodlab', 'kpis', projectId],
    queryFn: async () => {
      return await invoke<FoodLabKpis>('foodlab_kpis', { projectId });
    },
    refetchInterval: 60_000,
  });
  if (!k) return <div>Loading…</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Food Lab KPIs</h2>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Samples (total)" value={k.samples_total} />
        <Kpi label="Samples (this month)" value={k.samples_this_month} />
        <Kpi label="In progress" value={k.samples_in_progress} />
        <Kpi label="Rejected" value={k.samples_rejected} />
        <Kpi label="Avg turnaround (hrs)" value={k.avg_turnaround_hours.toFixed(1)} />
        <Kpi label="Reports issued" value={k.reports_issued} />
        <Kpi label="Rejection rate" value={`${(k.rejection_rate * 100).toFixed(1)}%`} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/AnalyticsFoodLab.tsx || { echo "FAIL"; exit 1; }
grep -q "AnalyticsFoodLabPage" apps/admin/src/pages/AnalyticsFoodLab.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
