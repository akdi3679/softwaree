# TASK ID: MEDICAL-004.4
# TITLE: Add medical Admin UI — Waiting list
# STATUS: pending
# DEPENDENCIES: MEDICAL-004.3
# ALLOWED FILES: product/apps/admin/src/pages/WaitingList.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Admin UI to manage the waiting list.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/WaitingList.tsx`:

```typescript
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface WaitingEntry {
  entry_id: string;
  patient_id: string;
  requested_date: string;
  priority: string;
  reason: string;
  status: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

export function WaitingListPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const qc = useQueryClient();
  const { data: entries } = useQuery({
    queryKey: ['medical', 'waiting', projectId],
    queryFn: async () => {
      return await invoke<WaitingEntry[]>('module_query', {
        projectId, queryType: 'waiting_list.list', payload: {},
      });
    },
    refetchInterval: 5_000,
  });
  const remove = useMutation({
    mutationFn: async (entryId: string) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'waiting_list.remove',
        payload: { entry_id: entryId, reason: 'manual' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'waiting'] }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Waiting list</h2>
      <div className="space-y-2">
        {(entries ?? []).sort((a, b) => {
          const order = { urgent: 0, high: 1, normal: 2, low: 3 };
          return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
        }).map((e) => (
          <div key={e.entry_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{e.patient_id}</div>
              <div className="text-sm text-gray-500">{e.reason} · requested {e.requested_date} · {e.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${PRIORITY_COLORS[e.priority]}`}>
                {e.priority}
              </span>
              {e.status === 'waiting' && (
                <button onClick={() => remove.mutate(e.entry_id)} className="px-2 py-1 text-sm border rounded">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        {entries?.length === 0 && <div className="bg-white rounded border p-6 text-center text-gray-500">Waiting list is empty</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/WaitingList.tsx || { echo "FAIL"; exit 1; }
grep -q "WaitingListPage" apps/admin/src/pages/WaitingList.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
