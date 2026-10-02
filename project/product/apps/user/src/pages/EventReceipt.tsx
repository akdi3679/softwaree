import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Receipt { sequence: number; event_type: string; occurred_at: string; actor: string; hash: string; prev_hash: string; verified: boolean; }
export function EventReceiptPage() {
  const { sequence } = useParams({ strict: false }) as { sequence?: string };
  const seq = parseInt(sequence ?? '0', 10);
  const { data: r } = useQuery({ queryKey: ['receipt', seq], queryFn: async () => await invoke<Receipt>('get_event_receipt', { sequence: seq }) });
  if (!r) return <div>Loading…</div>;
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Event receipt #{r.sequence}</h2>
      <div className="bg-white rounded border p-4 space-y-2 text-sm">
        <Row label="Event type" value={r.event_type} />
        <Row label="Occurred at" value={new Date(r.occurred_at).toLocaleString()} />
        <Row label="Actor" value={r.actor} />
        <Row label="Hash" value={r.hash} mono />
        <Row label="Previous hash" value={r.prev_hash} mono />
        <div className="pt-2 border-t mt-3">
          <span className="text-sm font-medium">Verification: </span>
          {r.verified ? <span className="text-green-600">? Chain verified locally</span> : <span className="text-red-600">? Chain integrity issue</span>}
        </div>
      </div>
    </div>
  );
}
function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex"><div className="w-32 text-gray-500">{label}:</div><div className={mono ? 'font-mono text-xs break-all' : ''}>{value}</div></div>;
}
