import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
interface DashboardStats { total_patients: number; total_appointments: number; total_samples: number; events_today: number; last_event_at: string; sync_lag_ms: number; }
export function UserDashboardPage() {
  const { data: s } = useQuery({ queryKey: ['user-dashboard'], queryFn: async () => await invoke<DashboardStats>('get_user_dashboard_stats'), refetchInterval: 10_000 });
  if (!s) return <div>Loading…</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Today</h2>
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Patients" value={s.total_patients} />
        <Stat label="Appointments" value={s.total_appointments} />
        <Stat label="Samples" value={s.total_samples} />
        <Stat label="Events today" value={s.events_today} />
      </div>
      <div className="mt-4 text-sm text-gray-500">Last event: {new Date(s.last_event_at).toLocaleString()} · Lag: {s.sync_lag_ms}ms</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="bg-white rounded border p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-3xl font-semibold mt-1">{value.toLocaleString()}</div></div>; }
