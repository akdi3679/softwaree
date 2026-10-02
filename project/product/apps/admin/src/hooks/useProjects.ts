import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface LocalProject {
  project_id: string;
  name: string;
  state: string;
}

export function useLocalProjects() {
  return useQuery({
    queryKey: ['projects', 'local'],
    queryFn: async () => {
      return await invoke<LocalProject[]>('list_local_projects');
    },
  });
}

export function useOpenProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      return await invoke<LocalProject>('open_project', { projectId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      adminLastName: string;
      businessType: string;
      businessName: string;
    }) => {
      return await invoke<LocalProject>('create_project', {
        name: input.name,
        adminLastName: input.adminLastName,
        businessType: input.businessType,
        businessName: input.businessName,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
