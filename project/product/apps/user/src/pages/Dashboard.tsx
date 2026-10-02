import { useUsers, useAudit, useSyncNow } from '../hooks/useProjection';

export function DashboardPage() {
  const { data: users } = useUsers();
  const { data: audit } = useAudit();
  const sync = useSyncNow();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Project</h2>
        <button onClick={() => sync.mutate()} className="px-3 py-1 border rounded text-sm">Sync now</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Users" value={String(users?.length ?? 0)} />
        <Stat label="Audit entries" value={String(audit?.length ?? 0)} />
        <Stat label="Last sync" value="just now" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Panel title="Users">{(users ?? []).slice(0, 20).map((u) => <div key={u.id} className="py-2 border-b last:border-0"><div className="font-medium">{u.display_name}</div><div className="text-sm text-gray-500">{u.email} · {u.state}</div></div>)}{users?.length === 0 && <div className="text-sm text-gray-500 p-4">No data yet — wait for sync</div>}</Panel>
        <Panel title="Audit log">{(audit ?? []).slice(0, 20).map((e) => <div key={e.id} className="py-2 border-b last:border-0 text-sm"><div className="flex items-center justify-between"><span className="font-medium">{e.action}</span><span className={`px-2 py-0.5 rounded text-xs ${e.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{e.result}</span></div><div className="text-gray-500 text-xs">{e.occurred_at} · {e.actor_user_id ?? '-'}</div></div>)}{audit?.length === 0 && <div className="text-sm text-gray-500 p-4">No audit entries</div>}</Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="bg-white rounded border p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-semibold">{value}</div></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="bg-white rounded border p-4"><h3 className="font-medium mb-2">{title}</h3>{children}</div>; }
