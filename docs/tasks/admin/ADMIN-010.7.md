# TASK ID: ADMIN-010.7
# TITLE: Add Backup page
# STATUS: pending
# DEPENDENCIES: ADMIN-010.6
# ALLOWED FILES: product/apps/admin/src/pages/Backup.tsx, product/apps/admin/src/hooks/useBackup.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the Backup page — list, create, restore.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useBackup.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

export interface BackupRecord {
  id: string;
  project_id: string;
  schema_version: number;
  database_sha256: string;
  encrypted_size_bytes: number;
  created_at: string;
  note: string | null;
}

export function useBackups(projectId: string | null) {
  return useQuery({
    queryKey: ['backups', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await invoke<BackupRecord[]>('list_backups', { projectId });
    },
    enabled: !!projectId,
  });
}

export function useCreateBackup(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { passphrase: string; note?: string }) => {
      return await invoke<string>('create_backup', {
        projectId,
        passphrase: input.passphrase,
        note: input.note ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backups', projectId] });
    },
  });
}
```

Create `product/apps/admin/src/pages/Backup.tsx`:

```typescript
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useBackups, useCreateBackup } from '../hooks/useBackup';

export function BackupPage() {
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const { data: backups } = useBackups(projectId ?? null);
  const createBackup = useCreateBackup(projectId ?? '');
  const [passphrase, setPassphrase] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Backups</h2>

      {projectId && (
        <div className="mb-4 p-4 bg-white rounded border">
          <h3 className="font-medium mb-2">Create backup</h3>
          <input
            type="password"
            placeholder="Backup passphrase (required)"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <button
            onClick={() => createBackup.mutate({ passphrase, note })}
            disabled={passphrase.length < 8}
            className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50"
          >
            Create & upload
          </button>
        </div>
      )}

      <div className="bg-white rounded border">
        {(backups ?? []).map((b) => (
          <div key={b.id} className="px-4 py-3 border-b last:border-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{b.created_at}</div>
              <div className="text-sm text-gray-500">
                v{b.schema_version} · {(b.encrypted_size_bytes / 1024 / 1024).toFixed(2)} MB · {b.note ?? 'no note'}
              </div>
              <div className="text-xs text-gray-400 font-mono mt-1">{b.database_sha256.slice(0, 16)}...</div>
            </div>
            <button
              onClick={() => {
                if (confirm('Restore? This will overwrite current project data.')) {
                  invoke('restore_backup', { projectId, backupId: b.id }).catch(console.error);
                }
              }}
              className="px-3 py-1 border rounded text-sm"
            >
              Restore
            </button>
          </div>
        ))}
        {backups?.length === 0 && (
          <div className="p-6 text-center text-gray-500">No backups yet</div>
        )}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Backup.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/hooks/useBackup.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
