import type { Database } from '../../../database/types';
import { createLocalId } from '../../../database/id';
import {
  requireActiveSession,
  writeWorkoutSet,
} from '../../../database/repositories/workoutSetWrites';
import { getExercise } from '../../exercises/data/exerciseRepository';
import { DEFAULT_REST_MS, REST_EXTENSION_MS } from '../domain/time';
import type {
  WorkoutEditorRepository,
  WorkoutSessionRepository,
  WorkoutSet,
} from '../domain/types';
import { readWorkoutEditor } from './workoutEditorReader';
function ensureRuntime(db: Database, sessionId: string): void {
  db.execute('INSERT OR IGNORE INTO workout_runtime(session_id) VALUES(?)', [
    sessionId,
  ]);
}
function select(
  db: Database,
  sessionId: string,
  exerciseId: string,
  setId: string | null,
): void {
  ensureRuntime(db, sessionId);
  db.execute(
    'UPDATE workout_runtime SET active_exercise_id = ?,active_set_id = ? WHERE session_id = ?',
    [exerciseId, setId, sessionId],
  );
}
function createSet(
  db: Database,
  sessionId: string,
  exerciseId: string,
): WorkoutSet {
  const exercise = getExercise(db, exerciseId);
  const order = Number(
    db.execute(
      'SELECT COALESCE(MAX(set_order),-1)+1 AS next FROM workout_sets WHERE session_id = ?',
      [sessionId],
    ).rows[0]?.next ?? 0,
  );
  const set: WorkoutSet = {
    id: createLocalId(db),
    sessionId,
    exerciseId,
    setOrder: order,
    weightKg: exercise.exerciseType === 'bodyweight' ? null : 0,
    reps: 0,
    rpe: null,
    kind: 'working',
    completedAt: null,
    loadType: exercise.exerciseType,
  };
  writeWorkoutSet(db, set);
  return set;
}
function selectNext(
  db: Database,
  sessionId: string,
  preferredExerciseId: string,
): void {
  const next = db.execute(
    `SELECT s.id,s.exercise_id FROM workout_sets s JOIN session_exercises e ON e.session_id = s.session_id AND e.exercise_id = s.exercise_id WHERE s.session_id = ? AND s.completed_at IS NULL ORDER BY CASE WHEN s.exercise_id = ? THEN 0 ELSE 1 END,e.exercise_order,s.set_order LIMIT 1`,
    [sessionId, preferredExerciseId],
  ).rows[0];
  const first = db.execute(
    'SELECT exercise_id FROM session_exercises WHERE session_id = ? ORDER BY exercise_order LIMIT 1',
    [sessionId],
  ).rows[0];
  ensureRuntime(db, sessionId);
  db.execute(
    'UPDATE workout_runtime SET active_exercise_id = ?,active_set_id = ? WHERE session_id = ?',
    [
      next
        ? String(next.exercise_id)
        : first
          ? String(first.exercise_id)
          : null,
      next ? String(next.id) : null,
      sessionId,
    ],
  );
}
export function createWorkoutEditorRepository(
  database: Database,
  core: WorkoutSessionRepository,
): WorkoutEditorRepository {
  return {
    getEditorState: id => readWorkoutEditor(database, core, id),
    addExercise: (sessionId, exerciseId) =>
      database.transaction(tx => {
        requireActiveSession(tx, sessionId);
        getExercise(tx, exerciseId);
        if (
          tx.execute(
            'SELECT 1 FROM session_exercises WHERE session_id = ? AND exercise_id = ?',
            [sessionId, exerciseId],
          ).rows.length
        ) {
          throw new Error('This exercise is already in your workout');
        }
        const order = Number(
          tx.execute(
            'SELECT COALESCE(MAX(exercise_order),-1)+1 AS next FROM session_exercises WHERE session_id = ?',
            [sessionId],
          ).rows[0]?.next ?? 0,
        );
        tx.execute('INSERT INTO session_exercises VALUES(?,?,?)', [
          sessionId,
          exerciseId,
          order,
        ]);
        const set = createSet(tx, sessionId, exerciseId);
        const current = tx.execute(
          'SELECT active_exercise_id,active_set_id FROM workout_runtime WHERE session_id = ?',
          [sessionId],
        ).rows[0];
        if (!current?.active_exercise_id || !current.active_set_id) {
          select(tx, sessionId, exerciseId, set.id);
        }
      }),
    selectExercise: (sessionId, exerciseId, setId) =>
      database.transaction(tx => {
        requireActiveSession(tx, sessionId);
        if (
          !tx.execute(
            'SELECT 1 FROM session_exercises WHERE session_id = ? AND exercise_id = ?',
            [sessionId, exerciseId],
          ).rows.length
        ) {
          throw new Error('Exercise is not in this workout');
        }
        const candidate = setId
          ? core
              .listSets(sessionId)
              .find(
                set =>
                  set.id === setId &&
                  set.exerciseId === exerciseId &&
                  set.completedAt === null,
              )
          : core
              .listSets(sessionId)
              .find(
                set =>
                  set.exerciseId === exerciseId && set.completedAt === null,
              );
        if (setId && !candidate) {
          throw new Error('Editable set not found');
        }
        select(tx, sessionId, exerciseId, candidate?.id ?? null);
      }),
    addSet: (sessionId, exerciseId) =>
      database.transaction(tx => {
        requireActiveSession(tx, sessionId);
        if (
          !tx.execute(
            'SELECT 1 FROM session_exercises WHERE session_id = ? AND exercise_id = ?',
            [sessionId, exerciseId],
          ).rows.length
        ) {
          throw new Error('Exercise is not in this workout');
        }
        const set = createSet(tx, sessionId, exerciseId);
        select(tx, sessionId, exerciseId, set.id);
      }),
    removeSet: (sessionId, setId) =>
      database.transaction(tx => {
        requireActiveSession(tx, sessionId);
        const set = core
          .listSets(sessionId)
          .find(candidate => candidate.id === setId);
        if (!set) {
          throw new Error('Set not found');
        }
        tx.execute('DELETE FROM workout_sets WHERE id = ? AND session_id = ?', [
          setId,
          sessionId,
        ]);
        selectNext(tx, sessionId, set.exerciseId);
      }),
    removeExercise: (sessionId, exerciseId) =>
      database.transaction(tx => {
        requireActiveSession(tx, sessionId);
        tx.execute(
          'DELETE FROM workout_sets WHERE session_id = ? AND exercise_id = ?',
          [sessionId, exerciseId],
        );
        tx.execute(
          'DELETE FROM session_exercises WHERE session_id = ? AND exercise_id = ?',
          [sessionId, exerciseId],
        );
        selectNext(tx, sessionId, exerciseId);
        tx.execute(
          'UPDATE workout_runtime SET rest_ends_at = NULL WHERE session_id = ?',
          [sessionId],
        );
      }),
    completeSet: set =>
      database.transaction(tx => {
        const stored = core
          .listSets(set.sessionId)
          .find(candidate => candidate.id === set.id);
        if (
          !stored ||
          stored.completedAt !== null ||
          stored.exerciseId !== set.exerciseId
        ) {
          throw new Error('This set is not available to log');
        }
        const now = Date.now();
        writeWorkoutSet(tx, { ...set, completedAt: now });
        ensureRuntime(tx, set.sessionId);
        tx.execute(
          'UPDATE workout_runtime SET rest_ends_at = ?,rest_duration_ms = ? WHERE session_id = ?',
          [now + DEFAULT_REST_MS, DEFAULT_REST_MS, set.sessionId],
        );
        selectNext(tx, set.sessionId, set.exerciseId);
      }),
    undoSet: set =>
      database.transaction(tx => {
        const stored = core
          .listSets(set.sessionId)
          .find(candidate => candidate.id === set.id);
        if (!stored || stored.completedAt === null) {
          throw new Error('Completed set not found');
        }
        writeWorkoutSet(tx, { ...stored, completedAt: null });
        select(tx, set.sessionId, stored.exerciseId, stored.id);
        tx.execute(
          'UPDATE workout_runtime SET rest_ends_at = NULL WHERE session_id = ?',
          [set.sessionId],
        );
      }),
    extendRest: id =>
      database.transaction(tx => {
        requireActiveSession(tx, id);
        ensureRuntime(tx, id);
        const runtime = tx.execute(
          'SELECT rest_ends_at,rest_duration_ms FROM workout_runtime WHERE session_id = ?',
          [id],
        ).rows[0];
        const now = Date.now();
        const existing = Number(runtime?.rest_ends_at ?? 0);
        const end = Math.max(now, existing) + REST_EXTENSION_MS;
        const duration =
          existing > now
            ? Math.max(
                Number(runtime?.rest_duration_ms ?? DEFAULT_REST_MS),
                end - now,
              )
            : REST_EXTENSION_MS;
        tx.execute(
          'UPDATE workout_runtime SET rest_ends_at = ?,rest_duration_ms = ? WHERE session_id = ?',
          [end, duration, id],
        );
      }),
    skipRest: id =>
      database.transaction(tx => {
        requireActiveSession(tx, id);
        ensureRuntime(tx, id);
        tx.execute(
          'UPDATE workout_runtime SET rest_ends_at = NULL WHERE session_id = ?',
          [id],
        );
      }),
  };
}
