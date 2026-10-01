# TASK ID: MEDICAL-006.2
# TITLE: Add medical Admin UI — Patient vaccinations view
# STATUS: pending
# DEPENDENCIES: MEDICAL-006.1
# ALLOWED FILES: product/apps/admin/src/pages/PatientVaccinations.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Show a patient's vaccination history.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/PatientVaccinations.tsx`:

```typescript
import { useParams } from '@tanstack/react-router';
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
  const { projectId, patientId } = useParams({ strict: false }) as { projectId?: string; patientId?: string };
  const { data: vacs } = useQuery({
    queryKey: ['medical', 'vaccinations', projectId, patientId],
    queryFn: async () => {
      return await invoke<Vaccination[]>('module_query', {
        projectId, queryType: 'vaccination.list', payload: { patient_id: patientId },
      });
    },
  });
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Vaccination history</h2>
      <div className="bg-white rounded border">
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
            {vacs?.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">No vaccinations</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/PatientVaccinations.tsx || { echo "FAIL"; exit 1; }
grep -q "PatientVaccinationsPage" apps/admin/src/pages/PatientVaccinations.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
