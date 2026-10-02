import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function EntityDetailPage() {
  const { aggregateType, aggregateId } = useParams({ strict: false }) as { aggregateType?: string; aggregateId?: string };
  const { data } = useQuery({
    queryKey: ['entity', aggregateType, aggregateId],
    queryFn: async () => {
      return await invoke<{ data: any; updated_at: string }>('get_projection_entity', {
        table: aggregateType, id: aggregateId,
      });
    },
  });
  if (!data) return <div>Loading…</div>;
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-2 capitalize">{aggregateType}</h2>
      <p className="text-xs text-gray-500 mb-4">ID: {aggregateId} · Updated {new Date(data.updated_at).toLocaleString()}</p>
      <div className="bg-white rounded border p-4">
        <pre className="text-sm overflow-x-auto">{JSON.stringify(data.data, null, 2)}</pre>
      </div>
      <div className="mt-4">
        <Link to="/events" className="text-sm text-primary-600">View event history ?</Link>
      </div>
    </div>
  );
}
