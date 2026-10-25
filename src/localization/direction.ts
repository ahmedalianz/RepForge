import { I18nManager } from 'react-native';
import type { AppLanguage } from './types';
import { languageDirection } from './types';
export function needsDirectionRestart(
  language: AppLanguage,
  nativeRTL: boolean,
): boolean {
  return (languageDirection(language) === 'rtl') !== nativeRTL;
}
/** Persist RN's native flags for the next cold start, independently of OS locale. */
export function prepareNativeDirection(language: AppLanguage): void {
  const rtl = languageDirection(language) === 'rtl';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  I18nManager.swapLeftAndRightInRTL(true);
}
