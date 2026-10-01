# TASK ID: ADMIN-017.1
# TITLE: Add Admin: printable patient summary (printable view)
# STATUS: pending
# DEPENDENCIES: BILLING-002.2
# ALLOWED FILES: product/apps/admin/src/pages/PatientPrint.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Print-optimized view of a patient summary for handing to patient.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/PatientPrint.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

interface PatientFull {
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  blood_type?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  visit_count: number;
  last_visit_date?: string;
  vaccinations: { vaccine: string; dose: number; date: string }[];
}

export function PatientPrintPage() {
  const { projectId, patientId } = useParams({ strict: false }) as { projectId?: string; patientId?: string };
  const { data: p } = useQuery({
    queryKey: ['medical', 'patient-print', projectId, patientId],
    queryFn: async () => {
      return await invoke<PatientFull>('module_query', {
        projectId, queryType: 'patient.get_full', payload: { patient_id: patientId },
      });
    },
  });
  // Auto-print when loaded
  useEffect(() => {
    if (p) {
      setTimeout(() => window.print(), 500);
    }
  }, [p]);

  if (!p) return <div>Loading…</div>;
  return (
    <div className="p-8 max-w-2xl mx-auto print:p-4">
      <h1 className="text-2xl font-bold mb-4">Patient Summary</h1>
      <table className="w-full text-sm mb-6">
        <tbody>
          <tr><td className="font-medium py-1">Name:</td><td className="py-1">{p.full_name}</td></tr>
          <tr><td className="font-medium py-1">Patient ID:</td><td className="py-1">{p.patient_id}</td></tr>
          <tr><td className="font-medium py-1">DOB:</td><td className="py-1">{p.date_of_birth}</td></tr>
          <tr><td className="font-medium py-1">Phone:</td><td className="py-1">{p.phone}</td></tr>
          <tr><td className="font-medium py-1">Email:</td><td className="py-1">{p.email}</td></tr>
          {p.blood_type && <tr><td className="font-medium py-1">Blood type:</td><td className="py-1">{p.blood_type}</td></tr>}
        </tbody>
      </table>

      <Section title="Allergies">{p.allergies.length > 0 ? p.allergies.join(', ') : 'No known allergies'}</Section>
      <Section title="Chronic conditions">{p.chronic_conditions.length > 0 ? p.chronic_conditions.join(', ') : 'None'}</Section>
      <Section title="Current medications">{p.current_medications.length > 0 ? p.current_medications.join(', ') : 'None'}</Section>

      <h2 className="font-semibold mt-6 mb-2">Vaccination history</h2>
      <ul className="text-sm">
        {p.vaccinations.map((v, i) => <li key={i}>{v.vaccine} (dose {v.dose}) — {v.date}</li>)}
        {p.vaccinations.length === 0 && <li>No vaccinations recorded</li>}
      </ul>

      <div className="text-xs text-gray-500 mt-8">Printed on {new Date().toLocaleString()}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h2 className="font-semibold mb-1">{title}</h2>
      <div className="text-sm">{children}</div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/PatientPrint.tsx || { echo "FAIL"; exit 1; }
grep -q "PatientPrintPage" apps/admin/src/pages/PatientPrint.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
