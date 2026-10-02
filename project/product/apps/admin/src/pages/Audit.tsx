import { useParams } from '@tanstack/react-router';
import { useAuditEntries } from '../hooks/useAudit';

export function AuditPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: entries } = useAuditEntries(projectId ?? null);
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Audit log</h2>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-2">Time</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Target</th><th className="px-4 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((e) => (
              <tr key={e.id} className="border-b">
                <td className="px-4 py-2 font-mono text-xs">{e.occurred_at}</td>
                <td className="px-4 py-2">{e.actor_user_id ?? '-'}</td>
                <td className="px-4 py-2 font-medium">{e.action}</td>
                <td className="px-4 py-2 text-gray-500">{e.target_type ? `${e.target_type}:${e.target_id ?? '?'}` : '-'}</td>
                <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${e.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{e.result}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
