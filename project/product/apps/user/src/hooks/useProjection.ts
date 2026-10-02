import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface UserRecord { id: string; email: string; display_name: string; state: string; }
export interface AuditRecord { id: number; occurred_at: string; actor_user_id: string | null; action: string; result: string; }

export function useUsers() {
  return useQuery({
    queryKey: ['projection', 'users'],
    queryFn: async () => {
      const result = await invoke<{ rows: UserRecord[] }>('list_projection', { table: 'users' });
      return result.rows;
    },
    refetchInterval: 5_000,
  });
}

export function useAudit() {
  return useQuery({
    queryKey: ['projection', 'audit'],
    queryFn: async () => {
      const result = await invoke<{ rows: AuditRecord[] }>('list_projection', { table: 'audit' });
      return result.rows;
    },
    refetchInterval: 5_000,
  });
}

export function useEventLog(fromSequence: number = 0, limit: number = 100) {
  return useQuery({
    queryKey: ['projection', 'events', fromSequence, limit],
    queryFn: async () => {
      const result = await invoke<{ events: any[] }>('query_event_log', { fromSequence, limit });
      return result.events;
    },
    refetchInterval: 3_000,
  });
}

export function useSyncNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => await invoke<number>('sync_now'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projection'] }),
  });
}
