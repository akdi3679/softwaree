# TASK ID: BACKUP-005.2
# TITLE: Add backup — manual trigger from UI
# STATUS: pending
# DEPENDENCIES: BACKUP-005.1
# ALLOWED FILES: product/apps/admin/src/components/BackupTrigger.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can click "Backup now" and see progress.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/BackupTrigger.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export function BackupTrigger({ projectId }: { projectId: string }) {
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [unlisten, setUnlisten] = useState<UnlistenFn | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    listen<{ stage: string; percent: number }>('backup-progress', (e) => {
      setProgress(e.payload);
    }).then(setUnlisten);
    return () => { unlisten?.(); };
  }, [unlisten]);

  async function trigger() {
    setProgress({ stage: 'starting', percent: 0 });
    setLastError(null);
    try {
      const result = await invoke<{ backup_id: string; size_bytes: number; duration_ms: number }>('trigger_backup', { projectId });
      setProgress({ stage: 'done', percent: 100 });
      // Could navigate to backup history
      console.log('Backup complete:', result);
    } catch (e: any) {
      setLastError(e.message ?? 'unknown error');
      setProgress(null);
    }
  }

  return (
    <div className="bg-white rounded border p-4">
      <h3 className="font-medium mb-2">Manual backup</h3>
      <p className="text-sm text-gray-500 mb-3">Creates a backup of the project data, encrypts it, and uploads to Cloud. May take a few minutes for large projects.</p>
      <button onClick={trigger} disabled={progress?.stage !== 'done' && progress?.stage !== undefined && progress?.stage !== 'failed'} className="px-4 py-2 bg-primary-600 text-white rounded">
        {progress && progress.stage !== 'done' ? 'Backing up…' : 'Backup now'}
      </button>
      {progress && progress.stage !== 'done' && (
        <div className="mt-3">
          <div className="text-sm text-gray-500">{progress.stage}</div>
          <div className="w-full bg-gray-200 rounded mt-1 h-2">
            <div className="bg-primary-600 h-2 rounded" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}
      {lastError && <div className="mt-3 text-sm text-red-600">Backup failed: {lastError}</div>}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/BackupTrigger.tsx || { echo "FAIL"; exit 1; }
grep -q "BackupTrigger" apps/admin/src/components/BackupTrigger.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
