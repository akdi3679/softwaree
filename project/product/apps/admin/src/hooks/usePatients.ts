import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Patient {
  patient_id: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
}

export function usePatients(projectId: string, search: string = '') {
  return useQuery({
    queryKey: ['medical', 'patients', projectId, search],
    queryFn: async () => {
      return await invoke<Patient[]>('module_query', {
        projectId,
        queryType: search ? 'patient.search' : 'patient.list',
        payload: search ? { query: search } : {},
      });
    },
    refetchInterval: 5_000,
  });
}

export function useCreatePatient(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { fullName: string; phone: string; dateOfBirth: string }) => {
      return await invoke<{ patient_id: string }>('module_command', {
        projectId,
        commandType: 'patient.create',
        payload: {
          full_name: input.fullName,
          phone: input.phone,
          date_of_birth: input.dateOfBirth,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical', 'patients'] });
    },
  });
}
