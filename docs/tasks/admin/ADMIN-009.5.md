# TASK ID: ADMIN-009.5
# TITLE: Add Users page
# STATUS: pending
# DEPENDENCIES: ADMIN-009.4
# ALLOWED FILES: product/apps/admin/src/pages/Users.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the Users page — list, invite, change role.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Users.tsx`:

```typescript
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useUsers, useRoles, useInviteUser, useChangeUserRole } from '../hooks/useUsers';

export function UsersPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: users } = useUsers(projectId ?? null);
  const { data: roles } = useRoles(projectId ?? null);
  const inviteUser = useInviteUser(projectId ?? '');
  const changeRole = useChangeUserRole(projectId ?? '');
  const [email, setEmail] = useState('');
  const [initialRole, setInitialRole] = useState('receptionist');
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Users</h2>

      {projectId && (
        <div className="mb-4 p-4 bg-white rounded border">
          <h3 className="font-medium mb-2">Invite user</h3>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <select
              value={initialRole}
              onChange={(e) => setInitialRole(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              {(roles ?? []).map((r) => (
                <option key={r.id} value={r.name}>{r.display_name}</option>
              ))}
            </select>
            <button
              onClick={async () => {
                const result = await inviteUser.mutateAsync({ email, initialRole });
                setLastInviteToken(result.token);
                setEmail('');
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded"
            >
              Invite
            </button>
          </div>
          {lastInviteToken && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              Invitation created. Share this token with the invitee (one-time view):
              <code className="block mt-1 break-all font-mono text-xs">{lastInviteToken}</code>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded border">
        {(users ?? []).map((u) => (
          <div key={u.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{u.display_name}</div>
              <div className="text-sm text-gray-500">{u.email} · {u.state}</div>
            </div>
            <select
              onChange={async (e) => {
                await changeRole.mutateAsync({ userId: u.id, newRole: e.target.value });
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              {(roles ?? []).map((r) => (
                <option key={r.id} value={r.name}>{r.display_name}</option>
              ))}
            </select>
          </div>
        ))}
        {users?.length === 0 && (
          <div className="p-6 text-center text-gray-500">No users yet.</div>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Users.tsx || { echo "FAIL"; exit 1; }
grep -q "useInviteUser" apps/admin/src/pages/Users.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
