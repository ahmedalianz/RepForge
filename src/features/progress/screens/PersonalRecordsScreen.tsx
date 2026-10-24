import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
export function PersonalRecordsScreen() {
  return (
    <Screen>
      <EmptyState
        title="Personal Records"
        message="Recorded lifts and estimated one-rep maximums will be shown separately. No records yet."
      />
    </Screen>
  );
}
