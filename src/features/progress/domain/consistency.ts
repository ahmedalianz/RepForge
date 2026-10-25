import {
  localDayStart,
  localDayKey,
  shiftDays,
} from '../../../shared/utils/calendar';
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
