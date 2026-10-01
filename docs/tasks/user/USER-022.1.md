# TASK ID: USER-022.1
# TITLE: Add User: read-only sample detail with chain of custody
# STATUS: pending
# DEPENDENCIES: ADMIN-049.2
# ALLOWED FILES: product/apps/user/src/pages/SampleDetail.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Food lab: see sample + every transfer (custody) + result.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/SampleDetail.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Sample { sample_id: string; type: string; status: string; received_at: string; }
interface Custody { custody_id: string; from: string; to: string; transferred_at: string; condition: string; signature: string; }
interface Result { parameter: string; value: string; unit: string; flag: string; }

export function SampleDetailPage() {
  const { sampleId } = useParams({ strict: false }) as { sampleId?: string };
  const { data: s } = useQuery({ queryKey: ['sample', sampleId], queryFn: async () => await invoke<Sample>('get_sample', { sampleId }) });
  const { data: custody } = useQuery({ queryKey: ['custody', sampleId], queryFn: async () => await invoke<Custody[]>('get_custody', { sampleId }) });
  const { data: results } = useQuery({ queryKey: ['results', sampleId], queryFn: async () => await invoke<Result[]>('get_results', { sampleId }) });
  if (!s) return <div>Loading…</div>;
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-2">Sample {s.sample_id}</h2>
      <div className="text-sm text-gray-500 mb-6">Type: {s.type} · Status: {s.status} · Received: {new Date(s.received_at).toLocaleString()}</div>

      <h3 className="text-lg font-semibold mb-2">Chain of custody</h3>
      <div className="bg-white rounded border mb-6">
        {(custody ?? []).map((c, i) => (
          <div key={c.custody_id} className="px-4 py-2 border-b last:border-0 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{c.from} → {c.to}</div>
              <div className="text-xs text-gray-500">{new Date(c.transferred_at).toLocaleString()} · {c.condition}</div>
            </div>
            {c.signature && <code className="text-xs text-gray-400">{c.signature.slice(0, 12)}…</code>}
          </div>
        ))}
        {custody?.length === 0 && <div className="p-4 text-sm text-gray-500">No transfers yet</div>}
      </div>

      <h3 className="text-lg font-semibold mb-2">Results</h3>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Parameter</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {(results ?? []).map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-2">{r.parameter}</td>
                <td className="font-mono">{r.value}</td>
                <td>{r.unit}</td>
                <td>{r.flag === 'abnormal' ? '⚠ Abnormal' : r.flag === 'critical' ? '⛔ Critical' : 'OK'}</td>
              </tr>
            ))}
            {results?.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No results</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/SampleDetail.tsx || { echo "FAIL"; exit 1; }
grep -q "SampleDetailPage" apps/user/src/pages/SampleDetail.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
