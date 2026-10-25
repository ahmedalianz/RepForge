import type { WorkoutSet } from '../../workouts/domain/types';
export type LoadRecord = {
  setId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  previousWeightKg: number | null;
  reps: number;
  completedAt: number;
};
export type ProgressSet = Pick<
  WorkoutSet,
  'id' | 'sessionId' | 'exerciseId' | 'loadType' | 'weightKg' | 'reps' | 'rpe'
> & {
  completedAt: number;
  exerciseName: string;
  muscle: string;
};
export type ProgressSession = {
  id: string;
  completedAt: number;
  durationMs: number;
};
export type AnalyticsExercise = {
  id: string;
  name: string;
  exerciseType: WorkoutSet['loadType'];
};
export type ProgressSnapshot = {
  exercises: AnalyticsExercise[];
  sets: ProgressSet[];
  sessions: ProgressSession[];
  records: LoadRecord[];
};
export const PROGRESS_RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const;
export type ProgressRange = (typeof PROGRESS_RANGES)[number];
export type ProgressView = 'strength' | 'volume' | 'consistency';
export type ChartPoint = { date: number; value: number };
export type Split = 'push' | 'pull' | 'legs' | 'other';
export type TrainingWeek = Record<Split, number> & { date: number };
