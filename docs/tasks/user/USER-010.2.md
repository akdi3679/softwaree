# TASK ID: USER-010.2
# TITLE: Add User onboarding wizard
# STATUS: pending
# DEPENDENCIES: USER-010.1
# ALLOWED FILES: product/apps/user/src/pages/Onboarding.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
First-time setup: connect to Admin, verify device, choose settings.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/pages/Onboarding.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

type Step = 'connect' | 'verify' | 'finish';

export function OnboardingPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('connect');
  const [adminUrl, setAdminUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function testConnection() {
    setError(null);
    try {
      await invoke('test_admin_connection', { adminUrl });
      setStep('verify');
    } catch (e: any) {
      setError(e.message ?? 'failed');
    }
  }

  async function verifyDevice(code: string) {
    setError(null);
    try {
      await invoke('verify_device', { code });
      setStep('finish');
    } catch (e: any) {
      setError(e.message ?? 'failed');
    }
  }

  async function finish() {
    await invoke('complete_onboarding');
    nav({ to: '/dashboard' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
        <p className="text-sm text-gray-500 mb-6">Step {step === 'connect' ? '1' : step === 'verify' ? '2' : '3'} of 3</p>
        {step === 'connect' && (
          <>
            <label className="block text-sm font-medium mb-1">Admin's mesh address</label>
            <input
              value={adminUrl}
              onChange={(e) => setAdminUrl(e.target.value)}
              placeholder="100.x.y.z:port"
              className="w-full px-3 py-2 border rounded mb-3"
            />
            <button onClick={testConnection} className="w-full px-4 py-2 bg-primary-600 text-white rounded">Test connection</button>
          </>
        )}
        {step === 'verify' && (
          <>
            <p className="text-sm mb-2">On the Admin, approve this device, then enter the code shown:</p>
            <input
              placeholder="6-digit code"
              maxLength={6}
              onChange={(e) => e.target.value.length === 6 && verifyDevice(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-3"
            />
          </>
        )}
        {step === 'finish' && (
          <>
            <p className="text-sm mb-4">You're connected! Initial sync may take a moment.</p>
            <button onClick={finish} className="w-full px-4 py-2 bg-primary-600 text-white rounded">Start using Product</button>
          </>
        )}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/user/src/pages/Onboarding.tsx || { echo "FAIL"; exit 1; }
grep -q "OnboardingPage" apps/user/src/pages/Onboarding.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
