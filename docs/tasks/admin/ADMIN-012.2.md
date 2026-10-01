# TASK ID: ADMIN-012.2
# TITLE: Add Admin Settings page
# STATUS: pending
# DEPENDENCIES: ADMIN-012.1
# ALLOWED FILES: product/apps/admin/src/pages/Settings.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a Settings page — device info, sync port, backup schedule, log level.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Settings.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function SettingsPage() {
  const [logLevel, setLogLevel] = useState('info');
  const [syncPort, setSyncPort] = useState(9420);
  const [metricsPort, setMetricsPort] = useState(9090);
  const [autoUpdate, setAutoUpdate] = useState(true);

  async function onSave() {
    try {
      await invoke('update_settings', { logLevel, syncPort, metricsPort, autoUpdate });
      alert('Settings saved');
    } catch (e) {
      alert(`Failed: ${e}`);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="bg-white rounded border p-4 space-y-4">
        <Field label="Log level">
          <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)} className="px-3 py-2 border rounded">
            <option value="trace">Trace</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </Field>
        <Field label="Sync port (Users connect here)">
          <input type="number" value={syncPort} onChange={(e) => setSyncPort(Number(e.target.value))}
            className="px-3 py-2 border rounded w-32" />
        </Field>
        <Field label="Metrics port (Prometheus)">
          <input type="number" value={metricsPort} onChange={(e) => setMetricsPort(Number(e.target.value))}
            className="px-3 py-2 border rounded w-32" />
        </Field>
        <Field label="Auto-update">
          <input type="checkbox" checked={autoUpdate} onChange={(e) => setAutoUpdate(e.target.checked)} />
        </Field>
        <button onClick={onSave} className="px-4 py-2 bg-primary-600 text-white rounded">
          Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-64 text-sm font-medium">{label}</div>
      <div>{children}</div>
    </div>
  );
}
```

Add a stub Tauri command `update_settings` in `product/apps/admin/src-tauri/src/commands/settings.rs`:

```rust
use serde::Deserialize;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub log_level: String,
    pub sync_port: u16,
    pub metrics_port: u16,
    pub auto_update: bool,
}

#[tauri::command]
pub async fn update_settings(state: State<'_, AppState>, settings: Settings) -> AppResult<()> {
    // Persist to a config file
    let config_path = state.paths.data_dir.join("settings.json");
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| crate::error::AppError::Internal(e.to_string()))?;
    tokio::fs::write(&config_path, json).await?;
    Ok(())
}
```

Wire into `lib.rs`.

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Settings.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/src/commands/settings.rs || { echo "FAIL: no command"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
