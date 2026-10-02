import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface TickerEntry {
  sequence: number;
  event_type: string;
  aggregate_id: string;
  occurred_at: string;
  actor: string;
}

export function EventTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([]);
  useEffect(() => {
    const unlisten = listen<TickerEntry>('event-applied', (e) => {
      setEntries((cur) => [e.payload, ...cur].slice(0, 20));
    });
    return () => { unlisten.then((u) => u()); };
  }, []);
  return (
    <div className="bg-white rounded border p-3 h-96 overflow-y-auto">
      <h3 className="font-medium mb-2">Live activity</h3>
      <div className="space-y-1">
        {entries.map((e) => (
          <div key={e.sequence} className="text-xs font-mono border-l-2 border-primary-500 pl-2 py-0.5">
            <span className="text-gray-500">#{e.sequence}</span> <strong>{e.event_type}</strong> by {e.actor}
            <div className="text-gray-500">{new Date(e.occurred_at).toLocaleString()}</div>
          </div>
        ))}
        {entries.length === 0 && <div className="text-xs text-gray-500">No recent activity</div>}
      </div>
    </div>
  );
}
