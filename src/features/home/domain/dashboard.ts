export type DayActivity = {
  date: number;
  label: string;
  workouts: number;
  volumeKg: number;
  isToday: boolean;
  isFuture: boolean;
};
export type LoadRecord = {
  setId: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  previousWeightKg: number | null;
  reps: number;
  completedAt: number;
};
export type DashboardSnapshot = {
  days: DayActivity[];
  weeklyWorkouts: number;
  totalWorkouts: number;
  weeklyVolumeKg: number;
  activeTimeMs: number;
  streakDays: number;
  recentRecord: LoadRecord | null;
  recentVolumeKg: number;
  previousVolumeKg: number;
};
export const DAYS_PER_WEEK = 7;
export const LOAD_COMPARISON_DAYS = 30;
export function localDayStart(timestamp: number): Date {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date;
}
export function shiftDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}
export function localDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function getWeekDays(
  now: number,
): { start: number; end: number; label: string }[] {
  const today = localDayStart(now);
  const monday = shiftDays(today, -((today.getDay() + 6) % DAYS_PER_WEEK));
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const day = shiftDays(monday, index);
    return {
      start: day.getTime(),
      end: shiftDays(day, 1).getTime(),
      label: day.toLocaleDateString('en', { weekday: 'long' }),
    };
  });
}
/** An untrained day is not a planned rest day. Streaks allow today to remain unfinished. */
export function calculateTrainingStreak(
  completedDays: readonly string[],
  now: number,
): number {
  const days = new Set(completedDays);
  let day = localDayStart(now);
  if (!days.has(localDayKey(day.getTime()))) {
    day = shiftDays(day, -1);
  }
  let streak = 0;
  while (days.has(localDayKey(day.getTime()))) {
    streak += 1;
    day = shiftDays(day, -1);
  }
  return streak;
}
