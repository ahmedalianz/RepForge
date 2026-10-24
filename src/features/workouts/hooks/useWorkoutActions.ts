import { Alert } from 'react-native';
import type { RootScreenProps } from '../../../app/navigation/types';
import type { ActiveWorkoutViewModel } from './useActiveWorkout';
export function useWorkoutActions(
  vm: ActiveWorkoutViewModel,
  navigation: RootScreenProps<'WorkoutDetails'>['navigation'],
) {
  function minimize() {
    if (!vm.checkpoint()) {
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'Home' });
    }
  }
  function finishNow(status: 'completed' | 'abandoned') {
    if (vm.finish(status)) {
      navigation.popTo('Main', { screen: 'Home' });
    }
  }
  function finish() {
    if (!vm.completedSets) {
      vm.reportError('Log at least one set before finishing your workout');
      return;
    }
    if (vm.pendingSets) {
      Alert.alert(
        'Finish workout?',
        `${vm.pendingSets} unfinished sets will remain unlogged. Your completed sets are saved.`,
        [
          { text: 'Keep Training', style: 'cancel' },
          { text: 'Finish Workout', onPress: () => finishNow('completed') },
        ],
      );
    } else {
      finishNow('completed');
    }
  }
  function discard() {
    Alert.alert(
      'Discard workout?',
      'This session will be marked abandoned and will not count toward your progress.',
      [
        { text: 'Keep Training', style: 'cancel' },
        {
          text: 'Discard Workout',
          style: 'destructive',
          onPress: () => finishNow('abandoned'),
        },
      ],
    );
  }
  function setOptions() {
    if (!vm.activeSet) {
      return;
    }
    Alert.alert(
      'Set options',
      `Set ${vm.selected?.sets.findIndex(set => set.id === vm.activeSet?.id)! + 1}`,
      [
        {
          text:
            vm.activeSet.kind === 'working'
              ? 'Mark as Warm-up'
              : 'Mark as Working Set',
          onPress: () => vm.toggleKind(),
        },
        {
          text: 'Delete Set',
          style: 'destructive',
          onPress: () => vm.removeSet(),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }
  function exerciseOptions() {
    if (!vm.selected) {
      return;
    }
    Alert.alert(vm.selected.exercise.name, 'Exercise options', [
      {
        text: 'Exercise Details',
        onPress: () =>
          navigation.navigate('ExerciseDetails', {
            exerciseId: vm.selected!.exercise.id,
          }),
      },
      {
        text: 'Remove Exercise',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Remove exercise?',
            'Its sets will be removed from this session.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => vm.removeExercise(),
              },
            ],
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
  return { minimize, finish, discard, setOptions, exerciseOptions };
}
