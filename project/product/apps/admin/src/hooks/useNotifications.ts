import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  body: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => invoke<Notification[]>('list_notifications'),
    refetchInterval: 10_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoke<void>('mark_notification_read', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}