# TASK ID: MEDICAL-002.4
# TITLE: Add medical Admin UI — Patients page
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.3
# ALLOWED FILES: product/apps/admin/src/pages/Patients.tsx, product/apps/admin/src/hooks/usePatients.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add a Patients page in the Admin UI: list, search, create, view detail.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/usePatients.ts`:

```typescript
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
      return await invoke<Patient[]>(search ? 'module_query' : 'module_query', {
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
```

Create `product/apps/admin/src/pages/Patients.tsx`:

```typescript
import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { usePatients, useCreatePatient } from '../hooks/usePatients';

export function PatientsPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const [search, setSearch] = useState('');
  const { data: patients } = usePatients(projectId ?? '', search);
  const createPatient = useCreatePatient(projectId ?? '');
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newPatient, setNewPatient] = useState({ fullName: '', phone: '', dateOfBirth: '' });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Patients</h2>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary-600 text-white rounded">
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
              className="px-3 py-1 bg-primary-600 text-white rounded"
            >
              Create
            </button>
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
            <button
              onClick={() => navigate({ to: '/projects/$projectId/patients/$patientId', params: { projectId: projectId!, patientId: p.patient_id } })}
              className="px-3 py-1 border rounded text-sm"
            >
              View
            </button>
          </div>
        ))}
        {patients?.length === 0 && (
          <div className="p-6 text-center text-gray-500">No patients</div>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Patients.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/hooks/usePatients.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
