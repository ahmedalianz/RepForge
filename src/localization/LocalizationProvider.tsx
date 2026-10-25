import { useEffect, type PropsWithChildren } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { getTimeZone } from 'react-native-localize';
import i18n, { getLanguage } from './i18n';
import { languageDirection } from './types';
import { setFormattingTimeZone } from './format';
function LocalizedLayout({ children }: PropsWithChildren) {
  useTranslation();
  useEffect(() => {
    const updateTimeZone = () => setFormattingTimeZone(getTimeZone());
    updateTimeZone();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        updateTimeZone();
      }
    });
    return () => listener.remove();
  }, []);
  return (
    <View
      style={[styles.root, { direction: languageDirection(getLanguage()) }]}
    >
      {children}
    </View>
  );
}
export function LocalizationProvider({ children }: PropsWithChildren) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocalizedLayout>{children}</LocalizedLayout>
    </I18nextProvider>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
