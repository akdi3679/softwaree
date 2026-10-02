import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface MedicalKpis {
  patients_total: number;
  patients_this_month: number;
  visits_total: number;
  visits_this_month: number;
  avg_wait_minutes: number;
  no_show_rate: number;
  active_prescriptions: number;
}

export function AnalyticsMedicalPage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const { data: k } = useQuery({
    queryKey: ['medical', 'kpis', projectId],
    queryFn: () => invoke<MedicalKpis>('medical_kpis', { projectId }),
    refetchInterval: 60_000,
  });
  if (!k) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Medical KPIs</h2>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Patients (total)" value={k.patients_total} />
        <Kpi label="Patients (30d)" value={k.patients_this_month} />
        <Kpi label="Visits (total)" value={k.visits_total} />
        <Kpi label="Visits (30d)" value={k.visits_this_month} />
        <Kpi label="Avg wait (min)" value={k.avg_wait_minutes.toFixed(1)} />
        <Kpi label="No-show rate" value={(k.no_show_rate * 100).toFixed(1) + '%'} />
        <Kpi label="Prescriptions" value={k.active_prescriptions} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}
