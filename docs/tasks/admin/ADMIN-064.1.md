# TASK ID: ADMIN-064.1
# TITLE: Add Admin: trace links from event to projection
# STATUS: pending
# DEPENDENCIES: ADMIN-063.2
# ALLOWED FILES: product/apps/admin/src/components/EventLink.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
From an audit row, click to see the resulting entity.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/EventLink.tsx`:

```typescript
import { Link } from '@tanstack/react-router';

interface Props {
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
}

export function EventLink(p: Props) {
  return (
    <Link
      to="/entities/$type/$id"
      params={{ type: p.aggregate_type, id: p.aggregate_id }}
      className="text-xs text-primary-600 hover:underline"
    >
      View {p.aggregate_type} {p.aggregate_id.slice(0, 8)}…
    </Link>
  );
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/EventLink.tsx || { echo "FAIL"; exit 1; }
grep -q "EventLink" apps/admin/src/components/EventLink.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
