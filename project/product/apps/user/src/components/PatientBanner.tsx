interface PatientBannerProps { full_name: string; age: number; patient_id: string; allergies: string[]; chronic_conditions: string[]; blood_type?: string; last_visit_date?: string; }
export function PatientBanner(p: PatientBannerProps) {
  const hasAlerts = p.allergies.length > 0 || p.chronic_conditions.length > 0;
  return (
    <div className={`rounded p-4 mb-4 ${hasAlerts ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border'}`}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">{p.full_name}</h1><div className="text-sm text-gray-500">{p.age} years · {p.patient_id}{p.blood_type && ` · Blood type: ${p.blood_type}`}</div></div>
        {p.last_visit_date && <div className="text-sm text-gray-500">Last visit: {new Date(p.last_visit_date).toLocaleDateString()}</div>}
      </div>
      {hasAlerts && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.allergies.map((a) => <span key={a} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">? Allergy: {a}</span>)}
          {p.chronic_conditions.map((c) => <span key={c} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">?? {c}</span>)}
        </div>
      )}
    </div>
  );
}
