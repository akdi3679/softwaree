# TASK ID: ADMIN-073.1
# TITLE: Add Admin: read-only help-search
# STATUS: pending
# DEPENDENCIES: CLOUD-025.2
# ALLOWED FILES: product/apps/admin/src/pages/HelpSearch.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Search across all help articles (bundled JSON).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/HelpSearch.tsx`:

```typescript
import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface Article { id: string; title: string; body: string; tags: string[]; }

const ARTICLES: Article[] = [
  { id: 'install-module', title: 'How do I install a module?', body: 'Go to Settings → Modules → Browse marketplace, or paste a manifest in Install from manifest.', tags: ['module', 'install'] },
  { id: 'backup-restore', title: 'How do I restore from a backup?', body: 'Go to Settings → Backups → pick a backup → Restore.', tags: ['backup', 'restore'] },
  { id: 'add-user', title: 'How do I add a User?', body: 'Go to Users → Invite. They get an email with a link.', tags: ['user', 'invite'] },
  { id: 'replace-device', title: 'How do I replace a lost Admin device?', body: 'On the new device, open Admin → Settings → Device → Replace.', tags: ['device', 'replace'] },
  { id: 'two-factor', title: 'How do I enable 2FA?', body: 'Go to Settings → Security → Enable TOTP.', tags: ['security', '2fa'] },
  { id: 'pricing', title: 'What do the plans cost?', body: 'See Settings → Plan or visit our pricing page.', tags: ['plan', 'price'] },
];

export function HelpSearchPage() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 200);
  const results = dq.length < 2 ? [] : ARTICLES.filter((a) =>
    a.title.toLowerCase().includes(dq.toLowerCase()) || a.body.toLowerCase().includes(dq.toLowerCase()) || a.tags.some((t) => t.toLowerCase().includes(dq.toLowerCase()))
  );
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Help &amp; documentation</h2>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full px-3 py-2 border rounded mb-4" autoFocus />
      <div className="space-y-2">
        {results.map((r) => (
          <a key={r.id} href={`#${r.id}`} className="block bg-white rounded border p-3 hover:bg-gray-50">
            <div className="font-medium">{r.title}</div>
            <p className="text-sm text-gray-500 mt-1">{r.body}</p>
            <div className="text-xs mt-1">{r.tags.map((t) => <span key={t} className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-1">#{t}</span>)}</div>
          </a>
        ))}
        {dq.length >= 2 && results.length === 0 && <div className="text-sm text-gray-500">No matches. Try different keywords.</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/HelpSearch.tsx || { echo "FAIL"; exit 1; }
grep -q "HelpSearchPage" apps/admin/src/pages/HelpSearch.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
