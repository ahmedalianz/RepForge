import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';
import { DEFAULT_LANGUAGE, normalizeLanguage, type AppLanguage } from './types';
export const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en-US',
  supportedLngs: ['ar-EG', 'en-US'],
  load: 'currentOnly',
  defaultNS: 'common',
  ns: Object.keys(resources['en-US']),
  initAsync: false,
  returnNull: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  parseMissingKeyHandler: () =>
    i18n.language === 'en-US'
      ? 'Something went wrong. Please try again.'
      : 'حصلت مشكلة. جرّب تاني.',
});
export const t = i18n.t.bind(i18n);
export function getLanguage(): AppLanguage {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
}
export async function initializeLocalization(
  language: AppLanguage = DEFAULT_LANGUAGE,
): Promise<void> {
  await i18n.changeLanguage(language);
}
export default i18n;
