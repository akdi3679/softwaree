# TASK ID: PORTAL-003.1
# TITLE: Add portal — Devices page
# STATUS: pending
# DEPENDENCIES: COMPL-003.3
# ALLOWED FILES: platform-cloud/portal/src/pages/Devices.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Manage which devices are authorized to access the customer's account.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/portal/src/pages/Devices.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Device {
  id: string;
  user_email: string;
  device_type: string;   // "laptop" | "phone" | "tablet"
  display_name: string;
  state: string;         // "active" | "revoked" | "pending_replacement"
  last_seen: string | null;
  created_at: string;
}

export function DevicesPage() {
  const qc = useQueryClient();
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const r = await invoke<{ devices: Device[] }>('list_devices');
      return r.devices;
    },
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => invoke('revoke_device', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });
  const replace = useMutation({
    mutationFn: async (id: string) => invoke('replace_device', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });

  const active = (devices ?? []).filter((d) => d.state === 'active');
  const others = (devices ?? []).filter((d) => d.state !== 'active');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Devices</h2>
      <div className="bg-white rounded border mb-4">
        <h3 className="px-4 py-2 font-medium border-b">Active ({active.length})</h3>
        {active.map((d) => (
          <div key={d.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.display_name}</div>
              <div className="text-sm text-gray-500">{d.user_email} · {d.device_type} · last seen {d.last_seen ?? 'never'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => replace.mutate(d.id)} className="px-3 py-1 text-sm border rounded">Replace</button>
              <button onClick={() => revoke.mutate(d.id)} className="px-3 py-1 text-sm text-red-600 border rounded">Revoke</button>
            </div>
          </div>
        ))}
      </div>
      {others.length > 0 && (
        <div className="bg-white rounded border">
          <h3 className="px-4 py-2 font-medium border-b">Revoked / replaced ({others.length})</h3>
          {others.map((d) => (
            <div key={d.id} className="px-4 py-3 border-b last:border-0 text-sm text-gray-500">
              {d.display_name} · {d.user_email} · {d.state}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f portal/src/pages/Devices.tsx || { echo "FAIL"; exit 1; }
grep -q "DevicesPage" portal/src/pages/Devices.tsx || { echo "FAIL"; exit 1; }
echo "OK"
```
