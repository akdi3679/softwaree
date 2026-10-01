# TASK ID: ADMIN-012.1
# TITLE: Add Admin user-facing documentation (in-app help)
# STATUS: pending
# DEPENDENCIES: ARCHITECTURE-001.4
# ALLOWED FILES: product/apps/admin/src/pages/Help.tsx, product/apps/admin/src/hooks/useHelp.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a Help page with in-app guidance.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useHelp.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';

export interface HelpArticle {
  id: string;
  title: string;
  body: string;
  category: string;
}

const ARTICLES: HelpArticle[] = [
  {
    id: 'invite-user',
    title: 'How to invite a user',
    body: '1. Go to Users\n2. Click "Invite user"\n3. Enter their email and select a role\n4. Share the token (one-time view) with them\n5. They install the User app, click Connect, and paste the token',
    category: 'users',
  },
  {
    id: 'backup',
    title: 'How to back up',
    body: 'Backups are automatic on Plans 2+. For manual backups:\n1. Go to Backup\n2. Enter a passphrase (≥ 8 chars)\n3. Optionally add a note\n4. Click "Create & upload"\nThe backup is encrypted before upload; only you can decrypt it.',
    category: 'backup',
  },
  {
    id: 'restore',
    title: 'How to restore from backup',
    body: '1. Go to Backup\n2. Find the backup you want\n3. Click Restore\n4. Enter the passphrase used at backup time\n5. Confirm\nThe restore takes effect after 3 seconds. The Admin must be online to write the data back.',
    category: 'backup',
  },
  {
    id: 'module-install',
    title: 'How to install a module',
    body: '1. Go to Modules → Available\n2. Click Install next to the module\n3. Wait for the triple-signature verification (a few seconds)\n4. The module is now active in your project',
    category: 'modules',
  },
  {
    id: 'audit',
    title: 'How to read the audit log',
    body: 'The audit log records every command. Each entry has:\n- a timestamp\n- the actor (user + device)\n- the action (e.g. "user.created")\n- the result (success/failure)\nYou can filter by action type and time range.',
    category: 'audit',
  },
];

export function useHelpArticles(category?: string) {
  return useQuery({
    queryKey: ['help', category],
    queryFn: async () => {
      if (!category) return ARTICLES;
      return ARTICLES.filter((a) => a.category === category);
    },
  });
}
```

Create `product/apps/admin/src/pages/Help.tsx`:

```typescript
import { useState } from 'react';
import { useHelpArticles } from '../hooks/useHelp';

export function HelpPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: articles } = useHelpArticles(category);

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4">Help</h2>
      <div className="flex gap-2 mb-4">
        <CatButton label="All" value={undefined} current={category} onClick={setCategory} />
        <CatButton label="Users" value="users" current={category} onClick={setCategory} />
        <CatButton label="Backup" value="backup" current={category} onClick={setCategory} />
        <CatButton label="Modules" value="modules" current={category} onClick={setCategory} />
        <CatButton label="Audit" value="audit" current={category} onClick={setCategory} />
      </div>
      <div className="space-y-4">
        {(articles ?? []).map((a) => (
          <div key={a.id} className="bg-white rounded border p-4">
            <h3 className="font-medium mb-2">{a.title}</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{a.body}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatButton({ label, value, current, onClick }: { label: string; value: string | undefined; current: string | undefined; onClick: (v: string | undefined) => void }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1 rounded text-sm ${
        current === value ? 'bg-primary-600 text-white' : 'bg-white border'
      }`}
    >
      {label}
    </button>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/Help.tsx || { echo "FAIL"; exit 1; }
test -f apps/admin/src/hooks/useHelp.ts || { echo "FAIL: no hook"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
