# TASK ID: ADMIN-032.1
# TITLE: Add Admin: data export UI for users (cloud)
# STATUS: pending
# DEPENDENCIES: CLOUD-016.2
# ALLOWED FILES: product/apps/admin/src/pages/DataExport.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer triggers and downloads their own data export from the Admin.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/DataExport.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

export function DataExportPage() {
  const [busy, setBusy] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);

  async function runExport() {
    setBusy(true);
    try {
      const out = await save({
        defaultPath: `product-export-${new Date().toISOString().slice(0, 10)}.zip`,
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      });
      if (!out) { setBusy(false); return; }
      const size = await invoke<number>('gdpr_export', { projectId: 'current', outputPath: out });
      setLastFile(`${out} (${(size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Export data</h2>
      <p className="text-sm text-gray-500 mb-4">Download all data for the current project as a ZIP file. This includes all events, modules, and attachments.</p>
      <button onClick={runExport} disabled={busy} className="px-4 py-2 bg-primary-600 text-white rounded">
        {busy ? 'Exporting…' : 'Export now'}
      </button>
      {lastFile && <div className="mt-3 text-sm text-green-600">Saved to: {lastFile}</div>}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/DataExport.tsx || { echo "FAIL"; exit 1; }
grep -q "DataExport" apps/admin/src/pages/DataExport.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
