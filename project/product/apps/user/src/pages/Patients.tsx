import { usePatients } from '../hooks/useDomain';
export function PatientsPage() {
  const { data: patients } = usePatients();
  return <div className="p-6"><h2 className="text-2xl font-semibold mb-4">Patients</h2><div className="bg-white rounded border">{(patients ?? []).map((p: any) => <div key={p.patient_id} className="px-4 py-3 border-b last:border-0"><div className="font-medium">{p.full_name}</div><div className="text-sm text-gray-500">{p.phone} · DOB {p.date_of_birth}</div></div>)}{patients?.length === 0 && <div className="p-6 text-center text-gray-500">No patients</div>}</div></div>;
}
