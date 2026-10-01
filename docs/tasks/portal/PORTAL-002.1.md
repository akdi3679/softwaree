# TASK ID: PORTAL-002.1
# TITLE: Add customer portal — billing page UI
# STATUS: pending
# DEPENDENCIES: AUDIT-002.2
# ALLOWED FILES: platform-cloud/portal/src/pages/Billing.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer can see current plan, payment method, invoices.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/portal/src/pages/Billing.tsx`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  hosted_invoice_url: string;
  created: string;
}

export function BillingPage() {
  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const r = await invoke<{ subscription: Subscription | null }>('get_subscription');
      return r.subscription;
    },
  });
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const r = await invoke<{ invoices: Invoice[] }>('list_invoices');
      return r.invoices;
    },
  });
  const upgrade = useMutation({
    mutationFn: async (plan: string) => invoke('start_checkout', { plan }),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Billing</h2>
      <div className="bg-white rounded border p-4 mb-4">
        <h3 className="font-medium mb-2">Current plan</h3>
        {sub ? (
          <>
            <div className="text-2xl font-semibold capitalize">{sub.plan}</div>
            <div className="text-sm text-gray-500">
              {sub.status === 'active' ? 'Renews' : sub.status} on {new Date(sub.current_period_end).toLocaleDateString()}
            </div>
            <div className="mt-3 flex gap-2">
              {(['starter', 'team', 'enterprise'] as const).map((p) => (
                p !== sub.plan && (
                  <button key={p} onClick={() => upgrade.mutate(p)} className="px-3 py-1 border rounded text-sm">
                    Switch to {p}
                  </button>
                )
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">No active subscription</div>
        )}
      </div>
      <div className="bg-white rounded border p-4">
        <h3 className="font-medium mb-2">Invoices</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((inv) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="py-2">{new Date(inv.created * 1000).toLocaleDateString()}</td>
                <td>${(inv.amount_paid / 100).toFixed(2)}</td>
                <td>{inv.status}</td>
                <td><a href={inv.hosted_invoice_url} target="_blank" className="text-blue-600 text-xs">View</a></td>
              </tr>
            ))}
            {invoices?.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-500">No invoices</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f portal/src/pages/Billing.tsx || { echo "FAIL"; exit 1; }
grep -q "BillingPage" portal/src/pages/Billing.tsx || { echo "FAIL"; exit 1; }
echo "OK"
```
