import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface User {
  id: string;
  email: string;
  display_name: string;
  state: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  is_built_in: boolean;
}

export function useUsers(projectId: string | null) {
  return useQuery({
    queryKey: ['users', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<User[]>('list_users', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useRoles(projectId: string | null) {
  return useQuery({
    queryKey: ['roles', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<Role[]>('list_roles', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useInviteUser(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; initialRole: string }) => {
      return await invoke<{ invitation_id: string; token: string; expires_at: string }>(
        'invite_user',
        { projectId, actorUserId: 'admin', email: input.email, initialRole: input.initialRole },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', projectId] }),
  });
}

export function useChangeUserRole(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; newRole: string }) => {
      return await invoke<{ user_id: string; role: string }>('change_user_role', {
        projectId, actorUserId: 'admin', userId: input.userId, newRole: input.newRole,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', projectId] }),
  });
}
