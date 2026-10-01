# TASK ID: ADMIN-002.5
# TITLE: Add Tailwind CSS to Admin frontend
# STATUS: pending
# DEPENDENCIES: ADMIN-002.4
# ALLOWED FILES: product/apps/admin/package.json, product/apps/admin/tailwind.config.ts, product/apps/admin/postcss.config.cjs, product/apps/admin/src/styles/index.css
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add Tailwind CSS for styling.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm --filter admin add -D tailwindcss postcss autoprefixer
pnpm --filter admin dlx tailwindcss init -p
```

Replace `product/apps/admin/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors — replace with real values
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Create `product/apps/admin/src/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply h-full;
  }
  body {
    @apply h-full bg-gray-50 text-gray-900 antialiased;
  }
  #root {
    @apply h-full;
  }
}
```

In `product/apps/admin/src/main.tsx` (or wherever the entry is), import the stylesheet:

```typescript
import './styles/index.css';
```

## TESTS

```bash
cd product
test -f apps/admin/tailwind.config.ts || { echo "FAIL"; exit 1; }
test -f apps/admin/postcss.config.cjs || { echo "FAIL: no postcss"; exit 1; }
test -f apps/admin/src/styles/index.css || { echo "FAIL: no styles"; exit 1; }
grep -q "@tailwind" apps/admin/src/styles/index.css || { echo "FAIL: no tailwind imports"; exit 1; }
echo "OK"
```
