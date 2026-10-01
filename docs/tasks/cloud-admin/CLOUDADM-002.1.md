# TASK ID: CLOUDADM-002.1
# TITLE: Add Cloud admin — module review queue UI
# STATUS: pending
# DEPENDENCIES: ADMIN-015.3
# ALLOWED FILES: platform-cloud/admin-ui/index.html, platform-cloud/admin-ui/src/main.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Web app for our ops team to review module submissions.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/admin-ui/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Product Cloud Admin</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Create `platform-cloud/admin-ui/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminApp } from './App';
import { ReviewQueue } from './pages/ReviewQueue';
import { ModuleDetail } from './pages/ModuleDetail';
import { AccountsPage } from './pages/Accounts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminApp />}>
          <Route index element={<ReviewQueue />} />
          <Route path="modules/:id/:v" element={<ModuleDetail />} />
          <Route path="accounts" element={<AccountsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
```

Create `platform-cloud/admin-ui/src/pages/ReviewQueue.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Link } from 'react-router-dom';

interface PendingModule {
  module_id: string;
  name: string;
  version: string;
  publisher_name: string;
  submitted_at: string;
  automated_review_passed: boolean;
}

export function ReviewQueue() {
  const qc = useQueryClient();
  const { data: pending } = useQuery({
    queryKey: ['review-queue'],
    queryFn: async () => {
      return await invoke<PendingModule[]>('list_pending_modules');
    },
    refetchInterval: 30_000,
  });
  const approve = useMutation({
    mutationFn: async (input: { moduleId: string; version: string }) => {
      return await invoke('review_module', { ...input, action: 'approve' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review-queue'] }),
  });
  const reject = useMutation({
    mutationFn: async (input: { moduleId: string; version: string; reason: string }) => {
      return await invoke('review_module', { ...input, action: 'reject' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review-queue'] }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Module review queue</h2>
      <div className="space-y-2">
        {(pending ?? []).map((m) => (
          <div key={`${m.module_id}-${m.version}`} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <Link to={`/modules/${m.module_id}/${m.version}`} className="font-medium text-blue-600">{m.name}</Link>
              <div className="text-sm text-gray-500">v{m.version} · by {m.publisher_name} · submitted {m.submitted_at}</div>
              <div className="text-xs mt-1">
                {m.automated_review_passed ? (
                  <span className="text-green-600">✓ Automated review passed</span>
                ) : (
                  <span className="text-red-600">✗ Automated review failed</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => approve.mutate({ moduleId: m.module_id, version: m.version })} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
              <button onClick={() => {
                const reason = prompt('Reason for rejection:');
                if (reason) reject.mutate({ moduleId: m.module_id, version: m.version, reason });
              }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
            </div>
          </div>
        ))}
        {pending?.length === 0 && <div className="bg-white rounded border p-6 text-center text-gray-500">Review queue is empty</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f admin-ui/index.html || { echo "FAIL"; exit 1; }
test -f admin-ui/src/main.tsx || { echo "FAIL: no main"; exit 1; }
test -f admin-ui/src/pages/ReviewQueue.tsx || { echo "FAIL: no queue"; exit 1; }
echo "OK"
```
