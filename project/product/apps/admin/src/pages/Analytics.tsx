import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface AnalyticsStats {
  active_patients: number;
  appointments_this_week: number;
  samples_this_month: number;
  storage_mb: number;
  events_per_day: number[];
  top_event_types: { type: string; count: number }[];
}

export function AnalyticsPage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const { data: stats } = useQuery({
    queryKey: ['analytics', projectId],
    queryFn: () => invoke<AnalyticsStats>('project_analytics', { projectId }),
    enabled: !!projectId,
  });

  if (!stats) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPI label="Active patients" value={stats.active_patients} />
        <KPI label="Appointments (7d)" value={stats.appointments_this_week} />
        <KPI label="Samples (30d)" value={stats.samples_this_month} />
        <KPI label="Storage (MB)" value={stats.storage_mb} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded border p-4">
          <h3 className="font-medium mb-2">Events per day (last 30 days)</h3>
          <SparkBars data={stats.events_per_day} />
        </div>
        <div className="bg-white rounded border p-4">
          <h3 className="font-medium mb-2">Top event types</h3>
          <ul>
            {stats.top_event_types.map((e) => (
              <li key={e.type} className="py-1 flex justify-between">
                <span>{e.type}</span>
                <span className="text-gray-500">{e.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function SparkBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-blue-500"
          style={{ height: `${(v / max) * 100}%` }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}
