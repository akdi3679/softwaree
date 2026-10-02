import { useEventLog } from '../hooks/useProjection';

export function EventsPage() {
  const { data: events } = useEventLog();
  return <div className="p-6"><h2 className="text-2xl font-semibold mb-4">Event log</h2><div className="bg-white rounded border">{(events ?? []).map((e: any) => <div key={e.sequence} className="px-4 py-2 border-b last:border-0 font-mono text-xs"><span className="text-gray-500">#{e.sequence}</span>{' '}<span className="font-medium">{e.event_type}</span>{' '}<span className="text-gray-500">on {e.aggregate_type}:{e.aggregate_id}</span></div>)}</div></div>;
}
