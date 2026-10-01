# TASK ID: ADMIN-026.1
# TITLE: Add Admin: scheduled maintenance window
# STATUS: pending
# DEPENDENCIES: LOAD-005.2
# ALLOWED FILES: product/apps/admin/src/pages/Maintenance.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Admin can declare a maintenance window: 30 min of read-only mode.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Maintenance.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function MaintenancePage() {
  const [minutes, setMinutes] = useState(30);
  const [reason, setReason] = useState('');
  const [scheduled, setScheduled] = useState<{ until: string } | null>(null);

  async function schedule() {
    const r = await invoke<{ until: string }>('enter_maintenance', { minutes, reason });
    setScheduled(r);
  }
  async function exit() {
    await invoke('exit_maintenance');
    setScheduled(null);
  }

  if (scheduled) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Maintenance mode active</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p>The app is in read-only mode until {new Date(scheduled.until).toLocaleString()}.</p>
          <p className="text-sm text-gray-600 mt-2">All writes are blocked. Users will be notified via the connection status banner.</p>
          <button onClick={exit} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded">Exit maintenance</button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Schedule maintenance</h2>
      <div className="bg-white rounded border p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input type="number" value={minutes} onChange={(e) => setMinutes(+e.target.value)} min={5} max={240} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reason (visible to users)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" />
        </div>
        <button onClick={schedule} className="px-4 py-2 bg-yellow-600 text-white rounded">Enter maintenance mode</button>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Maintenance.tsx || { echo "FAIL"; exit 1; }
grep -q "MaintenancePage" apps/admin/src/pages/Maintenance.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
