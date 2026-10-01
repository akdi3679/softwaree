# TASK ID: PORTAL-002.2
# TITLE: Add customer portal — Team page
# STATUS: pending
# DEPENDENCIES: PORTAL-002.1
# ALLOWED FILES: platform-cloud/portal/src/pages/Team.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Team management page.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/portal/src/pages/Team.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface TeamMember {
  id: string;
  email: string;
  display_name: string;
  role: string;
  state: string;
  last_seen: string | null;
}

export function TeamPage() {
  const qc = useQueryClient();
  const { data: team } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const r = await invoke<{ team: TeamMember[] }>('list_team');
      return r.team;
    },
  });
  const invite = useMutation({
    mutationFn: async (input: { email: string; role: string }) => {
      return await invoke<{ token: string }>('invite_team_member', input);
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => await invoke('remove_team_member', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Team</h2>
      <div className="bg-white rounded border p-4 mb-4">
        <h3 className="font-medium mb-2">Invite member</h3>
        <InviteForm onInvite={invite.mutateAsync} />
      </div>
      <div className="bg-white rounded border">
        {(team ?? []).map((m) => (
          <div key={m.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{m.display_name}</div>
              <div className="text-sm text-gray-500">{m.email} · {m.role} · {m.state}</div>
            </div>
            <button onClick={() => remove.mutate(m.id)} className="px-3 py-1 text-sm text-red-600 border rounded">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteForm({ onInvite }: { onInvite: (input: { email: string; role: string }) => Promise<any> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [token, setToken] = useState<string | null>(null);
  return (
    <div>
      <div className="flex gap-2">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 border rounded">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="billing">Billing</option>
        </select>
        <button onClick={async () => {
          const r = await onInvite({ email, role });
          setToken(r.token);
          setEmail('');
        }} className="px-4 py-2 bg-primary-600 text-white rounded">Invite</button>
      </div>
      {token && <div className="mt-2 text-sm">Share this link: <code className="bg-gray-100 px-1">{token}</code></div>}
    </div>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f portal/src/pages/Team.tsx || { echo "FAIL"; exit 1; }
grep -q "TeamPage" portal/src/pages/Team.tsx || { echo "FAIL"; exit 1; }
echo "OK"
```
