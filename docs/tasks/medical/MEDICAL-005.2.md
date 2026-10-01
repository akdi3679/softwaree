# TASK ID: MEDICAL-005.2
# TITLE: Add medical Admin UI — Referrals
# STATUS: pending
# DEPENDENCIES: MEDICAL-005.1
# ALLOWED FILES: product/apps/admin/src/pages/Referrals.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
List of referrals, mark complete.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Referrals.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Referral {
  referral_id: string;
  patient_id: string;
  specialist: string;
  urgency: string;
  reason: string;
  status: string;
  created_at: string;
}

const URGENCY_COLORS: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-800',
  routine: 'bg-blue-100 text-blue-800',
};

export function ReferralsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const qc = useQueryClient();
  const { data: refs } = useQuery({
    queryKey: ['medical', 'referrals', projectId],
    queryFn: async () => {
      return await invoke<Referral[]>('module_query', {
        projectId, queryType: 'referral.list', payload: {},
      });
    },
    refetchInterval: 5_000,
  });
  const complete = useMutation({
    mutationFn: async (referralId: string) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'referral.complete',
        payload: { referral_id: referralId },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'referrals'] }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Referrals</h2>
      <div className="space-y-2">
        {(refs ?? []).map((r) => (
          <div key={r.referral_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.patient_id} → {r.specialist}</div>
              <div className="text-sm text-gray-500">{r.reason} · {r.created_at} · {r.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${URGENCY_COLORS[r.urgency]}`}>{r.urgency}</span>
              {r.status === 'pending' && (
                <button onClick={() => complete.mutate(r.referral_id)} className="px-2 py-1 text-sm border rounded">Mark complete</button>
              )}
            </div>
          </div>
        ))}
        {refs?.length === 0 && <div className="bg-white rounded border p-6 text-center text-gray-500">No referrals</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Referrals.tsx || { echo "FAIL"; exit 1; }
grep -q "ReferralsPage" apps/admin/src/pages/Referrals.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
