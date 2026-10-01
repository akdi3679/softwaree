# TASK ID: USER-026.1
# TITLE: Add User: read-only KPI bar
# STATUS: pending
# DEPENDENCIES: ADMIN-083.2
# ALLOWED FILES: product/apps/user/src/components/KpiBar.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Persistent top bar with key numbers.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/KpiBar.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Kpis { patients: number; appointments_today: number; events_today: number; sync_status: string; }

export function KpiBar() {
  const { data: k } = useQuery({
    queryKey: ['kpis-bar'],
    queryFn: async () => await invoke<Kpis>('get_kpis_bar'),
    refetchInterval: 10_000,
  });
  if (!k) return null;
  return (
    <div className="bg-white border-b px-4 py-1 text-xs flex gap-4">
      <span>👥 {k.patients.toLocaleString()}</span>
      <span>📅 {k.appointments_today} today</span>
      <span>📊 {k.events_today} events today</span>
      <span className={`ml-auto ${
        k.sync_status === 'connected' ? 'text-green-600' :
        k.sync_status === 'lagging' ? 'text-yellow-600' : 'text-red-600'
      }`}>● {k.sync_status}</span>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/components/KpiBar.tsx || { echo "FAIL"; exit 1; }
grep -q "KpiBar" apps/user/src/components/KpiBar.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
