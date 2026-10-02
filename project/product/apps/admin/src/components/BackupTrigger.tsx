import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

interface Progress { stage: string; percent: number }

export function BackupTrigger({ projectId }: { projectId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    listen<Progress>('backup-progress', (e) => setProgress(e.payload)).then((fn) => {
      unlisten = fn;
    });
    return () => { unlisten?.(); };
  }, []);

  async function trigger() {
    setProgress({ stage: 'starting', percent: 0 });
    setLastError(null);
    try {
      await invoke<{ backup_id: string; duration_ms: number }>('trigger_backup', { projectId });
      setProgress({ stage: 'done', percent: 100 });
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
      setProgress(null);
    }
  }

  const running = progress !== null && progress.stage !== 'done';

  return (
    <div className="bg-white rounded border p-4">
      <h3 className="font-medium mb-2">Manual backup</h3>
      <p className="text-sm text-gray-500 mb-3">
        Creates a backup of the project data, encrypts it, and uploads to Cloud.
      </p>
      <button
        onClick={trigger}
        disabled={running}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {running ? 'Backing up...' : 'Backup now'}
      </button>
      {running && progress && (
        <div className="mt-3">
          <div className="text-sm text-gray-500">{progress.stage}</div>
          <div className="w-full bg-gray-200 rounded mt-1 h-2">
            <div className="bg-blue-600 h-2 rounded" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}
      {lastError && <div className="mt-3 text-sm text-red-600">Backup failed: {lastError}</div>}
    </div>
  );
}
