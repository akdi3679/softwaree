# TASK ID: ADMIN-015.2
# TITLE: Add Admin theme (light/dark)
# STATUS: pending
# DEPENDENCIES: ADMIN-015.1
# ALLOWED FILES: product/apps/admin/src/hooks/useTheme.ts, product/apps/admin/src/styles/theme.css
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Light/dark theme switcher.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useTheme.ts`:

```typescript
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as Theme) ?? 'light';
  });
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return { theme, setTheme };
}
```

Create `product/apps/admin/src/styles/theme.css`:

```css
:root {
  --bg: #ffffff;
  --fg: #111827;
  --primary: #2563eb;
  --border: #e5e7eb;
  --card: #ffffff;
  --muted: #6b7280;
}
.dark {
  --bg: #111827;
  --fg: #f3f4f6;
  --primary: #3b82f6;
  --border: #374151;
  --card: #1f2937;
  --muted: #9ca3af;
}
body { background: var(--bg); color: var(--fg); }
```

## TESTS

```bash
cd product
test -f apps/admin/src/hooks/useTheme.ts || { echo "FAIL"; exit 1; }
test -f apps/admin/src/styles/theme.css || { echo "FAIL: no css"; exit 1; }
grep -q "useTheme" apps/admin/src/hooks/useTheme.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
