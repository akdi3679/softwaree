# TASK ID: ADMIN-085.1
# TITLE: Add Admin: full settings panel
# STATUS: pending
# DEPENDENCIES: ADMIN-084.2
# ALLOWED FILES: product/apps/admin/src/pages/Settings.tsx
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Single Settings page with tabs: Account, Project, Security, Modules, Backups, Data, Legal.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Settings.tsx`:

```typescript
import { useState } from 'react';
import { Link } from '@tanstack/react-router';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'project', label: 'Project' },
  { id: 'security', label: 'Security' },
  { id: 'modules', label: 'Modules' },
  { id: 'backups', label: 'Backups' },
  { id: 'data', label: 'Data' },
  { id: 'legal', label: 'Legal' },
] as const;

export function SettingsPage() {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('account');
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="flex gap-2 border-b mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 text-sm ${tab === t.id ? 'border-b-2 border-primary-600 font-medium' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        {tab === 'account' && <p><Link to="/settings/profile" className="text-primary-600">Profile</Link> · <Link to="/settings/billing" className="text-primary-600">Billing</Link></p>}
        {tab === 'project' && <p>Project name, default module, default language.</p>}
        {tab === 'security' && <p><Link to="/settings/2fa" className="text-primary-600">Two-factor</Link> · <Link to="/settings/devices" className="text-primary-600">Devices</Link> · <Link to="/settings/telemetry" className="text-primary-600">Telemetry</Link></p>}
        {tab === 'modules' && <p><Link to="/modules" className="text-primary-600">Installed modules</Link> · <Link to="/modules/browse" className="text-primary-600">Browse marketplace</Link> · <Link to="/modules/install" className="text-primary-600">Install from manifest</Link></p>}
        {tab === 'backups' && <p><Link to="/backups" className="text-primary-600">Backup history</Link></p>}
        {tab === 'data' && <p><Link to="/data-export" className="text-primary-600">Export data</Link> · <Link to="/data-quality" className="text-primary-600">Data quality</Link> · <Link to="/schema" className="text-primary-600">Schema viewer</Link></p>}
        {tab === 'legal' && <p><Link to="/legal" className="text-primary-600">Legal</Link> · <Link to="/release-notes" className="text-primary-600">What's new</Link></p>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Settings.tsx || { echo "FAIL"; exit 1; }
grep -q "SettingsPage" apps/admin/src/pages/Settings.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
