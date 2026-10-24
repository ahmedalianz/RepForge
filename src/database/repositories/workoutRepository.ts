import type {
  WorkoutRepository,
  WorkoutSessionRepository,
} from '../../features/workouts/domain/types';
import type { Database } from '../types';
import { createLocalId } from '../id';
import { mapSession, mapWorkoutSet } from './workoutRows';
import { requireActiveSession, writeWorkoutSet } from './workoutSetWrites';
import { createWorkoutEditorRepository } from '../../features/workouts/data/workoutEditorRepository';
export function createWorkoutRepository(database: Database): WorkoutRepository {
  const getSession: WorkoutSessionRepository['getSession'] = id => {
    const row = database.execute(
      'SELECT * FROM workout_sessions WHERE id = ?',
      [id],
    ).rows[0];
    return row ? mapSession(row) : null;
  };
  const getActiveSession: WorkoutSessionRepository['getActiveSession'] = () => {
    const row = database.execute(
      "SELECT * FROM workout_sessions WHERE status = 'active'",
    ).rows[0];
    return row ? mapSession(row) : null;
  };
  const core: WorkoutSessionRepository = {
    getSession,
    getActiveSession,
    startSession: () =>
      database.transaction(tx => {
        const existing = getActiveSession();
        if (existing) {
          return existing;
        }
        const id = createLocalId(tx);
        tx.execute(
          "INSERT INTO workout_sessions(id,started_at,status) VALUES(?,?,'active')",
          [id, Date.now()],
        );
        const session = getSession(id);
        if (!session) {
          throw new Error('Workout could not be created');
        }
        return session;
      }),
    listSets: sessionId =>
      database
        .execute(
          'SELECT * FROM workout_sets WHERE session_id = ? ORDER BY set_order',
          [sessionId],
        )
        .rows.map(mapWorkoutSet),
    saveSet: set => database.transaction(tx => writeWorkoutSet(tx, set)),
    finishSession: (id, status) =>
      database.transaction(tx => {
        const session = requireActiveSession(tx, id);
        if (
          status === 'completed' &&
          !tx.execute(
            'SELECT 1 FROM workout_sets WHERE session_id = ? AND completed_at IS NOT NULL LIMIT 1',
            [id],
          ).rows.length
        ) {
          throw new Error('Log at least one set before finishing your workout');
        }
        tx.execute(
          'UPDATE workout_sessions SET status = ?,completed_at = ? WHERE id = ?',
          [status, Math.max(Date.now(), session.startedAt), id],
        );
        tx.execute(
          'UPDATE workout_runtime SET rest_ends_at = NULL,active_set_id = NULL WHERE session_id = ?',
          [id],
        );
      }),
  };
  return { ...core, ...createWorkoutEditorRepository(database, core) };
}
