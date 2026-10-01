# TASK ID: ADMIN-037.1
# TITLE: Add Admin: telemetry opt-in/out
# STATUS: pending
# DEPENDENCIES: CONTRACT-086.2
# ALLOWED FILES: product/apps/admin/src/pages/TelemetrySettings.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can opt out of anonymous usage analytics.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/TelemetrySettings.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function TelemetrySettingsPage() {
  const [analytics, setAnalytics] = useState(true);
  const [crash, setCrash] = useState(true);
  const [saved, setSaved] = useState(false);
  async function save() {
    await invoke('set_telemetry', { analytics, crashReports: crash });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Telemetry</h2>
      <p className="text-sm text-gray-500 mb-6">Help us improve Product by sharing anonymous usage data. You can opt out at any time.</p>
      <div className="bg-white rounded border p-4 space-y-3">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
          <div>
            <div className="font-medium">Anonymous usage analytics</div>
            <div className="text-sm text-gray-500">Which features you use, how often. No business data, no PII.</div>
          </div>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={crash} onChange={(e) => setCrash(e.target.checked)} className="mt-1" />
          <div>
            <div className="font-medium">Crash reports</div>
            <div className="text-sm text-gray-500">Stack traces and app version when something breaks. No PII.</div>
          </div>
        </label>
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded">Save preferences</button>
        {saved && <div className="text-sm text-green-600">Saved!</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/TelemetrySettings.tsx || { echo "FAIL"; exit 1; }
grep -q "TelemetrySettingsPage" apps/admin/src/pages/TelemetrySettings.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
