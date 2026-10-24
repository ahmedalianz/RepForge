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
  const theme = usePreferencesStore(state => state.theme);
  const weightUnit = usePreferencesStore(state => state.weightUnit);
  const { database } = useDatabase();
  const [error, setError] = useState<string | null>(null);
  function update(preferences: Preferences) {
    try {
      savePreferences(database, preferences);
      usePreferencesStore.getState().setPreferences(preferences);
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Preferences could not be saved',
      );
    }
  }
  return (
    <Screen>
      <Card title="Appearance">
        <Button
          title="Dark"
          selected={theme === 'dark'}
          variant="secondary"
          onPress={() => update({ theme: 'dark', weightUnit })}
        />
        <Button
          title="Light"
          selected={theme === 'light'}
          variant="secondary"
          onPress={() => update({ theme: 'light', weightUnit })}
        />
        <Button
          title="Use Device Theme"
          selected={theme === 'system'}
          variant="secondary"
          onPress={() => update({ theme: 'system', weightUnit })}
        />
      </Card>
      <Card title="Weight unit">
        <Text tone="muted">
          Weights are stored in kilograms and converted for display.
        </Text>
        <Button
          title="Kilograms"
          selected={weightUnit === 'kg'}
          variant="secondary"
          onPress={() => update({ theme, weightUnit: 'kg' })}
        />
        <Button
          title="Pounds"
          selected={weightUnit === 'lb'}
          variant="secondary"
          onPress={() => update({ theme, weightUnit: 'lb' })}
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
