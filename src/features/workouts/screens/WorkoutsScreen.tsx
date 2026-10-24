import { useNavigation } from '@react-navigation/native';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Button } from '../../../shared/components/Button';
import { Text } from '../../../shared/components/Text';
export function WorkoutsScreen() {
  const navigation = useNavigation();
  const { session, error } = useWorkoutSession();
  return (
    <Screen>
      <EmptyState
        title="Workout log"
        message="Session recovery is ready. Exercise logging and workout history will follow the final designs."
      >
        <Button
          title="Start Workout"
          onPress={() => navigation.navigate('StartWorkout')}
        />
        {session ? (
          <Button
            title="Resume Workout"
            variant="secondary"
            onPress={() =>
              navigation.navigate('WorkoutDetails', { sessionId: session.id })
            }
          />
        ) : null}
      </EmptyState>
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
