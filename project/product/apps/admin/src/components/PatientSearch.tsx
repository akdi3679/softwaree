import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { invoke } from '@tauri-apps/api/core';

interface Patient {
  patient_id: string;
  full_name: string;
  phone: string;
  email: string;
  archived: boolean;
  created_at: string;
}

export function PatientSearch({ projectId, onSelect }: { projectId: string; onSelect: (p: Patient) => void }) {
  const [q, setQ] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const debouncedQ = useDebounce(q, 250);
  const [results, setResults] = useState<Patient[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQ.length < 2) { setResults([]); return; }
    invoke<Patient[]>('search_patients', { projectId, q: debouncedQ, includeArchived })
      .then((r) => { if (!cancelled) setResults(r); });
    return () => { cancelled = true; };
  }, [debouncedQ, includeArchived, projectId]);

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, or ID…" className="flex-1 px-3 py-2 border rounded" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Archived
        </label>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {results.map((p) => (
          <div key={p.patient_id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => onSelect(p)}>
            <div className="font-medium">{p.full_name}</div>
            <div className="text-xs text-gray-500">{p.phone} · {p.patient_id} {p.archived && '· archived'}</div>
          </div>
        ))}
        {debouncedQ.length >= 2 && results.length === 0 && <div className="text-sm text-gray-500">No results</div>}
      </div>
    </div>
  );
}
