# TASK ID: ANALYTICS-002.1
# TITLE: Add Admin analytics — Patient KPIs
# STATUS: pending
# DEPENDENCIES: SUPPORT-002.3
# ALLOWED FILES: product/apps/admin/src/pages/AnalyticsMedical.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show: patients this month, visits this month, average wait time, no-show rate.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/AnalyticsMedical.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface MedicalKpis {
  patients_total: number;
  patients_this_month: number;
  visits_total: number;
  visits_this_month: number;
  avg_wait_minutes: number;
  no_show_rate: number;
  active_prescriptions: number;
}

export function AnalyticsMedicalPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: k } = useQuery({
    queryKey: ['medical', 'kpis', projectId],
    queryFn: async () => {
      return await invoke<MedicalKpis>('medical_kpis', { projectId });
    },
    refetchInterval: 60_000,
  });
  if (!k) return <div>Loading…</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Medical KPIs</h2>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Patients (total)" value={k.patients_total} />
        <Kpi label="Patients (this month)" value={k.patients_this_month} />
        <Kpi label="Visits (total)" value={k.visits_total} />
        <Kpi label="Visits (this month)" value={k.visits_this_month} />
        <Kpi label="Avg wait (min)" value={k.avg_wait_minutes.toFixed(1)} />
        <Kpi label="No-show rate" value={`${(k.no_show_rate * 100).toFixed(1)}%`} />
        <Kpi label="Active prescriptions" value={k.active_prescriptions} />
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
test -f apps/admin/src/pages/AnalyticsMedical.tsx || { echo "FAIL"; exit 1; }
grep -q "AnalyticsMedicalPage" apps/admin/src/pages/AnalyticsMedical.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
