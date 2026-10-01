# TASK ID: MEDICAL-002.6
# TITLE: Add medical Admin UI — Today's appointments + check-in
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.5
# ALLOWED FILES: product/apps/admin/src/pages/Today.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Today's appointments dashboard — list with check-in button.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Today.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function TodayPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();
  const { data: appts } = useQuery({
    queryKey: ['medical', 'today', projectId, today],
    queryFn: () => invoke<any[]>('module_query', {
      projectId, queryType: 'appointment.list_for_day', payload: { date: today },
    }),
    refetchInterval: 5_000,
  });
  const checkIn = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'appointment.check_in',
        payload: { appointment_id: appointmentId },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'today'] }),
  });

  const sorted = (appts ?? []).slice().sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Today · {today}</h2>
      <div className="space-y-2">
        {sorted.map((a) => (
          <div key={a.appointment_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.scheduled_for.slice(11, 16)} · {a.patient_id}</div>
              <div className="text-sm text-gray-500">{a.reason} · {a.duration_minutes}min · {a.status}</div>
            </div>
            {a.status === 'scheduled' && (
              <button
                onClick={() => checkIn.mutate(a.appointment_id)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm"
              >
                Check in
              </button>
            )}
            {a.status === 'checked_in' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Waiting</span>
            )}
            {a.status === 'in_visit' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">In visit</span>
            )}
            {a.status === 'completed' && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Done</span>
            )}
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="bg-white rounded border p-6 text-center text-gray-500">
            No appointments today
          </div>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Today.tsx || { echo "FAIL"; exit 1; }
grep -q "TodayPage" apps/admin/src/router.tsx || { echo "FAIL: not wired"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
