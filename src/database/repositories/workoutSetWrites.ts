import type { Database } from '../types';
import type { WorkoutSet } from '../../features/workouts/domain/types';
import { integer, nonNegative } from '../../shared/utils/validation';
import { mapSession } from './workoutRows';
export function requireActiveSession(database: Database, id: string) {
  const row = database.execute('SELECT * FROM workout_sessions WHERE id = ?', [
    id,
  ]).rows[0];
  if (!row || row.status !== 'active') {
    throw new Error('This workout is no longer active');
  }
  return mapSession(row);
}
/** Caller owns the transaction, allowing a completed set and rest deadline to commit atomically. */
export function writeWorkoutSet(database: Database, set: WorkoutSet): void {
  integer(set.setOrder, 'setOrder');
  integer(set.reps, 'reps');
  if (set.weightKg !== null) {
    nonNegative(set.weightKg, 'weightKg');
  }
  if (set.rpe !== null) {
    nonNegative(set.rpe, 'rpe');
    if (set.rpe > 10) {
      throw new RangeError('RPE must be between 0 and 10');
    }
  }
  if (set.completedAt !== null) {
    integer(set.completedAt, 'completedAt');
    if (set.reps < 1) {
      throw new RangeError('A completed set needs at least one rep');
    }
  }
  const session = requireActiveSession(database, set.sessionId);
  const exercise = database.execute(
    'SELECT exercise_type FROM exercises WHERE id = ?',
    [set.exerciseId],
  ).rows[0];
  if (exercise?.exercise_type !== set.loadType) {
    throw new Error('Set load type must match its exercise');
  }
  if (set.completedAt !== null && set.completedAt < session.startedAt) {
    throw new RangeError('Set completion precedes workout start');
  }
  const existing = database.execute(
    'SELECT session_id FROM workout_sets WHERE id = ?',
    [set.id],
  ).rows[0];
  if (existing && existing.session_id !== set.sessionId) {
    throw new Error('Cannot move a set between workouts');
  }
  database.execute(
    'INSERT OR IGNORE INTO session_exercises SELECT ?,?,COALESCE(MAX(exercise_order),-1)+1 FROM session_exercises WHERE session_id = ?',
    [set.sessionId, set.exerciseId, set.sessionId],
  );
  database.execute(
    `INSERT INTO workout_sets(id,session_id,exercise_id,set_order,load_type,weight_kg,reps,rpe,kind,completed_at) VALUES(?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET exercise_id=excluded.exercise_id,set_order=excluded.set_order,load_type=excluded.load_type,weight_kg=excluded.weight_kg,reps=excluded.reps,rpe=excluded.rpe,kind=excluded.kind,completed_at=excluded.completed_at`,
    [
      set.id,
      set.sessionId,
      set.exerciseId,
      set.setOrder,
      set.loadType,
      set.weightKg,
      set.reps,
      set.rpe,
      set.kind,
      set.completedAt,
    ],
  );
}
