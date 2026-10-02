import { useState } from 'react';
import { useEventLog } from '../hooks/useProjection';

export function EventLogPage() {
  const [fromSeq, setFromSeq] = useState(0);
  const limit = 50;
  const { data: events } = useEventLog(fromSeq, limit);
  const [filter, setFilter] = useState('');
  const filtered = (events ?? []).filter((e: any) => !filter || e.event_type.includes(filter) || e.aggregate_id.includes(filter));
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Event log</h2>
      <div className="mb-4 flex gap-2 items-center">
        <input type="text" placeholder="Filter by event type or aggregate id" value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
        <button onClick={() => setFromSeq(0)} className="px-3 py-1 border rounded text-sm">From start</button>
        <button onClick={() => { const last = (events ?? []).slice(-1)[0] as any; if (last) setFromSeq(last.sequence); }} className="px-3 py-1 border rounded text-sm">Next page</button>
      </div>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead><tr className="bg-gray-50 text-left text-xs uppercase text-gray-500"><th className="px-4 py-2">Seq</th><th className="px-4 py-2">Time</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Aggregate</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Payload</th></tr></thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e.sequence} className="border-t">
                <td className="px-4 py-2 text-gray-500">#{e.sequence}</td>
                <td className="px-4 py-2 text-xs">{e.occurred_at}</td>
                <td className="px-4 py-2 font-medium">{e.event_type}</td>
                <td className="px-4 py-2 text-gray-700">{e.aggregate_type}:{e.aggregate_id}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{e.actor_user_id}</td>
                <td className="px-4 py-2 text-xs"><code className="bg-gray-100 px-1 rounded">{e.payload}</code></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No events</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
