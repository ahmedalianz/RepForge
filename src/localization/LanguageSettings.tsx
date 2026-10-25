import { useState } from 'react';
import { usePrompt } from '../app/providers/PromptProvider';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePreferencesStore } from '../app/config/preferencesStore';
import { useDatabase } from '../app/providers/DatabaseProvider';
import { savePreferences } from '../services/storage/preferences';
import { Card } from '../shared/components/Card';
import { Text } from '../shared/components/Text';
import { Button } from '../shared/components/Button';
import { getLanguage, initializeLocalization } from './i18n';
import { prepareNativeDirection, needsDirectionRestart } from './direction';
import type { AppLanguage } from './types';
export function LanguageSettings() {
  const showPrompt = usePrompt();
  const { t } = useTranslation(['settings', 'common']);
  const language = usePreferencesStore(state => state.language);
  const { database, workouts } = useDatabase();
  const [error, setError] = useState<string | null>(null);
  const pending = language !== getLanguage();
  async function save(languageToSave: AppLanguage) {
    const previous = usePreferencesStore.getState();
    try {
      const preferences = {
        theme: previous.theme,
        weightUnit: previous.weightUnit,
        language: languageToSave,
      };
      database.transaction(tx => {
        savePreferences(tx, preferences);
        prepareNativeDirection(languageToSave);
      });
      usePreferencesStore.getState().setPreferences(preferences);
      // A native direction change is deferred, never silently reload an active workout.
      if (!needsDirectionRestart(languageToSave, I18nManager.isRTL)) {
        await initializeLocalization(languageToSave);
      }
      setError(null);
    } catch {
      // Keep the last usable UI; persistence failures never select an unsaved preference.
      setError(t('saveError'));
    }
  }
  function select(next: AppLanguage) {
    if (next === language) {
      return;
    }
    try {
      const hasActiveWorkout = workouts.getActiveSession() !== null;
      if (needsDirectionRestart(next, I18nManager.isRTL)) {
        showPrompt(
          t('changeLanguage'),
          `${t('restartMessage')}${hasActiveWorkout ? `\n\n${t('activeWorkoutNotice')}` : ''}`,
          [
            { text: t('common:cancel'), style: 'cancel' },
            { text: t('confirmLanguage'), onPress: () => save(next) },
          ],
        );
      } else {
        save(next);
      }
    } catch {
      setError(t('saveError'));
    }
  }
  return (
    <Card title={t('language')}>
      <Button
        title={t('arabic')}
        selected={language === 'ar-EG'}
        variant="secondary"
        onPress={() => select('ar-EG')}
      />
      <Button
        title={t('english')}
        selected={language === 'en-US'}
        variant="secondary"
        onPress={() => select('en-US')}
      />
      {pending ? (
        <Text accessibilityRole="alert">{t('pendingRestart')}</Text>
      ) : null}
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Card>
  );
}
