import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface InstalledModule {
  id: string;
  module_id: string;
  name: string;
  version: string;
  state: string;
  installed_at: string;
}

export interface AvailableModule {
  module_id: string;
  name: string;
  latest_version: string;
  description: string;
}

export function useInstalledModules(projectId: string | null) {
  return useQuery({
    queryKey: ['modules', 'installed', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<InstalledModule[]>('list_installed_modules', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useAvailableModules(projectId: string | null) {
  return useQuery({
    queryKey: ['modules', 'available', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<AvailableModule[]>('list_available_modules', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useInstallModule(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { moduleId: string; version: string }) => {
      return await invoke<string>('install_module', {
        projectId,
        moduleId: input.moduleId,
        version: input.version,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }),
  });
}
