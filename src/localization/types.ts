export const APP_LANGUAGES = ['ar-EG', 'en-US'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'ar-EG';
export function normalizeLanguage(language: unknown): AppLanguage {
  return language === 'en-US' ? 'en-US' : DEFAULT_LANGUAGE;
}
export function languageDirection(language: AppLanguage): 'rtl' | 'ltr' {
  return language === 'ar-EG' ? 'rtl' : 'ltr';
}
