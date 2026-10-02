import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Vaccination {
  vaccination_id: string;
  vaccine: string;
  dose_number: number;
  lot_number: string;
  administered_at: string;
  site: string;
  next_due: string | null;
}

export function PatientVaccinationsPage() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('projectId') ?? '';
  const patientId = params.get('patientId') ?? '';
  const { data: vacs } = useQuery({
    queryKey: ['medical', 'vaccinations', projectId, patientId],
    queryFn: () => invoke<Vaccination[]>('module_query', {
      projectId, queryType: 'vaccination.list', payload: { patient_id: patientId },
    }),
    enabled: !!patientId,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Vaccination history</h2>
      <div className="bg-white rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2">Vaccine</th>
              <th>Dose</th>
              <th>Date</th>
              <th>Lot</th>
              <th>Site</th>
              <th>Next due</th>
            </tr>
          </thead>
          <tbody>
            {(vacs ?? []).map((v) => (
              <tr key={v.vaccination_id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{v.vaccine}</td>
                <td>{v.dose_number}</td>
                <td>{new Date(v.administered_at).toLocaleDateString()}</td>
                <td className="font-mono text-xs">{v.lot_number}</td>
                <td className="text-xs">{v.site}</td>
                <td className="text-xs">{v.next_due ? new Date(v.next_due).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {(vacs ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">No vaccinations</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
