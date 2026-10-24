import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { spacing } from '../../../app/theme/tokens';
import type { RootScreenProps } from '../../../app/navigation/types';
import { Screen } from '../../../shared/components/Screen';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Button } from '../../../shared/components/Button';
import { Text } from '../../../shared/components/Text';
import { ExercisePicker } from '../../exercises/components/ExercisePicker';
import { WorkoutHeader } from '../components/WorkoutHeader';
import { RestCountdown } from '../components/RestCountdown';
import { WorkoutSetList } from '../components/WorkoutSetList';
import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { useWorkoutActions } from '../hooks/useWorkoutActions';
export function WorkoutDetailsScreen({
  route,
  navigation,
}: RootScreenProps<'WorkoutDetails'>) {
  const vm = useActiveWorkout(route.params.sessionId);
  const actions = useWorkoutActions(vm, navigation);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerError =
    vm.notice?.kind === 'error' ? vm.notice.message : undefined;
  if (vm.loading || (vm.session && !vm.editor && !vm.notice)) {
    return <LoadingState message="Opening your workout…" />;
  }
  if (!vm.session || !vm.editor) {
    return (
      <Screen>
        <EmptyState
          title="Session unavailable"
          message={
            vm.error ??
            vm.notice?.message ??
            'This workout could not be found on this device.'
          }
        >
          <Button title="Retry" onPress={vm.retry} />
          <Button title="Back" variant="secondary" onPress={actions.minimize} />
        </EmptyState>
      </Screen>
    );
  }
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <WorkoutHeader
        title={vm.editor.title}
        session={vm.session}
        canFinish={vm.completedSets > 0}
        onMinimize={actions.minimize}
        onFinish={actions.finish}
      />
      {vm.isActive ? (
        <RestCountdown
          runtime={vm.editor.runtime}
          onExtend={vm.extendRest}
          onSkip={vm.skipRest}
        />
      ) : null}
      {vm.notice ? (
        <View style={[styles.notice, { backgroundColor: colors.surfaceHigh }]}>
          <Text
            accessibilityRole={vm.notice.kind === 'error' ? 'alert' : undefined}
            accessibilityLiveRegion="polite"
            style={{
              color:
                vm.notice.kind === 'error' ? colors.danger : colors.primary,
            }}
          >
            {vm.notice.message}
          </Text>
        </View>
      ) : null}
      <WorkoutSetList
        vm={vm}
        onAddExercise={() => setPickerVisible(true)}
        onSetOptions={actions.setOptions}
        onExerciseOptions={actions.exerciseOptions}
        onFinish={actions.finish}
        onDiscard={actions.discard}
        onBack={actions.minimize}
      />
      <ExercisePicker
        visible={pickerVisible}
        selectedIds={vm.editor.exercises.map(group => group.exercise.id)}
        error={pickerError}
        onSelect={vm.addExercise}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  notice: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
