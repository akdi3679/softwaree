# TASK ID: ONBOARD-002.1
# TITLE: Add onboarding: project creation wizard
# STATUS: pending
# DEPENDENCIES: NOTIF-002.2
# ALLOWED FILES: product/apps/admin/src/pages/NewProjectWizard.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Step-by-step wizard for creating a new project.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/pages/NewProjectWizard.tsx`:

```typescript
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';

type Step = 'name' | 'module' | 'invite' | 'review';

const MODULES = [
  { id: 'medical-reception', name: 'Medical Reception', desc: 'Patients, appointments, visits' },
  { id: 'food-lab', name: 'Food Lab', desc: 'Samples, tests, lab reports' },
  { id: 'retail-pos', name: 'Retail POS', desc: 'Products, sales, inventory' },
  { id: 'gym', name: 'Gym', desc: 'Members, classes, check-ins' },
  { id: 'school', name: 'School', desc: 'Students, classes, attendance' },
  { id: 'invoice', name: 'Invoice Generator', desc: 'PDF invoices' },
];

export function NewProjectWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [module, setModule] = useState('medical-reception');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    try {
      const r = await invoke<{ project_id: string }>('create_project', {
        name, moduleId: module, inviteEmails: inviteEmails.filter((e) => e),
      });
      nav({ to: '/projects/$id', params: { id: r.project_id } });
    } catch (e: any) {
      setError(e.message ?? 'failed');
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-2">New project</h2>
      <div className="text-sm text-gray-500 mb-6">Step {['name', 'module', 'invite', 'review'].indexOf(step) + 1} of 4</div>

      {step === 'name' && (
        <>
          <label className="block text-sm font-medium mb-1">Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Alia Clinic" className="w-full px-3 py-2 border rounded mb-3" />
          <button onClick={() => name && setStep('module')} disabled={!name} className="px-4 py-2 bg-primary-600 text-white rounded">Next</button>
        </>
      )}

      {step === 'module' && (
        <>
          <div className="space-y-2 mb-3">
            {MODULES.map((m) => (
              <label key={m.id} className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input type="radio" checked={module === m.id} onChange={() => setModule(m.id)} className="mt-1" />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-500">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep('name')} className="px-4 py-2 border rounded">Back</button>
            <button onClick={() => setStep('invite')} className="px-4 py-2 bg-primary-600 text-white rounded">Next</button>
          </div>
        </>
      )}

      {step === 'invite' && (
        <>
          <label className="block text-sm font-medium mb-1">Invite team members (optional)</label>
          <p className="text-xs text-gray-500 mb-2">They'll receive an email with a link to join this project.</p>
          {inviteEmails.map((email, i) => (
            <input key={i} type="email" value={email} onChange={(e) => {
              const next = [...inviteEmails];
              next[i] = e.target.value;
              setInviteEmails(next);
            }} placeholder="user@example.com" className="w-full px-3 py-2 border rounded mb-2" />
          ))}
          <button onClick={() => setInviteEmails([...inviteEmails, ''])} className="text-sm text-primary-600 mb-3">+ Add another</button>
          <div className="flex justify-between">
            <button onClick={() => setStep('module')} className="px-4 py-2 border rounded">Back</button>
            <button onClick={() => setStep('review')} className="px-4 py-2 bg-primary-600 text-white rounded">Next</button>
          </div>
        </>
      )}

      {step === 'review' && (
        <>
          <div className="bg-gray-50 p-4 rounded mb-3">
            <div className="text-sm"><strong>Name:</strong> {name}</div>
            <div className="text-sm"><strong>Module:</strong> {MODULES.find((m) => m.id === module)?.name}</div>
            <div className="text-sm"><strong>Invites:</strong> {inviteEmails.filter((e) => e).length || 'none'}</div>
          </div>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <div className="flex justify-between">
            <button onClick={() => setStep('invite')} className="px-4 py-2 border rounded">Back</button>
            <button onClick={create} className="px-4 py-2 bg-primary-600 text-white rounded">Create project</button>
          </div>
        </>
      )}
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/pages/NewProjectWizard.tsx || { echo "FAIL"; exit 1; }
grep -q "NewProjectWizard" apps/admin/src/pages/NewProjectWizard.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
