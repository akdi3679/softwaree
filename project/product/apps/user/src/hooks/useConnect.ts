import { useQuery, useMutation } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface MeshPeer {
  id: string;
  name: string;
  dns_name: string;
  ip: string;
  online: boolean;
  tags: string[];
}

interface MeshStatus {
  backend_state: string;
  self_dns_name: string;
  self_ip: string;
  peers: MeshPeer[];
}

export function useMeshStatus() {
  return useQuery({
    queryKey: ['tailscale', 'status'],
    queryFn: async () => {
      return await invoke<MeshStatus>('get_tailscale_status');
    },
    refetchInterval: 30_000,
  });
}

export function useConnect() {
  return useMutation({
    mutationFn: async (input: { host: string; port: number; userId: string; projectId: string; authToken: string }) => {
      return await invoke<string>('connect_to_admin', {
        host: input.host,
        port: input.port,
        userId: input.userId,
        projectId: input.projectId,
        authToken: input.authToken,
      });
    },
  });
}

export function useDisconnect() {
  return useMutation({
    mutationFn: async () => {
      return await invoke<void>('disconnect_from_admin');
    },
  });
}
