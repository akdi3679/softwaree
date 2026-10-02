import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Sample {
  sample_id: string;
  client_name: string;
  sample_type: string;
  status: string;
  created_at: string;
}

export function useSampleQueue(projectId: string) {
  return useQuery({
    queryKey: ['foodlab', 'queue', projectId],
    queryFn: () => invoke<Sample[]>('module_query', {
      projectId, queryType: 'sample.today', payload: {},
    }),
    refetchInterval: 5_000,
  });
}

export function useSampleSearch(projectId: string, query: string) {
  return useQuery({
    queryKey: ['foodlab', 'search', projectId, query],
    queryFn: () => invoke<Sample[]>('module_query', {
      projectId, queryType: 'sample.search', payload: { query },
    }),
    enabled: !!query,
  });
}

export function useIntakeSample(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clientName: string; sampleType: string; collectedAt: string; notes?: string }) => {
      return await invoke<{ sample_id: string }>('module_command', {
        projectId,
        commandType: 'sample.intake',
        payload: {
          client_name: input.clientName,
          sample_type: input.sampleType,
          collected_at: input.collectedAt,
          notes: input.notes,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foodlab'] }),
  });
}

export function useStartTest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sampleId: string; testType: string; assignedTech: string }) => {
      return await invoke<{ test_id: string }>('module_command', {
        projectId,
        commandType: 'sample.start_test',
        payload: {
          sample_id: input.sampleId,
          test_type: input.testType,
          assigned_tech: input.assignedTech,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foodlab'] }),
  });
}

export function useRecordResult(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sampleId: string; testId: string; measurements: unknown; passed: boolean }) => {
      return await invoke('module_command', {
        projectId,
        commandType: 'sample.record_result',
        payload: {
          sample_id: input.sampleId,
          test_id: input.testId,
          measurements: input.measurements,
          passed: input.passed,
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foodlab'] }),
  });
}
