import { useTranslation } from 'react-i18next';

const LANGS: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pt', label: 'Português' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => {
        const lang = e.target.value;
        void i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      }}
      className="px-2 py-1 border rounded text-sm"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}