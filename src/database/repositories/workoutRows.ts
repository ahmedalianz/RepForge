import type { SqlRow } from '../types';
import type {
  WorkoutSession,
  WorkoutSet,
} from '../../features/workouts/domain/types';
export function mapSession(row: SqlRow): WorkoutSession {
  return {
    id: String(row.id),
    routineId: row.routine_id === null ? null : String(row.routine_id),
    startedAt: Number(row.started_at),
    completedAt: row.completed_at === null ? null : Number(row.completed_at),
    status: row.status as WorkoutSession['status'],
  };
}
export function mapWorkoutSet(row: SqlRow): WorkoutSet {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    exerciseId: String(row.exercise_id),
    setOrder: Number(row.set_order),
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    reps: Number(row.reps),
    rpe: row.rpe === null ? null : Number(row.rpe),
    completedAt: row.completed_at === null ? null : Number(row.completed_at),
    loadType: row.load_type as WorkoutSet['loadType'],
    kind: row.kind as WorkoutSet['kind'],
  };
}
