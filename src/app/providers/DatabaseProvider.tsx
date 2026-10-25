import { useTranslation } from 'react-i18next';
import {
  initializeLocalization,
  t as translate,
} from '../../localization/i18n';
import {
  prepareNativeDirection,
  needsDirectionRestart,
} from '../../localization/direction';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { I18nManager, View, StyleSheet } from 'react-native';
import { getDatabase } from '../../database/connection';
import { createWorkoutRepository } from '../../database/repositories/workoutRepository';
import type { Database } from '../../database/types';
import type { WorkoutRepository } from '../../features/workouts/domain/types';
import { loadPreferences } from '../../services/storage/preferences';
import { usePreferencesStore } from '../config/preferencesStore';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { Button } from '../../shared/components/Button';
import { Text } from '../../shared/components/Text';
import { LoadingState } from '../../shared/components/LoadingState';
type Services = { database: Database; workouts: WorkoutRepository };
const DatabaseContext = createContext<Services | null>(null);
type StartupState =
  | { status: 'loading' }
  | { status: 'ready'; services: Services }
  | { status: 'error'; message: string }
  | { status: 'restart-required' };
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StartupState>({ status: 'loading' });
  const { colors } = useTheme();
  const { t } = useTranslation(['settings', 'common']);
  useEffect(() => {
    // Yield a frame so the loading state can render before synchronous native initialization.
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const database = getDatabase();
        const preferences = loadPreferences(database);
        prepareNativeDirection(preferences.language);
        await initializeLocalization(preferences.language);
        if (cancelled) {
          return;
        }
        usePreferencesStore.getState().setPreferences(preferences);
        if (needsDirectionRestart(preferences.language, I18nManager.isRTL)) {
          setState({ status: 'restart-required' });
          return;
        }
        setState({
          status: 'ready',
          services: { database, workouts: createWorkoutRepository(database) },
        });
      } catch {
        if (cancelled) {
          return;
        }
        setState({
          status: 'error',
          message: translate('settings:storageError'),
        });
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [attempt]);
  if (state.status === 'loading') {
    return <LoadingState message="" />;
  }
  if (state.status === 'restart-required') {
    return (
      <View style={[styles.error, { backgroundColor: colors.background }]}>
        <Text variant="heading">{t('readyRestart')}</Text>
        <Text>{t('pendingRestart')}</Text>
      </View>
    );
  }
  //TODO: need better ui for the error here
  if (state.status === 'error') {
    return (
      <View style={[styles.error, { backgroundColor: colors.background }]}>
        <Text variant="heading">{t('startupError')}</Text>
        <Text tone="danger" accessibilityRole="alert">
          {state.message}
        </Text>
        <Button
          title={t('common:retry')}
          onPress={() => {
            setState({ status: 'loading' });
            setAttempt(value => value + 1);
          }}
        />
      </View>
    );
  }
  return (
    <DatabaseContext.Provider value={state.services}>
      {children}
    </DatabaseContext.Provider>
  );
}
export function useDatabase(): Services {
  const services = useContext(DatabaseContext);
  if (!services) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return services;
}
const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
