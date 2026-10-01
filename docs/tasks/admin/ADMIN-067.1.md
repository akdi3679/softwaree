# TASK ID: ADMIN-067.1
# TITLE: Add Admin: complete legal pages (ToS, Privacy, License)
# STATUS: pending
# DEPENDENCIES: ARCH-022.2
# ALLOWED FILES: product/apps/admin/src/pages/Legal.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
In-app legal pages (link out to hosted ones).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/Legal.tsx`:

```typescript
import { useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';

const TABS = [
  { id: 'tos', label: 'Terms of Service', url: 'https://example.com/legal/tos' },
  { id: 'privacy', label: 'Privacy Policy', url: 'https://example.com/legal/privacy' },
  { id: 'dpa', label: 'Data Processing Addendum', url: 'https://example.com/legal/dpa' },
  { id: 'license', label: 'License', url: 'https://example.com/legal/license' },
  { id: 'subprocessors', label: 'Sub-processors', url: 'https://example.com/legal/subprocessors' },
];

export function LegalPage() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4">Legal</h2>
      <div className="flex gap-2 border-b mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`px-3 py-2 text-sm ${active === t.id ? 'border-b-2 border-primary-600 font-medium' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded border p-4">
        <p className="text-sm text-gray-500">The latest version is always at:</p>
        <code className="block bg-gray-50 p-2 text-xs my-2 break-all">{tab.url}</code>
        <button onClick={() => open(tab.url)} className="px-3 py-1 border rounded text-sm">Open in browser</button>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Legal.tsx || { echo "FAIL"; exit 1; }
grep -q "LegalPage" apps/admin/src/pages/Legal.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
