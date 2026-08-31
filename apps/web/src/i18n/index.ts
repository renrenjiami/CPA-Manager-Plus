/**
 * i18next 国际化配置
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import type { Language } from '@/types';
import { getInitialLanguage } from '@/utils/language';

// Keep one synchronous fallback bundle so the first render and synchronous
// consumers never expose raw translation keys while the selected locale is
// loaded lazily. Other locales remain split out of the initial bundle.
const loadedLanguages = new Set<Language>(['zh-CN']);
const localeLoaders: Partial<Record<Language, () => Promise<{ default: unknown }>>> = {
  'zh-TW': () => import('./locales/zh-TW.json'),
  en: () => import('./locales/en.json'),
  ru: () => import('./locales/ru.json')
};

export async function loadLanguageResource(language: string) {
  if (loadedLanguages.has(language as Language)) {
    return;
  }

  const loader = localeLoaders[language as Language];
  if (!loader) {
    return;
  }

  const locale = await loader();
  i18n.addResourceBundle(language, 'translation', locale.default, true, true);
  loadedLanguages.add(language as Language);
}

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN }
  },
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false // React 已经转义
  },
  react: {
    useSuspense: false
  }
});

void loadLanguageResource(initialLanguage).then(() => i18n.changeLanguage(initialLanguage));

export default i18n;
