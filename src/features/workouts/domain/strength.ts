import {
  integer,
  nonNegative,
  positive,
} from '../../../shared/utils/validation';

export type WeightUnit = 'kg' | 'lb';
export const POUNDS_PER_KILOGRAM = 2.2046226218487757;
export const DEFAULT_EPLEY_OPTIONS = { divisor: 30, maxReps: 10 } as const;

/** An estimate for external-load lifts, not a measured PR. High rep estimates are excluded. */
export function estimateOneRepMax(
  weightKg: number,
  reps: number,
  options: { divisor: number; maxReps: number } = DEFAULT_EPLEY_OPTIONS,
): number {
  positive(weightKg, 'weightKg');
  integer(reps, 'reps');
  positive(options.divisor, 'divisor');
  integer(options.maxReps, 'maxReps');
  if (reps < 1 || reps > options.maxReps) {
    throw new RangeError(`reps must be between 1 and ${options.maxReps}`);
  }
  const estimate =
    reps === 1 ? weightKg : weightKg * (1 + reps / options.divisor);
  positive(estimate, 'estimatedOneRepMax');
  return estimate;
}

/** RIR is an athlete's subjective estimate. Fractional values are accepted; no clamping. */
export function rirToRpe(rir: number): number {
  nonNegative(rir, 'rir');
  if (rir > 10) {
    throw new RangeError('rir must be between 0 and 10');
  }
  return 10 - rir;
}

export function convertWeight(
  weight: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  nonNegative(weight, 'weight');
  const result =
    from === to
      ? weight
      : from === 'kg'
        ? weight * POUNDS_PER_KILOGRAM
        : weight / POUNDS_PER_KILOGRAM;
  nonNegative(result, 'convertedWeight');
  return result;
}

export type VolumeSet = {
  loadType: 'external' | 'bodyweight' | 'assisted';
  weightKg: number | null;
  reps: number;
  completedAt: number | null;
  kind: 'working' | 'warmup';
};

/** Only completed external-load working sets. Body mass and assistance need separate models.
 * Volume load alone does not measure hypertrophy or strength. */
export function calculateVolumeLoad(
  sets: readonly VolumeSet[],
  options = { includeWarmups: false },
): number {
  let volume = 0;
  for (const set of sets) {
    integer(set.reps, 'reps');
    if (set.weightKg !== null) {
      nonNegative(set.weightKg, 'weightKg');
    }
    if (set.loadType === 'external' && set.weightKg === null) {
      throw new RangeError('External-load sets require weightKg');
    }
    if (set.completedAt !== null) {
      integer(set.completedAt, 'completedAt');
    }
    if (
      set.loadType === 'external' &&
      set.completedAt !== null &&
      (set.kind === 'working' || options.includeWarmups)
    ) {
      volume += (set.weightKg ?? 0) * set.reps;
    }
  }
  nonNegative(volume, 'volume');
  return volume;
}

/** Baseline-to-target progress, bounded to 0–100. Supports increasing and decreasing goals. */
export function calculateProgressPercentage(
  current: number,
  baseline: number,
  target: number,
): number {
  nonNegative(current, 'current');
  nonNegative(baseline, 'baseline');
  nonNegative(target, 'target');
  if (target === baseline) {
    throw new RangeError('target must differ from baseline');
  }
  return Math.max(
    0,
    Math.min(100, ((current - baseline) / (target - baseline)) * 100),
  );
}

export type StrengthRecord =
  | { kind: 'recorded'; weightKg: number; reps: number; setId: string }
  | {
      kind: 'estimated';
      estimatedWeightKg: number;
      formula: 'epley';
      sourceSetId: string;
    };
