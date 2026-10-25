import { useTranslation } from 'react-i18next';
import { useStartWorkout } from '../../workouts/hooks/useStartWorkout';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../../../app/theme/tokens';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Screen } from '../../../shared/components/Screen';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Button } from '../../../shared/components/Button';
import { TrainingHeader } from '../../../shared/components/TrainingHeader';
import { WorkoutHero } from '../components/WorkoutHero';
import { WeeklyActivity } from '../components/WeeklyActivity';
import { RecordSummary } from '../components/RecordSummary';
import { QuickStats } from '../components/QuickStats';
import { useDashboard } from '../hooks/useDashboard';
export function HomeScreen() {
  const { t } = useTranslation('home');
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { state, refresh } = useDashboard();
  const streak = state.status === 'ready' ? state.dashboard.streak : undefined;
  const startWorkout = useStartWorkout();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrainingHeader
        streak={streak}
        onProfile={() => navigation.navigate('Main', { screen: 'Profile' })}
      />
      {state.status === 'loading' ? (
        <LoadingState message={t('loading')} />
      ) : (
        <Screen contentStyle={styles.content}>
          {/* TODO: need better ui for the error here */}
          {state.status === 'error' ? (
            <EmptyState title={t('unavailable')} message={state.message}>
              <Button title={t('retry')} onPress={refresh} />
            </EmptyState>
          ) : (
            <>
              <WorkoutHero
                greeting={state.dashboard.greeting}
                hasActiveSession={state.activeSession !== null}
                onStart={startWorkout}
              />
              <WeeklyActivity dashboard={state.dashboard} />
              <RecordSummary
                dashboard={state.dashboard}
                onRecords={() => navigation.navigate('PersonalRecords')}
              />
              <QuickStats dashboard={state.dashboard} />
            </>
          )}
        </Screen>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
});
