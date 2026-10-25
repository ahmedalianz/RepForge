export {
  DAYS_PER_WEEK,
  localDayStart,
  localDayKey,
  shiftDays,
  getWeekDays,
} from '../../../shared/utils/calendar';
import type { LoadRecord } from '../../progress/domain/types';
export type DayActivity = {
  date: number;
  label: string;
  workouts: number;
  volumeKg: number;
  isToday: boolean;
  isFuture: boolean;
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
export const LOAD_COMPARISON_DAYS = 30;
export { calculateTrainingStreak } from '../../progress/domain/consistency';
