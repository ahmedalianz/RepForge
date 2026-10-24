import type { RootScreenProps } from '../../../app/navigation/types';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
export function ExerciseDetailsScreen({
  route,
}: RootScreenProps<'ExerciseDetails'>) {
  return (
    <Screen>
      <EmptyState
        title="Exercise Details"
        message={`Exercise reference: ${
          route.params?.exerciseId ?? 'none selected'
        }. The exercise catalog and technique details are planned for the next phase.`}
      />
    </Screen>
  );
}
