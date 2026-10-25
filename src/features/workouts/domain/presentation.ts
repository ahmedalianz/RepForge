import { formatNumber, unitLabel } from '../../../localization/format';
import { t } from '../../../localization/i18n';
import type { WeightUnit } from './strength';
import type { WorkoutExercise, WorkoutSet } from './types';
import { formatLoad } from './weightPresentation';
export function formatSetPerformance(
  set: Pick<WorkoutSet, 'weightKg' | 'loadType' | 'reps'>,
  unit: WeightUnit,
  full = false,
): string {
  const load =
    set.weightKg === null
      ? t('workouts:bodyweight')
      : `${formatLoad(set.weightKg, unit)}${full ? ` ${unitLabel(unit)}${set.loadType === 'assisted' ? t('workouts:assistSuffix') : ''}` : ''}`;
  return full
    ? t('workouts:performance', { load, reps: formatNumber(set.reps) })
    : `${load} × ${formatNumber(set.reps)}`;
}
export function getPreviousPerformance(
  group: WorkoutExercise,
  unit: WeightUnit,
) {
  if (group.previousBest) {
    return {
      label: t('workouts:previousBest'),
      value: t('workouts:performance', {
        load: `${formatLoad(group.previousBest.weightKg, unit)} ${unitLabel(unit)}`,
        reps: formatNumber(group.previousBest.reps),
      }),
      record: true,
    };
  }
  const working = group.previousSets.filter(set => set.kind === 'working');
  const last =
    working[working.length - 1] ??
    group.previousSets[group.previousSets.length - 1];
  return {
    label: t('workouts:previousSet'),
    value: last
      ? formatSetPerformance(last, unit, true)
      : t('workouts:noPrevious'),
    record: false,
  };
}
