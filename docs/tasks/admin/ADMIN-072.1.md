# TASK ID: ADMIN-072.1
# TITLE: Add Admin: workspace theming
# STATUS: pending
# DEPENDENCIES: ADMIN-071.2
# ALLOWED FILES: product/apps/admin/src/hooks/useTheme.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Multi-tenant theming. Each workspace can have its own brand colors.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/hooks/useTheme.ts`:

```typescript
import { useState, useEffect } from 'react';

const DEFAULT_THEME = {
  primary: '#2563eb',
  accent: '#10b981',
  bg: '#ffffff',
  fg: '#111827',
  font: 'Inter',
  border: '#e5e7eb',
  danger: '#dc2626',
};

export type Theme = typeof DEFAULT_THEME;

const PRESETS: Record<string, Partial<Theme>> = {
  default: DEFAULT_THEME,
  medical: { primary: '#0891b2' },           // cyan
  food:    { primary: '#16a34a' },           // green
  fitness: { primary: '#ea580c' },           // orange
  finance: { primary: '#7c3aed' },           // purple
  school:  { primary: '#0284c7' },           // blue
  retail:  { primary: '#db2777' },           // pink
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const preset = localStorage.getItem('theme_preset') ?? 'default';
      const overrides = JSON.parse(localStorage.getItem('theme_overrides') ?? '{}');
      return { ...DEFAULT_THEME, ...PRESETS[preset], ...overrides };
    } catch { return DEFAULT_THEME; }
  });
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--fg', theme.fg);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--danger', theme.danger);
    root.style.setProperty('--font', theme.font);
  }, [theme]);
  function applyPreset(name: string) {
    localStorage.setItem('theme_preset', name);
    setTheme({ ...DEFAULT_THEME, ...PRESETS[name] });
  }
  return { theme, setTheme, applyPreset, presets: Object.keys(PRESETS) };
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/hooks/useTheme.ts || { echo "FAIL"; exit 1; }
grep -q "useTheme" apps/admin/src/hooks/useTheme.ts || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
