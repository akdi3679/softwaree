import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface BackupRecord {
  id: string;
  project_id: string;
  schema_version: number;
  database_sha256: string;
  encrypted_size_bytes: number;
  created_at: string;
  note: string | null;
}

export function useBackups(projectId: string | null) {
  return useQuery({
    queryKey: ['backups', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<BackupRecord[]>('list_backups', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useCreateBackup(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { passphrase: string; note?: string }) => {
      return await invoke<string>('create_backup', {
        projectId,
        passphrase: input.passphrase,
        note: input.note ?? null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups', projectId] }),
  });
}
