import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
export function GoalsScreen() {
  return (
    <Screen>
      <EmptyState
        title="Goals"
        message="Set and track your training goals here in a future update."
      />
    </Screen>
  );
}
