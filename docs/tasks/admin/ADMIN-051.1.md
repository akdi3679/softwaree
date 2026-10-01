# TASK ID: ADMIN-051.1
# TITLE: Add Admin: i18n (English) full coverage
# STATUS: pending
# DEPENDENCIES: ADMIN-050.2
# ALLOWED FILES: product/apps/admin/src/i18n/useT.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Hook for translated strings.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/i18n/useT.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import en from './en.json';
import ar from './ar.json';
import fr from './fr.json';

type Locale = 'en' | 'ar' | 'fr';
const DICTS: Record<Locale, any> = { en, ar, fr };

export function useT() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('locale') as Locale) ?? 'en');
  useEffect(() => {
    localStorage.setItem('locale', locale);
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);
  const t = useCallback((key: string): string => {
    const parts = key.split('.');
    let cur: any = DICTS[locale];
    for (const p of parts) {
      if (cur == null) return key;
      cur = cur[p];
    }
    return typeof cur === 'string' ? cur : key;
  }, [locale]);
  return { t, locale, setLocale, isRTL: locale === 'ar' };
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/i18n/useT.ts || { echo "FAIL"; exit 1; }
grep -q "useT" apps/admin/src/i18n/useT.ts || { echo "FAIL"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
