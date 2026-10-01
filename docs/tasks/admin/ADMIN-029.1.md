# TASK ID: ADMIN-029.1
# TITLE: Add Admin: dispute resolution flow (replace Admin device)
# STATUS: pending
# DEPENDENCIES: CLOUD-015.2
# ALLOWED FILES: product/apps/admin/src/pages/DeviceDispute.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
What happens when a customer loses their Admin device. Walk through replacement.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/DeviceDispute.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Step = 'start' | 'verify' | 'generate' | 'submit' | 'done';

export function DeviceDisputePage() {
  const [step, setStep] = useState<Step>('start');
  const [reason, setReason] = useState('lost');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateKey() {
    try {
      const r = await invoke<{ public_key_hex: string; proof_hex: string }>('begin_device_replacement', { reason });
      setNewKey(r.public_key_hex);
      setStep('generate');
    } catch (e: any) { setError(e.message); }
  }
  async function submit() {
    try {
      await invoke('submit_device_replacement');
      setStep('done');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-2">Replace Admin device</h2>
      <p className="text-sm text-gray-500 mb-6">Use this if your Admin device was lost, stolen, or destroyed.</p>

      {step === 'start' && (
        <div className="bg-white rounded border p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">What happened?</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="lost">Lost</option>
              <option value="stolen">Stolen</option>
              <option value="broken">Broken / destroyed</option>
              <option value="upgrading">Upgrading to a new device</option>
            </select>
          </div>
          <button onClick={() => setStep('verify')} className="px-4 py-2 bg-primary-600 text-white rounded">Continue</button>
        </div>
      )}
      {step === 'verify' && (
        <div className="bg-white rounded border p-4">
          <h3 className="font-medium mb-2">Verify your identity</h3>
          <p className="text-sm mb-3">We'll email a code to your account email. Enter it to continue.</p>
          <button onClick={generateKey} className="px-4 py-2 bg-primary-600 text-white rounded">Send code</button>
        </div>
      )}
      {step === 'generate' && (
        <div className="bg-white rounded border p-4">
          <h3 className="font-medium mb-2">New device key generated</h3>
          <p className="text-sm mb-2">Your new public key:</p>
          <code className="block bg-gray-50 p-2 text-xs break-all">{newKey}</code>
          <p className="text-sm text-gray-500 mt-3">Submitting to Cloud. The old device is now revoked.</p>
          <button onClick={submit} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded">Submit replacement</button>
        </div>
      )}
      {step === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-medium text-green-800">Done</h3>
          <p className="text-sm mt-1">This device is now the Admin for this project. The old device is revoked.</p>
        </div>
      )}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/DeviceDispute.tsx || { echo "FAIL"; exit 1; }
grep -q "DeviceDisputePage" apps/admin/src/pages/DeviceDispute.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
