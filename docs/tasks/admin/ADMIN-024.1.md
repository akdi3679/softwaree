# TASK ID: ADMIN-024.1
# TITLE: Add Admin: scheduled jobs view
# STATUS: pending
# DEPENDENCIES: USER-015.2
# ALLOWED FILES: product/apps/admin/src/pages/Jobs.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show all background jobs: backups, outbox dispatch, etc.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Jobs.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Job {
  id: string;
  job_type: string;
  state: string;
  attempts: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  last_error: string | null;
  payload: any;
}

export function JobsPage() {
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      return await invoke<Job[]>('list_jobs', { limit: 100 });
    },
    refetchInterval: 3_000,
  });
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Background jobs</h2>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Type</th>
              <th>State</th>
              <th>Attempts</th>
              <th>Next</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).map((j) => (
              <tr key={j.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{j.job_type}</td>
                <td><span className={`px-2 py-1 rounded text-xs ${
                  j.state === 'completed' ? 'bg-green-100' :
                  j.state === 'failed' ? 'bg-red-100' :
                  j.state === 'running' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>{j.state}</span></td>
                <td>{j.attempts}</td>
                <td className="text-xs">{j.next_attempt_at ? new Date(j.next_attempt_at).toLocaleString() : '—'}</td>
                <td className="text-xs text-red-600 truncate max-w-xs">{j.last_error ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Jobs.tsx || { echo "FAIL"; exit 1; }
grep -q "JobsPage" apps/admin/src/pages/Jobs.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
