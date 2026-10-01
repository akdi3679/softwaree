# TASK ID: USER-008.1
# TITLE: Add User accessibility mode (high contrast, large text)
# STATUS: pending
# DEPENDENCIES: LOAD-002.2
# ALLOWED FILES: product/apps/user/src/components/AccessibilitySettings.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can toggle high contrast, large text, screen reader hints.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/components/AccessibilitySettings.tsx`:

```typescript
import { useState, useEffect } from 'react';

type Mode = 'default' | 'high-contrast' | 'large-text' | 'screen-reader';

export function AccessibilitySettings() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('a11y') as Mode) ?? 'default');

  useEffect(() => {
    localStorage.setItem('a11y', mode);
    document.body.className = document.body.className.replace(/a11y-\w+/g, '').trim();
    document.body.classList.add(`a11y-${mode}`);
  }, [mode]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Accessibility</h2>
      <div className="bg-white rounded border p-4 space-y-3">
        {(['default', 'high-contrast', 'large-text', 'screen-reader'] as const).map((m) => (
          <label key={m} className="flex items-center gap-3">
            <input type="radio" name="a11y" value={m} checked={mode === m} onChange={() => setMode(m)} />
            <span className="capitalize">{m.replace('-', ' ')}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

Add to `src/styles/index.css`:

```css
.a11y-high-contrast {
  --bg: #000;
  --fg: #fff;
  --primary: #00ff00;
}
.a11y-high-contrast body { background: var(--bg); color: var(--fg); }
.a11y-large-text { font-size: 1.2rem; }
.a11y-large-text h1, .a11y-large-text h2 { font-size: 1.4em; }
```

## TESTS

```bash
cd product
test -f apps/user/src/components/AccessibilitySettings.tsx || { echo "FAIL"; exit 1; }
grep -q "AccessibilitySettings" apps/user/src/components/AccessibilitySettings.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
