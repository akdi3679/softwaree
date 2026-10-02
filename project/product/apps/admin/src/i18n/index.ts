import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';
import fr from './fr.json';
import es from './es.json';
import de from './de.json';
import zhCN from './zh-CN.json';
import hi from './hi.json';
import pt from './pt.json';

const savedLang = localStorage.getItem('lang') ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
    es: { translation: es },
    de: { translation: de },
    'zh-CN': { translation: zhCN },
    hi: { translation: hi },
    pt: { translation: pt },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = savedLang;
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

export default i18n;