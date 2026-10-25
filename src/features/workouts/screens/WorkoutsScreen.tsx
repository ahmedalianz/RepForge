import { useTranslation } from 'react-i18next';
import { t } from '../../../localization/i18n';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Button } from '../../../shared/components/Button';
import { Text } from '../../../shared/components/Text';
export function WorkoutsScreen() {
  useTranslation();
  const startWorkout = useStartWorkout();
  const { session, error } = useWorkoutSession();
  return (
    <Screen>
      <EmptyState title={t('workouts:log')} message={t('workouts:logMessage')}>
        <Button
          title={session ? t('workouts:resume') : t('workouts:start')}
          onPress={startWorkout}
        />
      </EmptyState>
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
