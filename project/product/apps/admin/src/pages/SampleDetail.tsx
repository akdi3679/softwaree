import { useState } from 'react';
import { useStartTest, useRecordResult } from '../hooks/useSamples';

export function SampleDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('projectId') ?? '';
  const sampleId = params.get('sampleId') ?? '';
  const startTest = useStartTest(projectId);
  const recordResult = useRecordResult(projectId);
  const [testType, setTestType] = useState('microbiology');
  const [assignedTech, setAssignedTech] = useState('');
  const [testId, setTestId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState('');
  const [passed, setPassed] = useState(true);

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Sample {sampleId}</h2>

      {!testId && (
        <div className="bg-white rounded border p-4 space-y-3">
          <h3 className="font-medium">Start test</h3>
          <input type="text" placeholder="Test type" value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <input type="text" placeholder="Assigned tech" value={assignedTech} onChange={(e) => setAssignedTech(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <button
            onClick={async () => {
              const r = await startTest.mutateAsync({ sampleId, testType, assignedTech });
              setTestId(r.test_id);
            }}
            disabled={!assignedTech}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >Start test</button>
        </div>
      )}

      {testId && (
        <div className="bg-white rounded border p-4 space-y-3">
          <h3 className="font-medium">Record result for {testId}</h3>
          <textarea placeholder="Measurements (JSON)" value={measurements} onChange={(e) => setMeasurements(e.target.value)} className="w-full h-32 px-3 py-2 border rounded font-mono text-sm" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={passed} onChange={(e) => setPassed(e.target.checked)} />
            <span>Passed</span>
          </label>
          <button
            onClick={async () => {
              let parsed: unknown = {};
              try { parsed = JSON.parse(measurements || '{}'); } catch { parsed = { raw: measurements }; }
              await recordResult.mutateAsync({ sampleId, testId, measurements: parsed, passed });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >Record result</button>
        </div>
      )}
    </div>
  );
}
