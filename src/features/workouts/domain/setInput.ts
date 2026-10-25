import { normalizeNumericInput } from '../../../localization/format';
import { t } from '../../../localization/i18n';
import { convertWeight, type WeightUnit } from './strength';
import type { WorkoutExercise, WorkoutSet } from './types';
export type SetInput = { weight: string; reps: string; rpe: string };
export type SetInputField = keyof SetInput;
export type SetInputResult =
  { valid: true; set: WorkoutSet } | { valid: false; message: string };
export function getSetInput(set: WorkoutSet, unit: WeightUnit): SetInput {
  return {
    weight:
      set.weightKg === null
        ? ''
        : convertWeight(set.weightKg, 'kg', unit).toFixed(2).replace(/0$/, ''),
    reps: set.reps ? String(set.reps) : '',
    rpe: set.rpe === null ? '' : String(set.rpe),
  };
}
function decimal(text: string): number | null {
  const value = normalizeNumericInput(text).replace(',', '.').trim();
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) &&
    Number.isFinite(Number(value))
    ? Number(value)
    : null;
}
export function parseSetInput(
  base: WorkoutSet,
  input: SetInput,
  unit: WeightUnit,
  requireComplete: boolean,
  weightEdited: boolean,
): SetInputResult {
  const weight =
    base.loadType === 'bodyweight'
      ? null
      : input.weight.trim() === '' && !requireComplete
        ? 0
        : decimal(input.weight);
  const reps =
    input.reps.trim() === '' && !requireComplete ? 0 : decimal(input.reps);
  const rpe = input.rpe.trim() === '' ? null : decimal(input.rpe);
  if (base.loadType !== 'bodyweight' && weight === null) {
    return { valid: false, message: t('validation:load') };
  }
  if (
    reps === null ||
    !Number.isSafeInteger(reps) ||
    (requireComplete && reps < 1)
  ) {
    return {
      valid: false,
      message: t('validation:reps'),
    };
  }
  if (input.rpe.trim() !== '' && (rpe === null || rpe > 10)) {
    return {
      valid: false,
      message: t('validation:rpe'),
    };
  }
  const weightKg =
    base.loadType === 'bodyweight'
      ? null
      : weightEdited
        ? convertWeight(weight ?? 0, unit, 'kg')
        : base.weightKg;
  return { valid: true, set: { ...base, weightKg, reps, rpe } };
}
export function isNewRecordedLoad(
  set: WorkoutSet,
  group: WorkoutExercise,
): boolean {
  if (set.loadType !== 'external' || set.kind !== 'working' || !set.weightKg) {
    return false;
  }
  const prior = Math.max(
    group.previousBest?.weightKg ?? 0,
    ...group.sets
      .filter(
        candidate =>
          candidate.id !== set.id &&
          candidate.kind === 'working' &&
          candidate.completedAt !== null,
      )
      .map(candidate => candidate.weightKg ?? 0),
  );
  return set.weightKg > prior;
}
export const PLATE_STEPS: Record<WeightUnit, readonly number[]> = {
  kg: [-2.5, -1.25, 1.25, 2.5],
  lb: [-5, -2.5, 2.5, 5],
};
