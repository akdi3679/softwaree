# TASK ID: ADMIN-075.1
# TITLE: Add Admin: 5-minute quick start tour
# STATUS: pending
# DEPENDENCIES: ADMIN-074.2
# ALLOWED FILES: product/apps/admin/src/components/OnboardingTour.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
First-time users: 4-step tour of the app.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/OnboardingTour.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

const STEPS = [
  { title: 'Welcome to Product', body: 'You are the Admin. You can write, manage users, install modules, and configure your project.', route: '/dashboard' },
  { title: 'Add a patient', body: 'Let\'s add your first record. Click "Add" and fill in the form.', route: '/patients' },
  { title: 'Invite a User', body: 'Users can see the data, but only the Admin can change it. Invite someone to try.', route: '/users' },
  { title: 'You\'re ready!', body: 'Backups run automatically. If you need help, click the ? button.', route: '/dashboard' },
];

export function OnboardingTour() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(localStorage.getItem('tour_done') === '1');
  if (done) return null;
  const cur = STEPS[step];
  function next() {
    if (step < STEPS.length - 1) { setStep(step + 1); nav({ to: cur.route }); }
    else { localStorage.setItem('tour_done', '1'); setDone(true); }
  }
  function prev() {
    if (step > 0) { setStep(step - 1); nav({ to: STEPS[step - 1].route }); }
  }
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 max-w-sm z-50">
      <div className="text-xs text-gray-500 mb-1">Step {step + 1} of {STEPS.length}</div>
      <h3 className="font-semibold mb-1">{cur.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{cur.body}</p>
      <div className="flex justify-between">
        <button onClick={prev} disabled={step === 0} className="text-sm text-gray-500">Back</button>
        <div className="flex gap-2">
          <button onClick={() => { localStorage.setItem('tour_done', '1'); setDone(true); }} className="text-sm text-gray-500">Skip</button>
          <button onClick={next} className="text-sm px-3 py-1 bg-primary-600 text-white rounded">{step === STEPS.length - 1 ? 'Done' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/OnboardingTour.tsx || { echo "FAIL"; exit 1; }
grep -q "OnboardingTour" apps/admin/src/components/OnboardingTour.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
