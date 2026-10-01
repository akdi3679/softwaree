# TASK ID: USER-020.1
# TITLE: Add User: locale switcher (UI language)
# STATUS: pending
# DEPENDENCIES: ADMIN-039.2
# ALLOWED FILES: product/apps/user/src/hooks/useLocale.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can switch UI language (en, ar, fr).

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src/hooks/useLocale.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Locale = 'en' | 'ar' | 'fr';

const messages: Record<Locale, Record<string, string>> = {
  en: { dashboard: 'Dashboard', patients: 'Patients', settings: 'Settings' },
  ar: { dashboard: 'لوحة التحكم', patients: 'المرضى', settings: 'الإعدادات' },
  fr: { dashboard: 'Tableau de bord', patients: 'Patients', settings: 'Paramètres' },
};

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (localStorage.getItem('locale') as Locale) ?? 'en');
  const isRTL = locale === 'ar';
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('locale', l);
  }, []);
  const t = useCallback((key: string) => messages[locale]?.[key] ?? key, [locale]);
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRTL]);
  return <LocaleCtx.Provider value={{ locale, setLocale, t, isRTL }}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error('useLocale must be used within LocaleProvider');
  return c;
}
```

## TESTS

```bash
cd product
test -f apps/user/src/hooks/useLocale.tsx || { echo "FAIL"; exit 1; }
grep -q "LocaleProvider" apps/user/src/hooks/useLocale.tsx || { echo "FAIL"; exit 1; }
pnpm --filter user typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
