# TASK ID: USER-021.1
# TITLE: Add User: read-only patient banner (key info at top)
# STATUS: pending
# DEPENDENCIES: ARCH-015.2
# ALLOWED FILES: product/apps/user/src/components/PatientBanner.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
At top of every patient page, show key info + critical alerts (allergies, conditions).

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/PatientBanner.tsx`:

```typescript
interface PatientBannerProps {
  full_name: string;
  age: number;
  patient_id: string;
  allergies: string[];
  chronic_conditions: string[];
  blood_type?: string;
  last_visit_date?: string;
}

export function PatientBanner(p: PatientBannerProps) {
  const hasAlerts = p.allergies.length > 0 || p.chronic_conditions.length > 0;
  return (
    <div className={`rounded p-4 mb-4 ${hasAlerts ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{p.full_name}</h1>
          <div className="text-sm text-gray-500">
            {p.age} years · {p.patient_id}
            {p.blood_type && ` · Blood type: ${p.blood_type}`}
          </div>
        </div>
        {p.last_visit_date && <div className="text-sm text-gray-500">Last visit: {new Date(p.last_visit_date).toLocaleDateString()}</div>}
      </div>
      {hasAlerts && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.allergies.map((a) => (
            <span key={a} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">⚠ Allergy: {a}</span>
          ))}
          {p.chronic_conditions.map((c) => (
            <span key={c} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">📋 {c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/components/PatientBanner.tsx || { echo "FAIL"; exit 1; }
grep -q "PatientBanner" apps/user/src/components/PatientBanner.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
