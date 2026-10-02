import { useAppointments } from '../hooks/useDomain';
export function AppointmentsPage() {
  const { data: appts } = useAppointments();
  return <div className="p-6"><h2 className="text-2xl font-semibold mb-4">Appointments</h2><div className="bg-white rounded border">{(appts ?? []).map((a: any) => <div key={a.appointment_id} className="px-4 py-3 border-b last:border-0"><div className="font-medium">{a.scheduled_for} · {a.duration_minutes}min</div><div className="text-sm text-gray-500">{a.patient_id} · {a.reason} · {a.status}</div></div>)}{appts?.length === 0 && <div className="p-6 text-center text-gray-500">No appointments</div>}</div></div>;
}
