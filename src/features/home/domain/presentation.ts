import {
  estimateOneRepMax,
  DEFAULT_EPLEY_OPTIONS,
  type WeightUnit,
} from '../../workouts/domain/strength';
import {
  localDayKey,
  localDayStart,
  shiftDays,
  type DashboardSnapshot,
} from './dashboard';
import { formatLoad } from '../../workouts/domain/weightPresentation';
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / MINUTE_MS);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h${minutes % 60}m` : `${minutes}m`;
}
function relativeDay(timestamp: number, now: number): string {
  if (localDayKey(timestamp) === localDayKey(now)) {
    return 'Today';
  }
  if (
    localDayKey(timestamp) ===
    localDayKey(shiftDays(localDayStart(now), -1).getTime())
  ) {
    return 'Yesterday';
  }
  const date = new Date(timestamp);
  const today = new Date(now);
  const daysAgo =
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) /
    DAY_MS;
  if (daysAgo > 1 && daysAgo < 7) {
    return `${daysAgo} days ago`;
  }
  return new Date(timestamp).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
  });
}
export function getDashboardPresentation(
  snapshot: DashboardSnapshot,
  unit: WeightUnit,
  now: number,
) {
  const hour = new Date(now).getHours();
  const greeting =
    hour < 12
      ? 'Good morning, lifter'
      : hour < 18
        ? 'Good afternoon, lifter'
        : 'Good evening, lifter';
  const record = snapshot.recentRecord;
  const estimatedKg =
    record && record.reps <= DEFAULT_EPLEY_OPTIONS.maxReps
      ? estimateOneRepMax(record.weightKg, record.reps)
      : null;
  const delta =
    record?.previousWeightKg === null || !record
      ? null
      : record.weightKg - record.previousWeightKg;
  const change =
    snapshot.previousVolumeKg > 0
      ? ((snapshot.recentVolumeKg - snapshot.previousVolumeKg) /
          snapshot.previousVolumeKg) *
        100
      : null;
  const maxVolume = Math.max(...snapshot.days.map(day => day.volumeKg), 1);
  return {
    greeting,
    unit,
    streak: `${snapshot.streakDays} ${snapshot.streakDays === 1 ? 'Day' : 'Days'}`,
    weeklyCount: snapshot.weeklyWorkouts,
    totalWorkouts: snapshot.totalWorkouts,
    weeklyWorkouts: `${snapshot.weeklyWorkouts} ${snapshot.weeklyWorkouts === 1 ? 'workout' : 'workouts'} completed`,
    weeklyVolume: formatLoad(snapshot.weeklyVolumeKg, unit),
    compactVolume: formatLoad(snapshot.weeklyVolumeKg, unit, true),
    activeTime: formatDuration(snapshot.activeTimeMs),
    days: snapshot.days.map(day => ({
      ...day,
      initial: day.label[0] ?? '',
      volume: formatLoad(day.volumeKg, unit, true),
      barRatio: day.volumeKg / maxVolume,
      barTone:
        day.volumeKg === 0
          ? 'empty'
          : day.isToday
            ? 'today'
            : day.volumeKg === maxVolume
              ? 'peak'
              : 'history',
      barOpacity:
        day.volumeKg === 0
          ? 0.3
          : day.isToday || day.volumeKg === maxVolume
            ? 1
            : 0.35 + (day.volumeKg / maxVolume) * 0.25,
      statusLabel: day.isToday
        ? 'TODAY'
        : day.workouts
          ? formatLoad(day.volumeKg, unit, true)
          : '—',
      accessibilityLabel: `${day.label}${day.isToday ? ', today' : ''}, ${day.workouts} completed workouts, ${formatLoad(day.volumeKg, unit)} ${unit} external load`,
    })),
    record: record
      ? {
          ...record,
          date: relativeDay(record.completedAt, now),
          weight: formatLoad(record.weightKg, unit),
          delta:
            delta !== null && delta > 0
              ? `+${formatLoad(delta, unit)} ${unit}`
              : null,
        }
      : null,
    estimate: estimatedKg === null ? '—' : formatLoad(estimatedKg, unit),
    loadChange:
      change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    hasComparison: change !== null,
  };
}
export type DashboardPresentation = ReturnType<typeof getDashboardPresentation>;
