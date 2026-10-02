import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Patient { patient_id: string; full_name: string; phone: string; date_of_birth: string; }

export function usePatients() { return useQuery({ queryKey: ['domain', 'patients'], queryFn: async () => await invoke<Patient[]>('query_domain', { aggregate: 'patient' }), refetchInterval: 5_000 }); }
export function useAppointments() { return useQuery({ queryKey: ['domain', 'appointments'], queryFn: async () => await invoke<any[]>('query_domain', { aggregate: 'appointment' }), refetchInterval: 5_000 }); }
export function useSamples() { return useQuery({ queryKey: ['domain', 'samples'], queryFn: async () => await invoke<any[]>('query_domain', { aggregate: 'sample' }), refetchInterval: 5_000 }); }
