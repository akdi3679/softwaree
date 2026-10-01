# TASK ID: PORTAL-003.2
# TITLE: Add portal — Audit log viewer
# STATUS: pending
# DEPENDENCIES: PORTAL-003.1
# ALLOWED FILES: platform-cloud/portal/src/pages/AuditLog.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer can see their own audit log.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/portal/src/pages/AuditLog.tsx`:

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  category: string;
  action: string;
  ip: string;
  user_agent: string;
}

export function AuditLogPage() {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const { data } = useQuery({
    queryKey: ['audit', page],
    queryFn: async () => {
      return await invoke<{ entries: AuditEntry[]; total: number }>('list_audit', { offset: page * pageSize, limit: pageSize });
    },
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Audit log</h2>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries ?? []).map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="px-4 py-2">{new Date(e.timestamp).toLocaleString()}</td>
                <td>{e.actor}</td>
                <td>{e.action}</td>
                <td>{e.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-between">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 border rounded">Previous</button>
        <span>Page {page + 1} of {Math.ceil((data?.total ?? 0) / pageSize)}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * pageSize >= (data?.total ?? 0)} className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f portal/src/pages/AuditLog.tsx || { echo "FAIL"; exit 1; }
grep -q "AuditLogPage" portal/src/pages/AuditLog.tsx || { echo "FAIL"; exit 1; }
echo "OK"
```
