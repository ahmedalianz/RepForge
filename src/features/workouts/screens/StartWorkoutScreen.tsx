import type { RootScreenProps } from '../../../app/navigation/types';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Screen } from '../../../shared/components/Screen';
import { Card } from '../../../shared/components/Card';
import { Text } from '../../../shared/components/Text';
import { Button } from '../../../shared/components/Button';
export function StartWorkoutScreen({
  navigation,
}: RootScreenProps<'StartWorkout'>) {
  const { session, start, error } = useWorkoutSession();
  const title = session ? 'Resume Workout' : 'Begin Session';
  function begin() {
    const active = start();
    if (active) {
      navigation.replace('WorkoutDetails', { sessionId: active.id });
    }
  }
  return (
    <Screen>
      <Card title="Ready to train">
        <Text>
          A session is saved locally as soon as you begin. An unfinished session
          can be resumed after restarting the app.
        </Text>
        <Button title={title} onPress={begin} />
        {error ? (
          <Text tone="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}
