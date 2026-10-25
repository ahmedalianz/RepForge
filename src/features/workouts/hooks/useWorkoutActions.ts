import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../localization/format';
import { getExerciseName } from '../../../localization/exercises';
import { t } from '../../../localization/i18n';
import { usePrompt } from '../../../app/providers/PromptProvider';
import type { RootScreenProps } from '../../../app/navigation/types';
import type { ActiveWorkoutViewModel } from './useActiveWorkout';
export function useWorkoutActions(
  vm: ActiveWorkoutViewModel,
  navigation: RootScreenProps<'WorkoutDetails'>['navigation'],
) {
  useTranslation();
  const showPrompt = usePrompt();
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
      vm.reportError(t('workouts:needSet'));
      return;
    }
    if (vm.pendingSets) {
      showPrompt(
        t('workouts:finishQuestion'),
        t('workouts:unfinished', { count: formatNumber(vm.pendingSets) }),
        [
          { text: t('workouts:keepTraining'), style: 'cancel' },
          {
            text: t('workouts:finishWorkout'),
            onPress: () => finishNow('completed'),
          },
        ],
      );
    } else {
      finishNow('completed');
    }
  }
  function discard() {
    showPrompt(t('workouts:discardQuestion'), t('workouts:discardMessage'), [
      { text: t('workouts:keepTraining'), style: 'cancel' },
      {
        text: t('workouts:discardWorkout'),
        style: 'destructive',
        onPress: () => finishNow('abandoned'),
      },
    ]);
  }
  function setOptions() {
    if (!vm.activeSet) {
      return;
    }
    showPrompt(
      t('workouts:setOptions'),
      t('workouts:setNumber', {
        number: formatNumber(
          vm.selected?.sets.findIndex(set => set.id === vm.activeSet?.id)! + 1,
        ),
      }),
      [
        {
          text:
            vm.activeSet.kind === 'working'
              ? t('workouts:warmupAction')
              : t('workouts:workingAction'),
          onPress: () => vm.toggleKind(),
        },
        {
          text: t('workouts:deleteSet'),
          style: 'destructive',
          onPress: () => vm.removeSet(),
        },
        { text: t('common:cancel'), style: 'cancel' },
      ],
    );
  }
  function exerciseOptions() {
    if (!vm.selected) {
      return;
    }
    showPrompt(
      getExerciseName(vm.selected.exercise.id, vm.selected.exercise.name),
      t('workouts:exerciseOptions'),
      [
        {
          text: t('workouts:exerciseDetails'),
          onPress: () =>
            navigation.navigate('ExerciseDetails', {
              exerciseId: vm.selected!.exercise.id,
            }),
        },
        {
          text: t('workouts:removeExercise'),
          style: 'destructive',
          onPress: () =>
            showPrompt(
              t('workouts:removeQuestion'),
              t('workouts:removeMessage'),
              [
                { text: t('common:cancel'), style: 'cancel' },
                {
                  text: t('workouts:remove'),
                  style: 'destructive',
                  onPress: () => vm.removeExercise(),
                },
              ],
            ),
        },
        { text: t('common:cancel'), style: 'cancel' },
      ],
    );
  }
  return { minimize, finish, discard, setOptions, exerciseOptions };
}
