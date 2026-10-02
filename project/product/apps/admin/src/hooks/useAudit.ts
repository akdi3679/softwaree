import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface AuditEntry {
  id: number;
  occurred_at: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  result: string;
  details: string | null;
}

export function useAuditEntries(projectId: string | null, limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['audit', projectId, limit, offset],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<AuditEntry[]>('list_audit_entries', { projectId, limit, offset });
    },
    enabled: !!projectId,
  });
}
