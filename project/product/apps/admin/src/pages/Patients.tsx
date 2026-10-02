import { useState } from 'react';
import { usePatients, useCreatePatient } from '../hooks/usePatients';

export function PatientsPage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  const [search, setSearch] = useState('');
  const { data: patients } = usePatients(projectId, search);
  const createPatient = useCreatePatient(projectId);
  const [showCreate, setShowCreate] = useState(false);
  const [newPatient, setNewPatient] = useState({ fullName: '', phone: '', dateOfBirth: '' });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Patients</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded">
          New patient
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      {showCreate && (
        <div className="mb-4 p-4 bg-white rounded border">
          <h3 className="font-medium mb-2">New patient</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Full name" value={newPatient.fullName}
              onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
              className="px-3 py-2 border rounded" />
            <input type="text" placeholder="Phone" value={newPatient.phone}
              onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
              className="px-3 py-2 border rounded" />
            <input type="date" value={newPatient.dateOfBirth}
              onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
              className="px-3 py-2 border rounded col-span-2" />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                await createPatient.mutateAsync(newPatient);
                setNewPatient({ fullName: '', phone: '', dateOfBirth: '' });
                setShowCreate(false);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >Create</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 border rounded">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded border">
        {(patients ?? []).map((p) => (
          <div key={p.patient_id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between hover:bg-gray-50">
            <div>
              <div className="font-medium">{p.full_name}</div>
              <div className="text-sm text-gray-500">{p.phone} · DOB {p.date_of_birth} · {p.patient_id}</div>
            </div>
          </div>
        ))}
        {(patients ?? []).length === 0 && (
          <div className="p-6 text-center text-gray-500">No patients</div>
        )}
      </div>
    </div>
  );
}
