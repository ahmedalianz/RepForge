import { getLanguage, t } from './i18n';
import type { WeightUnit } from '../features/workouts/domain/strength';
let formattingTimeZone: string | undefined;
export function setFormattingTimeZone(timeZone: string): void {
  formattingTimeZone = timeZone;
}
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  // Some native Intl implementations ignore numberingSystem; normalize their output too.
  return normalizeNumericInput(
    new Intl.NumberFormat(`${getLanguage()}-u-nu-latn`, {
      ...options,
      numberingSystem: 'latn',
    })
      .format(value)
      .replace(/٬/g, ','),
  );
}
export function formatDate(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return normalizeNumericInput(
    new Intl.DateTimeFormat(`${getLanguage()}-u-nu-latn`, {
      timeZone: formattingTimeZone,
      ...options,
      numberingSystem: 'latn',
      calendar: 'gregory',
    }).format(timestamp),
  );
}
export function formatPercent(
  value: number,
  digits = 1,
  showSign = false,
): string {
  return formatNumber(value / 100, {
    style: 'percent',
    maximumFractionDigits: digits,
    signDisplay: showSign ? 'exceptZero' : 'auto',
  });
}
export function unitLabel(unit: WeightUnit): string {
  return t(`common:units.${unit}`);
}
/** Isolate a numeric/Latin run without reversing the surrounding Arabic sentence. */
export function ltrText(value: string): string {
  return getLanguage() === 'ar-EG' ? `\u2066${value}\u2069` : value;
}
export function normalizeNumericInput(value: string): string {
  return value
    .replace(/[٠-٩۰-۹]/g, digit =>
      String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0)),
    )
    .replace(/٫/g, '.')
    .replace(/٬/g, '');
}
