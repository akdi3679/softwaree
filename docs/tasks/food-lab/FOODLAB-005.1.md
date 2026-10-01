# TASK ID: FOODLAB-005.1
# TITLE: Add food-lab Admin UI — Reports list
# STATUS: pending
# DEPENDENCIES: MEDICAL-005.3
# ALLOWED FILES: product/apps/admin/src/pages/Reports.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
List of issued reports, download as PDF.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Reports.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useDownloadReport } from '../hooks/useReports';

interface Report {
  report_id: string;
  sample_id: string;
  recipient_email: string;
  issued_at: string;
}

export function ReportsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: reports } = useQuery({
    queryKey: ['foodlab', 'reports', projectId],
    queryFn: async () => {
      return await invoke<Report[]>('module_query', {
        projectId, queryType: 'report.list', payload: {},
      });
    },
    refetchInterval: 5_000,
  });
  const download = useDownloadReport();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Reports</h2>
      <div className="bg-white rounded border">
        {(reports ?? []).map((r) => (
          <div key={r.report_id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.sample_id}</div>
              <div className="text-sm text-gray-500">To: {r.recipient_email} · {r.issued_at}</div>
            </div>
            <button
              onClick={() => download.mutate({ sampleId: r.sample_id, reportId: r.report_id })}
              className="px-3 py-1 text-sm border rounded"
            >
              Download PDF
            </button>
          </div>
        ))}
        {reports?.length === 0 && <div className="p-6 text-center text-gray-500">No reports yet</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Reports.tsx || { echo "FAIL"; exit 1; }
grep -q "ReportsPage" apps/admin/src/pages/Reports.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
