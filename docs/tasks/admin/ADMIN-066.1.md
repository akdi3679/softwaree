# TASK ID: ADMIN-066.1
# TITLE: Add Admin: detailed release notes viewer
# STATUS: pending
# DEPENDENCIES: CLOUD-022.2
# ALLOWED FILES: product/apps/admin/src/pages/ReleaseNotes.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
"Help → What's new" shows release notes from CHANGELOG.md.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/ReleaseNotes.tsx`:

```typescript
import { useState, useEffect } from 'react';

interface Release { version: string; date: string; notes: string[]; }

export function ReleaseNotesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  useEffect(() => {
    // In real impl, fetch from GitHub releases API or bundle the JSON
    // For v1 demo, hard-code
    setReleases([
      { version: '1.0.0', date: '2026-08-15', notes: ['First stable release', 'Medical reception module', 'Food lab module', 'Backup to encrypted Cloud storage'] },
      { version: '1.1.0', date: '2026-10-15', notes: ['Telemedicine', 'Voice notes', 'PDF reports', 'Marketplace'] },
    ]);
  }, []);
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">What's new</h2>
      <div className="space-y-6">
        {releases.map((r) => (
          <div key={r.version}>
            <h3 className="text-lg font-semibold">v{r.version} <span className="text-sm text-gray-500 font-normal">· {r.date}</span></h3>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1">
              {r.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
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
test -f apps/admin/src/pages/ReleaseNotes.tsx || { echo "FAIL"; exit 1; }
grep -q "ReleaseNotesPage" apps/admin/src/pages/ReleaseNotes.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
