import { useSamples } from '../hooks/useDomain';
export function SamplesPage() {
  const { data: samples } = useSamples();
  return <div className="p-6"><h2 className="text-2xl font-semibold mb-4">Samples</h2><div className="bg-white rounded border">{(samples ?? []).map((s: any) => <div key={s.sample_id} className="px-4 py-3 border-b last:border-0"><div className="font-medium">{s.sample_id}</div><div className="text-sm text-gray-500">{s.sample_type} · {s.client_name} · {s.status}</div></div>)}{samples?.length === 0 && <div className="p-6 text-center text-gray-500">No samples</div>}</div></div>;
}
