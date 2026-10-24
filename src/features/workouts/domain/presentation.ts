import type { WeightUnit } from './strength';
import type { WorkoutExercise, WorkoutSet } from './types';
import { formatLoad } from './weightPresentation';
export function formatSetPerformance(
  set: WorkoutSet,
  unit: WeightUnit,
  full = false,
): string {
  const load =
    set.weightKg === null
      ? 'BW'
      : `${formatLoad(set.weightKg, unit)}${full ? ` ${unit}${set.loadType === 'assisted' ? ' assist' : ''}` : ''}`;
  return `${load} × ${set.reps}${full ? ' reps' : ''}`;
}
export function getPreviousPerformance(
  group: WorkoutExercise,
  unit: WeightUnit,
) {
  if (group.previousBest) {
    return {
      label: 'Previous Best:',
      value: `${formatLoad(group.previousBest.weightKg, unit)} ${unit} × ${group.previousBest.reps} reps`,
      record: true,
    };
  }
  const working = group.previousSets.filter(set => set.kind === 'working');
  const last =
    working[working.length - 1] ??
    group.previousSets[group.previousSets.length - 1];
  return {
    label: 'Previous Set:',
    value: last
      ? formatSetPerformance(last, unit, true)
      : 'No previous session',
    record: false,
  };
}
