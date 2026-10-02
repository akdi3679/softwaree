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
