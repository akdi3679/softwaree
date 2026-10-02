import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface WaitingEntry {
  entry_id: string;
  patient_id: string;
  requested_date: string;
  priority: string;
  reason: string;
  status: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

export function WaitingListPage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const qc = useQueryClient();
  const { data: entries } = useQuery({
    queryKey: ['medical', 'waiting', projectId],
    queryFn: () => invoke<WaitingEntry[]>('module_query', {
      projectId, queryType: 'waiting_list.list', payload: {},
    }),
    refetchInterval: 5_000,
  });
  const remove = useMutation({
    mutationFn: async (entryId: string) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'waiting_list.remove',
        payload: { entry_id: entryId, reason: 'manual' },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'waiting'] }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Waiting list</h2>
      <div className="space-y-2">
        {(entries ?? []).map((e) => (
          <div key={e.entry_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{e.patient_id}</div>
              <div className="text-sm text-gray-500">{e.reason} · requested {e.requested_date} · {e.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${PRIORITY_COLORS[e.priority]}`}>{e.priority}</span>
              {e.status === 'waiting' && (
                <button onClick={() => remove.mutate(e.entry_id)} className="px-2 py-1 text-sm border rounded">Remove</button>
              )}
            </div>
          </div>
        ))}
        {(entries ?? []).length === 0 && (
          <div className="bg-white rounded border p-6 text-center text-gray-500">Waiting list is empty</div>
        )}
      </div>
    </div>
  );
}
