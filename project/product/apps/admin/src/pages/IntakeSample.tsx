import { useState } from 'react';
import { useIntakeSample } from '../hooks/useSamples';

export function IntakeSamplePage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const intake = useIntakeSample(projectId);
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
          <button onClick={() => setCreatedId(null)} className="px-3 py-1 border rounded text-sm">Register another</button>
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
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >Register sample</button>
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
