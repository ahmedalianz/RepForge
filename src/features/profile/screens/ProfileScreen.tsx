import { useTranslation } from 'react-i18next';
import { LanguageSettings } from '../../../localization/LanguageSettings';
import { useState } from 'react';
import { usePreferencesStore } from '../../../app/config/preferencesStore';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import {
  savePreferences,
  type Preferences,
} from '../../../services/storage/preferences';
import { Screen } from '../../../shared/components/Screen';
import { Card } from '../../../shared/components/Card';
import { Text } from '../../../shared/components/Text';
import { Button } from '../../../shared/components/Button';
export function ProfileScreen() {
  const { t } = useTranslation('settings');
  const language = usePreferencesStore(state => state.language);
  const theme = usePreferencesStore(state => state.theme);
  const weightUnit = usePreferencesStore(state => state.weightUnit);
  const { database } = useDatabase();
  const [error, setError] = useState<string | null>(null);
  function update(preferences: Preferences) {
    try {
      savePreferences(database, preferences);
      usePreferencesStore.getState().setPreferences(preferences);
      setError(null);
    } catch {
      setError(t('saveError'));
    }
  }
  return (
    <Screen>
      <LanguageSettings />
      <Card title={t('appearance')}>
        <Button
          title={t('dark')}
          selected={theme === 'dark'}
          variant="secondary"
          onPress={() => update({ theme: 'dark', weightUnit, language })}
        />
        <Button
          title={t('light')}
          selected={theme === 'light'}
          variant="secondary"
          onPress={() => update({ theme: 'light', weightUnit, language })}
        />
        <Button
          title={t('systemTheme')}
          selected={theme === 'system'}
          variant="secondary"
          onPress={() => update({ theme: 'system', weightUnit, language })}
        />
      </Card>
      <Card title={t('weightUnit')}>
        <Text tone="muted">{t('weightDescription')}</Text>
        <Button
          title={t('kilograms')}
          selected={weightUnit === 'kg'}
          variant="secondary"
          onPress={() => update({ theme, weightUnit: 'kg', language })}
        />
        <Button
          title={t('pounds')}
          selected={weightUnit === 'lb'}
          variant="secondary"
          onPress={() => update({ theme, weightUnit: 'lb', language })}
        />
      </Card>
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
