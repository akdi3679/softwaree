# TASK ID: MEDICAL-002.5
# TITLE: Add medical Admin UI — Patient detail with appointment + visit timeline
# STATUS: pending
# DEPENDENCIES: MEDICAL-002.4
# ALLOWED FILES: product/apps/admin/src/pages/PatientDetail.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Patient detail page — full info, appointment history, visit timeline.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/PatientDetail.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export function PatientDetailPage() {
  const { projectId, patientId } = useParams({ strict: false }) as { projectId?: string; patientId?: string };
  const { data: patient } = useQuery({
    queryKey: ['medical', 'patient', patientId],
    queryFn: () => invoke<any>('module_query', {
      projectId, queryType: 'patient.get', payload: { patient_id: patientId },
    }),
  });
  const { data: appointments } = useQuery({
    queryKey: ['medical', 'patient', patientId, 'appointments'],
    queryFn: () => invoke<any[]>('module_query', {
      projectId, queryType: 'appointment.list_for_patient', payload: { patient_id: patientId, include_cancelled: true },
    }),
    enabled: !!patientId,
  });
  const { data: visits } = useQuery({
    queryKey: ['medical', 'patient', patientId, 'visits'],
    queryFn: () => invoke<any[]>('module_query', {
      projectId, queryType: 'visit.list_for_patient', payload: { patient_id: patientId },
    }),
    enabled: !!patientId,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{patient?.full_name ?? 'Loading...'}</h2>
        <div className="text-sm text-gray-500">{patient?.phone} · DOB {patient?.date_of_birth}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Section title="Appointments">
          {(appointments ?? []).map((a) => (
            <div key={a.appointment_id} className="py-2 border-b last:border-0">
              <div className="font-medium">{a.scheduled_for} · {a.duration_minutes}min</div>
              <div className="text-sm text-gray-500">{a.reason} · {a.status}</div>
            </div>
          ))}
          {appointments?.length === 0 && <div className="text-sm text-gray-500">No appointments</div>}
        </Section>
        <Section title="Visits">
          {(visits ?? []).map((v) => (
            <div key={v.visit_id} className="py-2 border-b last:border-0">
              <div className="font-medium">{v.started_at}</div>
              <div className="text-sm text-gray-500">{v.chief_complaint} · {v.status}</div>
            </div>
          ))}
          {visits?.length === 0 && <div className="text-sm text-gray-500">No visits</div>}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded border p-4">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
```

Wire into the router.

## TESTS

```bash
cd product
test -f apps/admin/src/pages/PatientDetail.tsx || { echo "FAIL"; exit 1; }
grep -q "PatientDetailPage" apps/admin/src/router.tsx || { echo "FAIL: not wired"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
