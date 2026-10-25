import {
  formatDate,
  formatPercent,
  unitLabel,
  ltrText,
} from '../../../localization/format';
import { t } from '../../../localization/i18n';
import { getExerciseName } from '../../../localization/exercises';
import { formatDuration } from '../../../shared/utils/formatDuration';
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

function relativeDay(timestamp: number, now: number): string {
  if (localDayKey(timestamp) === localDayKey(now)) {
    return t('home:today');
  }
  if (
    localDayKey(timestamp) ===
    localDayKey(shiftDays(localDayStart(now), -1).getTime())
  ) {
    return t('home:yesterday');
  }
  const date = new Date(timestamp);
  const today = new Date(now);
  const daysAgo =
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) /
    DAY_MS;
  if (daysAgo > 1 && daysAgo < 7) {
    return t('home:daysAgo', { count: daysAgo });
  }
  return formatDate(timestamp, {
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
      ? t('home:morning')
      : hour < 18
        ? t('home:afternoon')
        : t('home:evening');
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
    unit: unitLabel(unit),
    streak: t('home:streak', { count: snapshot.streakDays }),
    weeklyCount: snapshot.weeklyWorkouts,
    totalWorkouts: snapshot.totalWorkouts,
    weeklyWorkouts: t('home:completedWorkouts', {
      count: snapshot.weeklyWorkouts,
    }),
    weeklyVolume: formatLoad(snapshot.weeklyVolumeKg, unit),
    compactVolume: formatLoad(snapshot.weeklyVolumeKg, unit, true),
    activeTime: formatDuration(snapshot.activeTimeMs),
    days: snapshot.days.map(day => ({
      ...day,
      label: formatDate(day.date, { weekday: 'long' }),
      initial: formatDate(day.date, { weekday: 'narrow' }),
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
        ? t('home:today')
        : day.workouts
          ? formatLoad(day.volumeKg, unit, true)
          : '—',
      accessibilityLabel: t('home:dayAccessibility', {
        day: formatDate(day.date, { weekday: 'long' }),
        count: day.workouts,
        volume: formatLoad(day.volumeKg, unit),
        unit: unitLabel(unit),
      }),
    })),
    record: record
      ? {
          ...record,
          exerciseName: getExerciseName(record.exerciseId, record.exerciseName),
          date: relativeDay(record.completedAt, now),
          weight: formatLoad(record.weightKg, unit),
          delta:
            delta !== null && delta > 0
              ? ltrText(`+${formatLoad(delta, unit)} ${unitLabel(unit)}`)
              : null,
        }
      : null,
    estimate: estimatedKg === null ? '—' : formatLoad(estimatedKg, unit),
    loadChange: change === null ? '—' : formatPercent(change, 1, true),
    hasComparison: change !== null,
  };
}
export type DashboardPresentation = ReturnType<typeof getDashboardPresentation>;
