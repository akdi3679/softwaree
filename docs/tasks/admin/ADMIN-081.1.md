# TASK ID: ADMIN-081.1
# TITLE: Add Admin: read-only public API key management
# STATUS: pending
# DEPENDENCIES: ADMIN-080.2
# ALLOWED FILES: product/apps/admin/src/pages/ApiKeys.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Generate scoped API keys (read-only, by aggregate_type).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/ApiKeys.tsx`:

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Key { id: string; name: string; scopes: string[]; created_at: string; last_used: string | null; }

export function ApiKeysPage() {
  const qc = useQueryClient();
  const { data: keys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => await invoke<Key[]>('list_api_keys'),
  });
  const create = useMutation({
    mutationFn: async (input: { name: string; scopes: string[] }) =>
      await invoke<{ key_id: string; secret: string }>('create_api_key', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => invoke('revoke_api_key', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['patient.read']);
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">API keys</h2>
      <p className="text-sm text-gray-500 mb-4">Scoped keys for integrations. Read-only keys are safe to share. The secret is shown only once.</p>
      <div className="bg-white rounded border p-4 mb-4">
        <h3 className="font-medium mb-2">Create new</h3>
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g., 'Zapier integration')" className="w-full px-3 py-2 border rounded" />
          <input value={scopes.join(',')} onChange={(e) => setScopes(e.target.value.split(',').map((s) => s.trim()))} placeholder="Scopes (comma-separated)" className="w-full px-3 py-2 border rounded" />
          <button onClick={() => create.mutate({ name, scopes })} disabled={!name} className="px-4 py-2 bg-primary-600 text-white rounded">Create</button>
        </div>
        {create.data && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <div className="font-medium">Save this secret now — it won't be shown again:</div>
            <code className="block bg-white p-2 mt-1 break-all">{create.data.secret}</code>
          </div>
        )}
      </div>
      <div className="bg-white rounded border">
        {(keys ?? []).map((k) => (
          <div key={k.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{k.name}</div>
              <div className="text-xs text-gray-500">{k.scopes.join(', ')} · created {k.created_at}</div>
            </div>
            <button onClick={() => revoke.mutate(k.id)} className="text-sm text-red-600">Revoke</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/ApiKeys.tsx || { echo "FAIL"; exit 1; }
grep -q "ApiKeysPage" apps/admin/src/pages/ApiKeys.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
