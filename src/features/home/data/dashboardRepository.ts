import { readLoadRecords } from '../../../database/repositories/loadRecordRepository';
import type { Database } from '../../../database/types';
import {
  calculateTrainingStreak,
  getWeekDays,
  localDayKey,
  shiftDays,
  LOAD_COMPARISON_DAYS,
  type DashboardSnapshot,
} from '../domain/dashboard';
function volumeBetween(database: Database, start: number, end: number): number {
  return Number(
    database.execute(
      'SELECT COALESCE(SUM(weight_kg * reps), 0) AS volume FROM completed_external_working_sets WHERE completed_at >= ? AND completed_at < ?',
      [start, end],
    ).rows[0]?.volume ?? 0,
  );
}
export function readDashboard(
  database: Database,
  now: number,
): DashboardSnapshot {
  return database.transaction(tx => {
    const days = getWeekDays(now).map(day => {
      const end = Math.min(day.end, now + 1);
      const workouts = Number(
        tx.execute(
          "SELECT COUNT(*) AS count FROM workout_sessions WHERE status = 'completed' AND completed_at >= ? AND completed_at < ?",
          [day.start, end],
        ).rows[0]?.count ?? 0,
      );
      return {
        date: day.start,
        label: day.label,
        workouts,
        volumeKg: volumeBetween(tx, day.start, end),
        isToday: localDayKey(day.start) === localDayKey(now),
        isFuture: day.start > now,
      };
    });
    const weekStart = days[0]?.date ?? now;
    const activeTimeMs = Number(
      tx.execute(
        "SELECT COALESCE(SUM(completed_at - started_at), 0) AS duration FROM workout_sessions WHERE status = 'completed' AND completed_at >= ? AND completed_at <= ?",
        [weekStart, now],
      ).rows[0]?.duration ?? 0,
    );
    const completedDays = tx
      .execute(
        "SELECT DISTINCT date(completed_at / 1000, 'unixepoch', 'localtime') AS day FROM workout_sessions WHERE status = 'completed' AND completed_at <= ? ORDER BY day DESC",
        [now],
      )
      .rows.map(row => String(row.day));
    const recentRecord = readLoadRecords(tx, now, 1)[0] ?? null;
    const recentStart = shiftDays(
      new Date(now + 1),
      -LOAD_COMPARISON_DAYS,
    ).getTime();
    const previousStart = shiftDays(
      new Date(recentStart),
      -LOAD_COMPARISON_DAYS,
    ).getTime();
    const previousEnd = recentStart;
    return {
      days,
      weeklyWorkouts: days.reduce((sum, day) => sum + day.workouts, 0),
      weeklyVolumeKg: days.reduce((sum, day) => sum + day.volumeKg, 0),
      totalWorkouts: Number(
        tx.execute(
          "SELECT COUNT(*) AS count FROM workout_sessions WHERE status = 'completed' AND completed_at <= ?",
          [now],
        ).rows[0]?.count ?? 0,
      ),
      activeTimeMs,
      streakDays: calculateTrainingStreak(completedDays, now),
      recentRecord,
      recentVolumeKg: volumeBetween(tx, recentStart, now + 1),
      previousVolumeKg: volumeBetween(tx, previousStart, previousEnd),
    };
  });
}
