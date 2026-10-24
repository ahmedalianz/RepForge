import {
  calculateProgressPercentage,
  calculateVolumeLoad,
  convertWeight,
  estimateOneRepMax,
  rirToRpe,
  type VolumeSet,
} from '../../src/features/workouts/domain/strength';

describe('strength calculations without a React Native runtime', () => {
  test('Epley estimate and single recorded repetition', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.6667, 3);
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 6, { divisor: 25, maxReps: 8 })).toBe(124);
  });
  test.each([
    [0, 5],
    [-1, 5],
    [NaN, 5],
    [Infinity, 5],
    [100, 0],
    [100, 11],
    [100, 1.5],
  ])('rejects invalid estimate %s × %s', (weight, reps) => {
    expect(() => estimateOneRepMax(weight, reps)).toThrow(RangeError);
  });
  test('validates formula configuration and overflow', () => {
    expect(() =>
      estimateOneRepMax(100, 5, { divisor: 0, maxReps: 10 }),
    ).toThrow();
    expect(() => estimateOneRepMax(Number.MAX_VALUE, 10)).toThrow();
  });
  test.each([
    [0, 10],
    [2, 8],
    [3.5, 6.5],
    [10, 0],
  ])('RIR %s becomes RPE %s', (rir, rpe) => expect(rirToRpe(rir)).toBe(rpe));
  test.each([-1, 11, NaN, Infinity])('rejects invalid RIR %s', rir =>
    expect(() => rirToRpe(rir)).toThrow(RangeError),
  );
  test('converts weight without rounding stored values', () => {
    expect(convertWeight(100, 'kg', 'lb')).toBeCloseTo(220.462262);
    expect(
      convertWeight(convertWeight(75.5, 'kg', 'lb'), 'lb', 'kg'),
    ).toBeCloseTo(75.5, 10);
    expect(convertWeight(0, 'kg', 'lb')).toBe(0);
    expect(convertWeight(80, 'kg', 'kg')).toBe(80);
    expect(() => convertWeight(-10, 'lb', 'kg')).toThrow();
    expect(() => convertWeight(Infinity, 'kg', 'kg')).toThrow();
  });
  const working: VolumeSet = {
    loadType: 'external',
    weightKg: 100,
    reps: 5,
    kind: 'working',
    completedAt: 1000,
  };
  test('volume excludes warmups, incomplete, bodyweight and assisted sets', () => {
    const sets: VolumeSet[] = [
      working,
      { ...working, kind: 'warmup' },
      { ...working, completedAt: null },
      { ...working, loadType: 'bodyweight', weightKg: null },
      { ...working, loadType: 'assisted', weightKg: 20 },
    ];
    expect(calculateVolumeLoad(sets)).toBe(500);
    expect(calculateVolumeLoad(sets, { includeWarmups: true })).toBe(1000);
    expect(calculateVolumeLoad([])).toBe(0);
  });
  test('volume rejects missing external load and invalid reps', () => {
    expect(() =>
      calculateVolumeLoad([{ ...working, weightKg: null }]),
    ).toThrow();
    expect(() => calculateVolumeLoad([{ ...working, reps: 1.5 }])).toThrow();
    expect(() =>
      calculateVolumeLoad([{ ...working, weightKg: NaN }]),
    ).toThrow();
  });
  test('progress uses a baseline, supports both directions, and clamps', () => {
    expect(calculateProgressPercentage(75, 50, 100)).toBe(50);
    expect(calculateProgressPercentage(75, 100, 50)).toBe(50);
    expect(calculateProgressPercentage(120, 50, 100)).toBe(100);
    expect(calculateProgressPercentage(20, 50, 100)).toBe(0);
    expect(() => calculateProgressPercentage(10, 10, 10)).toThrow();
    expect(() => calculateProgressPercentage(NaN, 0, 10)).toThrow();
  });
});
