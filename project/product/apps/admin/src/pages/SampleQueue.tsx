import { useSampleQueue } from '../hooks/useSamples';

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-800',
  in_test: 'bg-blue-100 text-blue-800',
  results_recorded: 'bg-yellow-100 text-yellow-800',
  report_issued: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-500',
};

export function SampleQueuePage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const { data: samples } = useSampleQueue(projectId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Sample queue</h2>
      </div>
      <div className="space-y-2">
        {(samples ?? []).map((s) => (
          <div key={s.sample_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.sample_id}</div>
              <div className="text-sm text-gray-500">{s.client_name} · {s.sample_type} · {s.created_at}</div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[s.status] ?? 'bg-gray-100'}`}>
              {s.status}
            </span>
          </div>
        ))}
        {(samples ?? []).length === 0 && (
          <div className="bg-white rounded border p-6 text-center text-gray-500">No samples in the queue</div>
        )}
      </div>
    </div>
  );
}
