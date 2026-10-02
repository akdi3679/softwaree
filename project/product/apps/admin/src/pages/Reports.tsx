import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Report {
  report_id: string;
  sample_id: string;
  recipient_email: string;
  issued_at: string;
}

export function ReportsPage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const { data: reports } = useQuery({
    queryKey: ['foodlab', 'reports', projectId],
    queryFn: () => invoke<Report[]>('module_query', {
      projectId, queryType: 'report.list', payload: {},
    }),
    refetchInterval: 5_000,
  });

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
          </div>
        ))}
        {(reports ?? []).length === 0 && <div className="p-6 text-center text-gray-500">No reports yet</div>}
      </div>
    </div>
  );
}
