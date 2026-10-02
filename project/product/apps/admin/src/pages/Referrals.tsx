import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Referral {
  referral_id: string;
  patient_id: string;
  specialist: string;
  urgency: string;
  reason: string;
  status: string;
  created_at: string;
}

const URGENCY_COLORS: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-800',
  routine: 'bg-blue-100 text-blue-800',
};

export function ReferralsPage() {
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
 
  const { data: refs } = useQuery({
    queryKey: ['medical', 'referrals', projectId],
    queryFn: () => invoke<Referral[]>('module_query', {
      projectId, queryType: 'referral.list', payload: {},
    }),
    refetchInterval: 5_000,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Referrals</h2>
      <div className="space-y-2">
        {(refs ?? []).map((r) => (
          <div key={r.referral_id} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.patient_id} → {r.specialist}</div>
              <div className="text-sm text-gray-500">{r.reason} · {r.created_at} · {r.status}</div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${URGENCY_COLORS[r.urgency]}`}>{r.urgency}</span>
          </div>
        ))}
        {(refs ?? []).length === 0 && (
          <div className="bg-white rounded border p-6 text-center text-gray-500">No referrals</div>
        )}
      </div>
    </div>
  );
}
