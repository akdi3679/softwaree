# TASK ID: USER-005.4
# TITLE: Add User domain pages (Patients, Appointments, Samples)
# STATUS: pending
# DEPENDENCIES: USER-005.3
# ALLOWED FILES: product/apps/user/src/pages/Patients.tsx, product/apps/user/src/pages/Appointments.tsx, product/apps/user/src/pages/Samples.tsx, product/apps/user/src/hooks/useDomain.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add domain pages for the medical and food-lab modules.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/hooks/useDomain.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface Patient {
  patient_id: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
}

export function usePatients() {
  return useQuery({
    queryKey: ['domain', 'patients'],
    queryFn: async () => {
      return await invoke<Patient[]>('query_domain', { aggregate: 'patient' });
    },
    refetchInterval: 5_000,
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: ['domain', 'appointments'],
    queryFn: async () => {
      return await invoke<any[]>('query_domain', { aggregate: 'appointment' });
    },
    refetchInterval: 5_000,
  });
}

export function useSamples() {
  return useQuery({
    queryKey: ['domain', 'samples'],
    queryFn: async () => {
      return await invoke<any[]>('query_domain', { aggregate: 'sample' });
    },
    refetchInterval: 5_000,
  });
}
```

Add the Tauri command in `apps/user/src-tauri/src/commands/data.rs`:

```rust
#[tauri::command]
pub async fn query_domain(state: State<'_, AppState>, aggregate: String) -> AppResult<Vec<serde_json::Value>> {
    let proj = state.active_projection.read().await;
    let proj = proj.as_ref().ok_or_else(|| AppError::NotFound("no active projection".into()))?;

    // Map aggregate to a projection table
    let table = match aggregate.as_str() {
        "patient" => "projection_patients",
        "appointment" => "projection_appointments",
        "sample" => "projection_samples",
        "visit" => "projection_visits",
        _ => return Err(AppError::Validation(format!("unknown aggregate: {aggregate}"))),
    };

    // Query all columns as JSON
    let rows: Vec<(String,)> = sqlx::query_as(&format!(
        "SELECT json_object('aggregate', ?, 'data', json_group_object(key, value)) FROM {}",
        table
    ))
    .bind(&aggregate)
    .fetch_all(&proj.pool)
    .await
    .unwrap_or_default();

    Ok(rows.into_iter().map(|(s,)| serde_json::from_str(&s).unwrap_or(serde_json::Value::Null)).collect())
}
```

Create `product/apps/user/src/pages/Patients.tsx`:

```typescript
import { usePatients } from '../hooks/useDomain';

export function PatientsPage() {
  const { data: patients } = usePatients();
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Patients</h2>
      <div className="bg-white rounded border">
        {(patients ?? []).map((p: any) => (
          <div key={p.patient_id} className="px-4 py-3 border-b last:border-0">
            <div className="font-medium">{p.full_name}</div>
            <div className="text-sm text-gray-500">{p.phone} · DOB {p.date_of_birth}</div>
          </div>
        ))}
        {patients?.length === 0 && <div className="p-6 text-center text-gray-500">No patients</div>}
      </div>
    </div>
  );
}
```

Create `product/apps/user/src/pages/Appointments.tsx`:

```typescript
import { useAppointments } from '../hooks/useDomain';

export function AppointmentsPage() {
  const { data: appts } = useAppointments();
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Appointments</h2>
      <div className="bg-white rounded border">
        {(appts ?? []).map((a: any) => (
          <div key={a.appointment_id} className="px-4 py-3 border-b last:border-0">
            <div className="font-medium">{a.scheduled_for} · {a.duration_minutes}min</div>
            <div className="text-sm text-gray-500">{a.patient_id} · {a.reason} · {a.status}</div>
          </div>
        ))}
        {appts?.length === 0 && <div className="p-6 text-center text-gray-500">No appointments</div>}
      </div>
    </div>
  );
}
```

Create `product/apps/user/src/pages/Samples.tsx`:

```typescript
import { useSamples } from '../hooks/useDomain';

export function SamplesPage() {
  const { data: samples } = useSamples();
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Samples</h2>
      <div className="bg-white rounded border">
        {(samples ?? []).map((s: any) => (
          <div key={s.sample_id} className="px-4 py-3 border-b last:border-0">
            <div className="font-medium">{s.sample_id}</div>
            <div className="text-sm text-gray-500">{s.sample_type} · {s.client_name} · {s.status}</div>
          </div>
        ))}
        {samples?.length === 0 && <div className="p-6 text-center text-gray-500">No samples</div>}
      </div>
    </div>
  );
}
```

Update `apps/user/src/router.tsx` to add the new routes.

## TESTS

```bash
cd product
test -f apps/user/src/pages/Patients.tsx || { echo "FAIL"; exit 1; }
test -f apps/user/src/pages/Appointments.tsx || { echo "FAIL: no appts"; exit 1; }
test -f apps/user/src/pages/Samples.tsx || { echo "FAIL: no samples"; exit 1; }
test -f apps/user/src/hooks/useDomain.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
