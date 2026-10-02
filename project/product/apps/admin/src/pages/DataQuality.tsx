import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Report {
  total_events: number;
  duplicate_sequences: number;
  missing_hashes: number;
  last_event_at: string | null;
  issues: { severity: string; code: string; message: string; count: number }[];
}

export function DataQualityPage() {
  const { data: r } = useQuery({
    queryKey: ['data-quality'],
    queryFn: async () => {
      return await invoke<Report>('data_quality_check');
    },
    refetchInterval: 60_000,
  });
  if (!r) return <div>Loading…</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Data quality</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Total events" value={r.total_events.toLocaleString()} />
        <Stat label="Duplicate sequences" value={r.duplicate_sequences.toLocaleString()} bad={r.duplicate_sequences > 0} />
        <Stat label="Missing hashes" value={r.missing_hashes.toLocaleString()} bad={r.missing_hashes > 0} />
      </div>
      <h3 className="text-lg font-semibold mb-2">Issues</h3>
      {r.issues.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-800">? No issues found</div>
      ) : (
        <div className="space-y-2">
          {r.issues.map((i) => (
            <div key={i.code} className={`rounded p-3 border ${
              i.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="font-medium">{i.code}: {i.message}</div>
              <div className="text-sm">{i.count} occurrence(s)</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className={`bg-white rounded border p-4 ${bad ? 'border-red-300' : ''}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${bad ? 'text-red-600' : ''}`}>{value}</div>
    </div>
  );
}
