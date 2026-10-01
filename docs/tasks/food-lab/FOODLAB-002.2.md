# TASK ID: FOODLAB-002.2
# TITLE: Add food-lab Admin UI — Sample queue + intake
# STATUS: pending
# DEPENDENCIES: FOODLAB-002.1
# ALLOWED FILES: product/apps/admin/src/pages/SampleQueue.tsx, product/apps/admin/src/pages/IntakeSample.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Sample queue dashboard and intake form.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useSamples.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Sample {
  sample_id: string;
  client_name: string;
  sample_type: string;
  status: string;
  created_at: string;
}

export function useSampleQueue(projectId: string) {
  return useQuery({
    queryKey: ['foodlab', 'queue', projectId],
    queryFn: async () => {
      return await invoke<Sample[]>('module_query', {
        projectId, queryType: 'sample.today', payload: {},
      });
    },
    refetchInterval: 5_000,
  });
}

export function useSampleSearch(projectId: string, query: string) {
  return useQuery({
    queryKey: ['foodlab', 'search', projectId, query],
    queryFn: async () => {
      return await invoke<Sample[]>('module_query', {
        projectId, queryType: 'sample.search', payload: { query },
      });
    },
    enabled: !!query,
  });
}

export function useIntakeSample(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientName: string; sampleType: string; collectedAt: string; notes?: string }) => {
      return await invoke<{ sample_id: string }>('module_command', {
        projectId,
        commandType: 'sample.intake',
        payload: {
          client_name: input.clientName,
          sample_type: input.sampleType,
          collected_at: input.collectedAt,
          notes: input.notes,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foodlab'] }),
  });
}

export function useStartTest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sampleId: string; testType: string; assignedTech: string }) => {
      return await invoke<{ test_id: string }>('module_command', {
        projectId,
        commandType: 'sample.start_test',
        payload: {
          sample_id: input.sampleId,
          test_type: input.testType,
          assigned_tech: input.assignedTech,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foodlab'] }),
  });
}

export function useRecordResult(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sampleId: string; testId: string; measurements: any; passed: boolean }) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'sample.record_result',
        payload: {
          sample_id: input.sampleId,
          test_id: input.testId,
          measurements: input.measurements,
          passed: input.passed,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foodlab'] }),
  });
}
```

Create `product/apps/admin/src/pages/SampleQueue.tsx`:

```typescript
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSampleQueue } from '../hooks/useSamples';

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-800',
  in_test: 'bg-blue-100 text-blue-800',
  results_recorded: 'bg-yellow-100 text-yellow-800',
  report_issued: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-500',
};

export function SampleQueuePage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: samples } = useSampleQueue(projectId ?? '');
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Sample queue</h2>
        <button
          onClick={() => navigate({ to: '/projects/$projectId/intake', params: { projectId: projectId! } })}
          className="px-4 py-2 bg-primary-600 text-white rounded"
        >
          New intake
        </button>
      </div>
      <div className="space-y-2">
        {(samples ?? []).map((s) => (
          <div key={s.sample_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.sample_id}</div>
              <div className="text-sm text-gray-500">{s.client_name} · {s.sample_type} · {s.created_at}</div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[s.status] ?? 'bg-gray-100'}`}>
              {s.status}
            </span>
          </div>
        ))}
        {samples?.length === 0 && (
          <div className="bg-white rounded border p-6 text-center text-gray-500">
            No samples in the queue
          </div>
        )}
      </div>
    </div>
  );
}
```

Create `product/apps/admin/src/pages/IntakeSample.tsx`:

```typescript
import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useIntakeSample } from '../hooks/useSamples';

export function IntakeSamplePage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const intake = useIntakeSample(projectId ?? '');
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [sampleType, setSampleType] = useState('water');
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">New sample intake</h2>
      {createdId ? (
        <div className="bg-white rounded border p-4">
          <div className="text-green-600 mb-2">Sample registered: {createdId}</div>
          <button
            onClick={() => navigate({ to: '/projects/$projectId/samples', params: { projectId: projectId! } })}
            className="px-3 py-1 border rounded text-sm"
          >
            Back to queue
          </button>
        </div>
      ) : (
        <div className="bg-white rounded border p-4 space-y-3">
          <Field label="Client name">
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </Field>
          <Field label="Sample type">
            <select value={sampleType} onChange={(e) => setSampleType(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="water">Water</option>
              <option value="meat">Meat</option>
              <option value="dairy">Dairy</option>
              <option value="produce">Produce</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Collected at">
            <input type="datetime-local" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </Field>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded h-24" />
          </Field>
          <button
            onClick={async () => {
              const result = await intake.mutateAsync({ clientName, sampleType, collectedAt, notes: notes || undefined });
              setCreatedId(result.sample_id);
            }}
            disabled={!clientName}
            className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50"
          >
            Register sample
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      {children}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/SampleQueue.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/pages/IntakeSample.tsx || { echo "FAIL: no intake"; exit 1; }
test -f apps/admin/src/hooks/useSamples.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
