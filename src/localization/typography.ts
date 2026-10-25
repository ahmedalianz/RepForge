import { typography } from '../app/theme/tokens';
import { getLanguage } from './i18n';
export function getLocalizedTypography(variant: keyof typeof typography) {
  const base = typography[variant];
  if (getLanguage() !== 'ar-EG') {
    return base;
  }
  const fontFamily = base.fontFamily.endsWith('SemiBold')
    ? 'IBMPlexSansArabic-SemiBold'
    : base.fontFamily.endsWith('Bold')
      ? 'IBMPlexSansArabic-Bold'
      : 'IBMPlexSansArabic-Regular';
  return {
    ...base,
    fontFamily,
    letterSpacing: 0,
    lineHeight: Math.max(base.lineHeight, Math.ceil(base.fontSize * 1.5)),
  };
}
