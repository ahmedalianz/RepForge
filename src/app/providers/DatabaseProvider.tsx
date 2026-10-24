import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { View, StyleSheet } from 'react-native';
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
  | { status: 'error'; message: string };
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<StartupState>({ status: 'loading' });
  const { colors } = useTheme();
  useEffect(() => {
    // Yield a frame so the loading state can render before synchronous native initialization.
    const timeout = setTimeout(() => {
      try {
        const database = getDatabase();
        usePreferencesStore
          .getState()
          .setPreferences(loadPreferences(database));
        setState({
          status: 'ready',
          services: { database, workouts: createWorkoutRepository(database) },
        });
      } catch (error) {
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to open local storage',
        });
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [attempt]);
  if (state.status === 'loading') {
    return <LoadingState />;
  }
  //TODO: need better ui for the error here
  if (state.status === 'error') {
    return (
      <View style={[styles.error, { backgroundColor: colors.background }]}>
        <Text variant="heading">Your training log could not open</Text>
        <Text tone="danger" accessibilityRole="alert">
          {state.message}
        </Text>
        <Button
          title="Retry"
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
