import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Button } from '../../../shared/components/Button';
export function ProgressScreen() {
  const navigation = useNavigation();
  return (
    <Screen>
      <EmptyState
        title="Progress"
        message="Training trends will appear here once workout logging is available."
      >
        <Button
          title="Personal Records"
          onPress={() => navigation.navigate('PersonalRecords')}
        />
        <Button
          title="Goals"
          variant="secondary"
          onPress={() => navigation.navigate('Goals')}
        />
      </EmptyState>
    </Screen>
  );
}
