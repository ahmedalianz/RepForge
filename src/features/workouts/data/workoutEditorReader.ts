import type { Database } from '../../../database/types';
import { getExercise } from '../../exercises/data/exerciseRepository';
import { mapWorkoutSet } from '../../../database/repositories/workoutRows';
import { DEFAULT_REST_MS } from '../domain/time';
import type {
  WorkoutEditorState,
  WorkoutSessionRepository,
} from '../domain/types';
export function readWorkoutEditor(
  database: Database,
  core: WorkoutSessionRepository,
  sessionId: string,
): WorkoutEditorState {
  const session = core.getSession(sessionId);
  if (!session) {
    throw new Error('Workout not found');
  }
  const sets = core.listSets(sessionId);
  const title = session.routineId
    ? String(
        database.execute('SELECT name FROM workout_routines WHERE id = ?', [
          session.routineId,
        ]).rows[0]?.name ?? 'Workout',
      )
    : 'Freestyle workout';
  const runtime = database.execute(
    'SELECT * FROM workout_runtime WHERE session_id = ?',
    [sessionId],
  ).rows[0];
  const exercises = database
    .execute(
      'SELECT exercise_id FROM session_exercises WHERE session_id = ? ORDER BY exercise_order',
      [sessionId],
    )
    .rows.map(row => {
      const id = String(row.exercise_id);
      const previousSets = database
        .execute(
          `SELECT s.* FROM workout_sets s WHERE s.exercise_id = ? AND s.completed_at IS NOT NULL AND s.session_id = (
   SELECT w.id FROM workout_sessions w WHERE w.status = 'completed' AND w.completed_at < ? AND EXISTS(SELECT 1 FROM workout_sets p WHERE p.session_id = w.id AND p.exercise_id = ? AND p.completed_at IS NOT NULL) ORDER BY w.completed_at DESC LIMIT 1
  ) ORDER BY s.set_order`,
          [id, session.startedAt, id],
        )
        .rows.map(mapWorkoutSet);
      const previous = database.execute(
        'SELECT weight_kg,reps FROM completed_external_working_sets WHERE exercise_id = ? AND completed_at < ? ORDER BY weight_kg DESC,reps DESC,completed_at DESC LIMIT 1',
        [id, session.startedAt],
      ).rows[0];
      return {
        exercise: getExercise(database, id),
        sets: sets.filter(set => set.exerciseId === id),
        previousSets,
        previousBest: previous
          ? {
              weightKg: Number(previous.weight_kg),
              reps: Number(previous.reps),
            }
          : null,
      };
    });
  const activeExerciseId = runtime?.active_exercise_id
    ? String(runtime.active_exercise_id)
    : (exercises[0]?.exercise.id ?? null);
  const activeSetId = runtime?.active_set_id
    ? String(runtime.active_set_id)
    : (sets.find(
        set => set.exerciseId === activeExerciseId && set.completedAt === null,
      )?.id ?? null);
  return {
    title,
    exercises,
    runtime: {
      activeExerciseId,
      activeSetId,
      restEndsAt:
        runtime?.rest_ends_at == null ? null : Number(runtime.rest_ends_at),
      restDurationMs: Number(runtime?.rest_duration_ms ?? DEFAULT_REST_MS),
    },
  };
}
