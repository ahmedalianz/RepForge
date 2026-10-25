import i18n from './i18n';
import { resources } from './resources';
function translationKey(
  value: unknown,
  message: string,
  prefix = '',
): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child === message) {
      return path;
    }
    const nested = translationKey(child, message, path);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}
/** Keep domain identifiers stable while preventing raw native/SQL errors in UI. */
export function localizeError(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const key = translationKey(resources['en-US'].validation, message);
  return key
    ? i18n.t(key, { ns: 'validation', defaultValue: fallback })
    : fallback;
}
