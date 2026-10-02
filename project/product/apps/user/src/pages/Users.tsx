import { useUsers } from '../hooks/useProjection';

export function UsersPage() {
  const { data: users } = useUsers();
  return <div className="p-6"><h2 className="text-2xl font-semibold mb-4">Users</h2><div className="bg-white rounded border">{(users ?? []).map((u) => <div key={u.id} className="px-4 py-3 border-b last:border-0"><div className="font-medium">{u.display_name}</div><div className="text-sm text-gray-500">{u.email} · {u.state}</div></div>)}</div></div>;
}
