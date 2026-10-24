import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../../../app/theme/tokens';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Screen } from '../../../shared/components/Screen';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Button } from '../../../shared/components/Button';
import { DashboardHeader } from '../components/DashboardHeader';
import { WorkoutHero } from '../components/WorkoutHero';
import { WeeklyActivity } from '../components/WeeklyActivity';
import { RecordSummary } from '../components/RecordSummary';
import { QuickStats } from '../components/QuickStats';
import { useDashboard } from '../hooks/useDashboard';
export function HomeScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { state, refresh } = useDashboard();
  const streak = state.status === 'ready' ? state.dashboard.streak : undefined;
  function startWorkout() {
    if (state.status === 'ready' && state.activeSession) {
      navigation.navigate('WorkoutDetails', {
        sessionId: state.activeSession.id,
      });
    } else {
      navigation.navigate('StartWorkout');
    }
  }
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DashboardHeader
        streak={streak}
        onProfile={() => navigation.navigate('Main', { screen: 'Profile' })}
      />
      {state.status === 'loading' ? (
        <LoadingState message="Loading your training dashboard…" />
      ) : (
        <Screen contentStyle={styles.content}>
          {/* TODO: need better ui for the error here */}
          {state.status === 'error' ? (
            <EmptyState title="Dashboard unavailable" message={state.message}>
              <Button title="Retry" onPress={refresh} />
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
