import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

type SoapSection = 'subjective' | 'objective' | 'assessment' | 'plan';

export function ActiveVisitPage() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('projectId') ?? '';
  const visitId = params.get('visitId') ?? '';
  const qc = useQueryClient();
  const { data: visit } = useQuery({
    queryKey: ['medical', 'visit', visitId],
    queryFn: () => invoke<any>('module_query', {
      projectId, queryType: 'visit.get_full', payload: { visit_id: visitId },
    }),
    enabled: !!visitId,
  });

  const [notes, setNotes] = useState<Record<SoapSection, string>>({
    subjective: '', objective: '', assessment: '', plan: '',
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [summary, setSummary] = useState('');

  const addNote = useMutation({
    mutationFn: async (input: { noteType: SoapSection; note: string }) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'visit.add_note',
        payload: { visit_id: visitId, note_type: input.noteType, note: input.note },
      });
    },
    onSuccess: (_data, vars) => {
      setNotes((prev) => ({ ...prev, [vars.noteType]: '' }));
      qc.invalidateQueries({ queryKey: ['medical', 'visit', visitId] });
    },
  });

  const complete = useMutation({
    mutationFn: async () => {
      return await invoke('module_command', {
        projectId,
        commandType: 'visit.complete',
        payload: { visit_id: visitId, diagnosis, summary },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'visit', visitId] }),
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Active visit</h2>
        <div className="text-sm text-gray-500">Visit {visitId} · Started {visit?.started_at}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {(['subjective', 'objective', 'assessment', 'plan'] as SoapSection[]).map((section) => (
          <div key={section} className="bg-white rounded border p-3">
            <div className="font-medium capitalize mb-2">{section}</div>
            <textarea
              value={notes[section]}
              onChange={(e) => setNotes({ ...notes, [section]: e.target.value })}
              className="w-full h-32 px-2 py-1 border rounded text-sm"
              placeholder={`Type ${section} note...`}
            />
            <button
              onClick={() => addNote.mutate({ noteType: section, note: notes[section] })}
              disabled={!notes[section].trim()}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >Add note</button>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded border p-4">
        <h3 className="font-medium mb-2">Complete visit</h3>
        <input
          type="text"
          placeholder="Diagnosis (ICD-10)"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full mb-2 px-3 py-2 border rounded"
        />
        <textarea
          placeholder="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full h-24 px-3 py-2 border rounded"
        />
        <button
          onClick={() => complete.mutate()}
          disabled={!diagnosis || !summary}
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >Complete visit</button>
      </div>
    </div>
  );
}
