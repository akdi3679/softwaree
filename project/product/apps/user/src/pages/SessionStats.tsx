import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
interface SessionStats { connected_since: string; last_event_received_at: string; total_events_received: number; total_bytes_received: number; reconnection_count: number; current_session_id: string; lag_ms: number; }
export function SessionStatsPage() {
  const { data: s } = useQuery({ queryKey: ['session-stats'], queryFn: async () => await invoke<SessionStats>('get_session_stats'), refetchInterval: 5_000 });
  if (!s) return <div>Loading…</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Session stats</h2>
      <div className="bg-white rounded border p-4 space-y-2 text-sm">
        <Row label="Session ID" value={s.current_session_id} mono />
        <Row label="Connected since" value={new Date(s.connected_since).toLocaleString()} />
        <Row label="Last event" value={new Date(s.last_event_received_at).toLocaleString()} />
        <Row label="Events received" value={s.total_events_received.toString()} />
        <Row label="Bytes received" value={`${(s.total_bytes_received / 1024 / 1024).toFixed(1)} MB`} />
        <Row label="Reconnections" value={s.reconnection_count.toString()} />
        <Row label="Lag" value={`${s.lag_ms} ms`} />
      </div>
    </div>
  );
}
function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="flex"><div className="w-40 text-gray-500">{label}:</div><div className={mono ? 'font-mono text-xs break-all' : ''}>{value}</div></div>; }
