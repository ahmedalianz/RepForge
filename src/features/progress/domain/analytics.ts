import {
  estimateOneRepMax,
  DEFAULT_EPLEY_OPTIONS,
} from '../../workouts/domain/strength';
import {
  getWeekDays,
  localDayKey,
  localDayStart,
  shiftDays,
} from '../../../shared/utils/calendar';
import { calculateTrainingStreak } from './consistency';
import type {
  ChartPoint,
  ProgressRange,
  ProgressSnapshot,
  ProgressSet,
  Split,
  TrainingWeek,
} from './types';
export function getRangeStart(range: ProgressRange, now: number): number {
  if (range === 'ALL') {
    return 0;
  }
  const date = localDayStart(now);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(
    date.getMonth() - { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[range],
  );
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  date.setDate(Math.min(day, lastDay));
  return date.getTime();
}
function splitFor(muscle: string): Split {
  const normalized = muscle.toLowerCase().trim();
  if (['chest', 'shoulders', 'front delts', 'triceps'].includes(normalized)) {
    return 'push';
  }
  if (['back', 'lats', 'biceps', 'rear delts'].includes(normalized)) {
    return 'pull';
  }
  if (
    [
      'legs',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'posterior chain',
    ].includes(normalized)
  ) {
    return 'legs';
  }
  return 'other';
}
export function percentageChange(
  current: number,
  previous: number,
): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}
function externalVolume(sets: ProgressSet[]): number {
  return sets.reduce(
    (sum, set) =>
      sum + (set.loadType === 'external' ? (set.weightKg ?? 0) * set.reps : 0),
    0,
  );
}
function dailyPoints(
  entries: { date: number; value: number }[],
  mode: 'max' | 'sum',
  calendarRange?: { start: number; end: number },
): ChartPoint[] {
  const values = new Map<number, number>();
  for (const entry of entries) {
    const date = localDayStart(entry.date).getTime();
    values.set(
      date,
      mode === 'max'
        ? Math.max(values.get(date) ?? 0, entry.value)
        : (values.get(date) ?? 0) + entry.value,
    );
  }
  if (calendarRange && values.size) {
    for (
      let day = localDayStart(calendarRange.start);
      day.getTime() <= calendarRange.end;
      day = shiftDays(day, 1)
    ) {
      const date = day.getTime();
      if (!values.has(date)) {
        values.set(date, 0);
      }
    }
  }
  return [...values]
    .sort(([a], [b]) => a - b)
    .map(([date, value]) => ({ date, value }));
}
export function summarizeProgress(
  snapshot: ProgressSnapshot,
  exerciseId: string | null,
  range: ProgressRange,
  now: number,
) {
  const start = getRangeStart(range, now);
  const previousStart = range === 'ALL' ? 0 : getRangeStart(range, start);
  const periodSets = snapshot.sets.filter(set => set.completedAt >= start);
  const sessions = snapshot.sessions.filter(
    session => session.completedAt >= start,
  );
  const exerciseSets = snapshot.sets.filter(
    set => set.exerciseId === exerciseId,
  );
  const external = exerciseSets.filter(
    set => set.loadType === 'external' && (set.weightKg ?? 0) > 0,
  );
  const best = external.reduce<ProgressSet | null>(
    (record, set) =>
      !record ||
      set.weightKg! > record.weightKg! ||
      (set.weightKg === record.weightKg && set.reps > record.reps)
        ? set
        : record,
    null,
  );
  const points = dailyPoints(
    external
      .filter(
        set =>
          set.completedAt >= start && set.reps <= DEFAULT_EPLEY_OPTIONS.maxReps,
      )
      .map(set => ({
        date: set.completedAt,
        value: estimateOneRepMax(set.weightKg!, set.reps),
      })),
    'max',
  );
  const first = points[0]?.value ?? null;
  const latest = points[points.length - 1]?.value ?? null;
  const weekStart = getWeekDays(now)[0]!.start;
  const weeks: TrainingWeek[] = Array.from({ length: 6 }, (_, index) => ({
    date: shiftDays(new Date(weekStart), (index - 5) * 7).getTime(),
    push: 0,
    pull: 0,
    legs: 0,
    other: 0,
  }));
  for (const set of snapshot.sets) {
    const week = weeks.find(
      (candidate, index) =>
        set.completedAt >= candidate.date &&
        (index === 5 || set.completedAt < weeks[index + 1]!.date),
    );
    if (week) {
      week[splitFor(set.muscle)]++;
    }
  }
  const volumeKg = externalVolume(periodSets);
  const previousVolumeKg = externalVolume(
    snapshot.sets.filter(
      set => set.completedAt >= previousStart && set.completedAt < start,
    ),
  );
  return {
    start,
    best,
    points,
    estimatedMaxKg: points.length
      ? Math.max(...points.map(point => point.value))
      : null,
    estimateChangePercent:
      points.length > 1 && first !== null && latest !== null
        ? percentageChange(latest, first)
        : null,
    volumeKg,
    previousVolumeKg,
    volumeChangePercent:
      range === 'ALL' ? null : percentageChange(volumeKg, previousVolumeKg),
    workingSets: periodSets.length,
    workouts: sessions.length,
    trainingDays: new Set(
      sessions.map(session => localDayKey(session.completedAt)),
    ).size,
    durationMs: sessions.reduce((sum, session) => sum + session.durationMs, 0),
    weeks,
    streakDays: calculateTrainingStreak(
      snapshot.sessions.map(session => localDayKey(session.completedAt)),
      now,
    ),
    volumePoints: dailyPoints(
      periodSets
        .filter(set => set.loadType === 'external')
        .map(set => ({
          date: set.completedAt,
          value: (set.weightKg ?? 0) * set.reps,
        })),
      'sum',
    ),
    activityPoints: dailyPoints(
      sessions.map(session => ({ date: session.completedAt, value: 1 })),
      'sum',
      {
        start: range === 'ALL' ? (sessions[0]?.completedAt ?? now) : start,
        end: now,
      },
    ),
    latestSet: exerciseSets[exerciseSets.length - 1] ?? null,
  };
}
export type ProgressSummary = ReturnType<typeof summarizeProgress>;
