# TASK ID: USER-007.3
# TITLE: Add User session management UI
# STATUS: pending
# DEPENDENCIES: USER-007.2
# ALLOWED FILES: product/apps/user/src/pages/Sessions.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
List active sessions, allow User to revoke them.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/Sessions.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Session {
  id: string;
  device_id: string;
  device_name: string;
  ip: string;
  last_seen: string;
  created_at: string;
}

export function SessionsPage() {
  const qc = useQueryClient();
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => await invoke<Session[]>('list_sessions'),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => await invoke('revoke_session', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Active sessions</h2>
      <div className="bg-white rounded border">
        {(sessions ?? []).map((s) => (
          <div key={s.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.device_name}</div>
              <div className="text-sm text-gray-500">{s.ip} · last seen {s.last_seen}</div>
            </div>
            <button onClick={() => revoke.mutate(s.id)} className="px-3 py-1 text-sm border rounded text-red-600 hover:bg-red-50">
              Revoke
            </button>
          </div>
        ))}
        {sessions?.length === 0 && <div className="p-6 text-center text-gray-500">No active sessions</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/Sessions.tsx || { echo "FAIL"; exit 1; }
grep -q "useMutation" apps/user/src/pages/Sessions.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
