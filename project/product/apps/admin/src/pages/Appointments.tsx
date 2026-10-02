import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
}

export function AppointmentsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: appts } = useQuery({
    queryKey: ['medical', 'appointments', projectId, date],
    queryFn: async () => {
      return await invoke<Appointment[]>('module_query', {
        projectId, queryType: 'appointment.list_for_day', payload: { date },
      });
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Appointments</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-1 border rounded" />
      </div>
      <div className="space-y-2">
        {(appts ?? []).map((a) => (
          <div key={a.appointment_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.patient_id}</div>
              <div className="text-sm text-gray-500">{new Date(a.scheduled_at).toLocaleTimeString()} · {a.duration_min} min · {a.status}</div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              a.status === 'scheduled' ? 'bg-blue-100' :
              a.status === 'checked_in' ? 'bg-green-100' :
              a.status === 'completed' ? 'bg-gray-100' :
              a.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'
            }`}>{a.status}</span>
          </div>
        ))}
        {appts?.length === 0 && <div className="text-sm text-gray-500 text-center py-8">No appointments for {date}</div>}
      </div>
    </div>
  );
}
