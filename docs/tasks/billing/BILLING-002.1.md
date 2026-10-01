# TASK ID: BILLING-002.1
# TITLE: Add billing: proration on plan change
# STATUS: pending
# DEPENDENCIES: ARCH-003.2
# ALLOWED FILES: platform-cloud/src/billing/proration.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Switching plans mid-cycle prorates the charge.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/billing/proration.ts`:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function changePlanWithProration(opts: {
  subscription_id: string;
  new_price_id: string;
  prorate: boolean;  // true = charge now, false = at next renewal
}) {
  return await stripe.subscriptions.update(opts.subscription_id, {
    items: [{ id: (await stripe.subscriptions.retrieve(opts.subscription_id)).items.data[0].id, price: opts.new_price_id }],
    proration_behavior: opts.prorate ? 'create_prorations' : 'none',
  });
}
```

## TESTS

```bash
cd platform-cloud
test -f src/billing/proration.ts || { echo "FAIL"; exit 1; }
grep -q "changePlanWithProration" src/billing/proration.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
