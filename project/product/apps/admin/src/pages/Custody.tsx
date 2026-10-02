import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function CustodyPage() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('projectId') ?? '';
  const sampleId = params.get('sampleId') ?? '';
  const { data: events } = useQuery({
    queryKey: ['foodlab', 'custody', projectId, sampleId],
    queryFn: () => invoke<unknown[]>('module_query', {
      projectId, queryType: 'sample.custody', payload: { sample_id: sampleId },
    }),
    enabled: !!sampleId,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Chain of custody</h2>
      <div className="bg-white rounded border p-4">
        <div className="font-medium mb-2">Sample: {sampleId}</div>
        <ol className="space-y-2">
          {(events ?? []).map((e: any, i) => (
            <li key={i} className="flex gap-3">
              <div className="text-gray-400 text-sm w-32">{e.transferred_at}</div>
              <div>
                <div className="font-medium">{e.from_user} → {e.to_user}</div>
                <div className="text-sm text-gray-600">{e.reason} at {e.location}{e.temperature_c ? ` · ${e.temperature_c}°C` : ''}</div>
              </div>
            </li>
          ))}
          {(events ?? []).length === 0 && <li className="text-gray-500 text-sm">No transfers recorded</li>}
        </ol>
      </div>
    </div>
  );
}
