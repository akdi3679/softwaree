import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Row { aggregate_id: string; event_count: number; }

export function TopPatientsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: rows } = useQuery({
    queryKey: ['top-patients', projectId],
    queryFn: async () => {
      return await invoke<Row[]>('top_aggregates', { projectId, aggregateType: 'patient', limit: 10 });
    },
  });
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Top 10 patients by activity</h2>
      <div className="bg-white rounded border">
        {(rows ?? []).map((r, i) => (
          <div key={r.aggregate_id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <span className="font-mono text-sm text-gray-500 mr-2">#{i + 1}</span>
              <span className="font-medium">{r.aggregate_id}</span>
            </div>
            <div className="text-sm text-gray-500">{r.event_count.toLocaleString()} events</div>
          </div>
        ))}
      </div>
    </div>
  );
}
