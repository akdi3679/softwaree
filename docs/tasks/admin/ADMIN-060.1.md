# TASK ID: ADMIN-060.1
# TITLE: Add Admin: error boundary (React)
# STATUS: pending
# DEPENDENCIES: ARCH-020.2
# ALLOWED FILES: product/apps/admin/src/components/ErrorBoundary.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
A render error doesn't crash the whole app. Show fallback UI.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/components/ErrorBoundary.tsx`:

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface State { has_error: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { has_error: false };
  static getDerivedStateFromError(error: Error): State { return { has_error: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error', error, info);
    // (Optional) send to Sentry
  }
  render() {
    if (this.state.has_error) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-2">The screen you were viewing crashed. Your data is safe.</p>
          <pre className="text-xs bg-gray-50 p-2 overflow-x-auto mb-3">{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ has_error: false })} className="px-4 py-2 bg-primary-600 text-white rounded">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/components/ErrorBoundary.tsx || { echo "FAIL"; exit 1; }
grep -q "ErrorBoundary" apps/admin/src/components/ErrorBoundary.tsx || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
