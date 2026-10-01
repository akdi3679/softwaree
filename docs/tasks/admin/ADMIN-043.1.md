# TASK ID: ADMIN-043.1
# TITLE: Add Admin: support contact form
# STATUS: pending
# DEPENDENCIES: CONTRACT-087.2
# ALLOWED FILES: product/apps/admin/src/pages/SupportContact.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can contact support from inside the app, with diagnostic bundle pre-attached.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/SupportContact.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function SupportContactPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [attachBundle, setAttachBundle] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ ticket_id: string } | null>(null);

  async function submit() {
    setSending(true);
    try {
      const r = await invoke<{ ticket_id: string }>('create_support_ticket', {
        subject, body, severity, attachBundle,
      });
      setSent(r);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="p-6 max-w-xl">
        <h2 className="text-2xl font-semibold mb-2">Sent</h2>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p>Your support ticket is created. ID: <code className="font-mono">{sent.ticket_id}</code></p>
          <p className="text-sm mt-1">We'll email you within 24 hours, Monday-Friday.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-2">Contact support</h2>
      <p className="text-sm text-gray-500 mb-4">Tell us what's wrong. We respond within 24 hours on business days.</p>
      <div className="bg-white rounded border p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full px-3 py-2 border rounded">
            <option value="low">Low — minor issue</option>
            <option value="medium">Medium — affects work</option>
            <option value="high">High — blocks work</option>
            <option value="urgent">Urgent — data loss risk</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full px-3 py-2 border rounded" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={attachBundle} onChange={(e) => setAttachBundle(e.target.checked)} />
          Attach diagnostic bundle (last 1000 events, app version, no PII)
        </label>
        <button onClick={submit} disabled={sending || !subject || !body} className="px-4 py-2 bg-primary-600 text-white rounded">
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/SupportContact.tsx || { echo "FAIL"; exit 1; }
grep -q "SupportContactPage" apps/admin/src/pages/SupportContact.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
