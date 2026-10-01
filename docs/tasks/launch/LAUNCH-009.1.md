# TASK ID: LAUNCH-009.1
# TITLE: Add first-time Admin setup wizard
# STATUS: pending
# DEPENDENCIES: LAUNCH-008.2
# ALLOWED FILES: product/apps/admin/src/pages/FirstSetup.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When the Admin app launches for the very first time (no account yet), walk them through signup + first project.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/FirstSetup.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

type Step = 'welcome' | 'signup' | 'verify' | 'project' | 'install' | 'done';

export function FirstSetupPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [moduleId, setModuleId] = useState('medical-reception');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signup() {
    setBusy(true); setError(null);
    try {
      await invoke('signup', { email, password });
      setStep('verify');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError(null);
    try {
      await invoke('verify_email', { code });
      setStep('project');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function createProject() {
    setBusy(true); setError(null);
    try {
      await invoke('create_project', { name: projectName, moduleId });
      setStep('install');
      // install happens server-side
      setTimeout(() => setStep('done'), 3000);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  function finish() {
    nav({ to: '/dashboard' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-1">Welcome to Product</h1>
        <p className="text-sm text-gray-500 mb-6">Step {['welcome','signup','verify','project','install','done'].indexOf(step) + 1} of 6</p>

        {step === 'welcome' && (
          <>
            <p className="text-sm mb-4">You're about to set up your Admin. This is the one computer that holds the keys to your project.</p>
            <p className="text-sm mb-4">We'll walk you through: creating your account, your first project, and installing a module.</p>
            <button onClick={() => setStep('signup')} className="w-full px-4 py-2 bg-primary-600 text-white rounded">Get started</button>
          </>
        )}

        {step === 'signup' && (
          <>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
            <label className="block text-sm font-medium mb-1">Password (12+ chars, with number & symbol)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded mb-3" />
            <button onClick={signup} disabled={busy || !email || password.length < 12} className="w-full px-4 py-2 bg-primary-600 text-white rounded">{busy ? 'Creating…' : 'Create account'}</button>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-sm mb-3">We sent a 6-digit code to {email}.</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="123456" className="w-full px-3 py-2 border rounded mb-3" />
            <button onClick={verify} disabled={busy || code.length !== 6} className="w-full px-4 py-2 bg-primary-600 text-white rounded">Verify</button>
          </>
        )}

        {step === 'project' && (
          <>
            <label className="block text-sm font-medium mb-1">Project name</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Dr. Alia Clinic" className="w-full px-3 py-2 border rounded mb-2" />
            <label className="block text-sm font-medium mb-1">Module</label>
            <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="w-full px-3 py-2 border rounded mb-3">
              <option value="medical-reception">Medical Reception</option>
              <option value="food-lab">Food Lab</option>
              <option value="retail-pos">Retail POS</option>
              <option value="gym">Gym</option>
              <option value="school">School</option>
              <option value="hotel">Hotel</option>
              <option value="restaurant">Restaurant</option>
            </select>
            <button onClick={createProject} disabled={busy || !projectName} className="w-full px-4 py-2 bg-primary-600 text-white rounded">{busy ? 'Creating…' : 'Create project'}</button>
          </>
        )}

        {step === 'install' && (
          <div className="text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm">Installing module…</p>
          </div>
        )}

        {step === 'done' && (
          <>
            <div className="text-center text-3xl mb-2">✓</div>
            <p className="text-sm text-center mb-4">Your Admin is ready.</p>
            <button onClick={finish} className="w-full px-4 py-2 bg-primary-600 text-white rounded">Open dashboard</button>
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
test -f apps/admin/src/pages/FirstSetup.tsx || { echo "FAIL"; exit 1; }
grep -q "FirstSetupPage" apps/admin/src/pages/FirstSetup.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
