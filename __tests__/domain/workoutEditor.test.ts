import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { createWorkoutRepository } from '../../src/database/repositories/workoutRepository';
import {
  getSetInput,
  parseSetInput,
  isNewRecordedLoad,
} from '../../src/features/workouts/domain/setInput';
import {
  DEFAULT_REST_MS,
  getRestState,
  formatWorkoutClock,
  REST_EXTENSION_MS,
} from '../../src/features/workouts/domain/time';
import { searchExercises } from '../../src/features/exercises/data/exerciseRepository';
import type { WorkoutSet } from '../../src/features/workouts/domain/types';

const now = new Date(2026, 9, 24, 18).getTime();
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
});
afterEach(() => jest.useRealTimers());
function setup() {
  const db = openDatabase();
  migrateDatabase(db);
  const repo = createWorkoutRepository(db);
  const session = repo.startSession();
  repo.addExercise(session.id, 'barbell-bench-press');
  return { db, repo, session };
}

test('catalog, drafts, selected exercise and rest deadline survive close/reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'repforge-editor-'));
  const path = join(dir, 'workout.sqlite');
  let db = openDatabase(path);
  try {
    migrateDatabase(db);
    let repo = createWorkoutRepository(db);
    const session = repo.startSession();
    repo.addExercise(session.id, 'barbell-bench-press');
    repo.addExercise(session.id, 'incline-dumbbell-press');
    let state = repo.getEditorState(session.id);
    const set = state.exercises[0]!.sets[0]!;
    repo.saveSet({ ...set, weightKg: 120, reps: 5, rpe: 9 });
    repo.completeSet({ ...set, weightKg: 120, reps: 5, rpe: 9 });
    state = repo.getEditorState(session.id);
    expect(state.exercises[0]!.sets[0]).toMatchObject({
      weightKg: 120,
      reps: 5,
      rpe: 9,
      completedAt: now,
    });
    expect(state.runtime.activeExerciseId).toBe('incline-dumbbell-press');
    expect(state.runtime.restEndsAt).toBe(now + DEFAULT_REST_MS);
    db.close();
    db = openDatabase(path);
    migrateDatabase(db);
    repo = createWorkoutRepository(db);
    const restored = repo.getEditorState(session.id);
    expect(restored).toEqual(state);
    jest.setSystemTime(now + 45_000);
    expect(
      getRestState(
        restored.runtime.restEndsAt,
        restored.runtime.restDurationMs,
        Date.now(),
      ).label,
    ).toBe('01:15');
    repo.extendRest(session.id);
    expect(repo.getEditorState(session.id).runtime.restEndsAt).toBe(
      now + DEFAULT_REST_MS + REST_EXTENSION_MS,
    );
    repo.skipRest(session.id);
    expect(repo.getEditorState(session.id).runtime.restEndsAt).toBeNull();
    expect(searchExercises(db, 'bench')[0]?.id).toBe('barbell-bench-press');
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('completion and timer rollback together; duplicate completion is rejected', () => {
  const { db, repo, session } = setup();
  try {
    const set = repo.getEditorState(session.id).exercises[0]!.sets[0]!;
    expect(() => repo.completeSet({ ...set, reps: 0 })).toThrow();
    expect(repo.getEditorState(session.id).runtime.restEndsAt).toBeNull();
    db.execute(
      "CREATE TRIGGER reject_rest BEFORE UPDATE OF rest_ends_at ON workout_runtime BEGIN SELECT RAISE(ABORT,'simulated rest failure'); END",
    );
    expect(() => repo.completeSet({ ...set, weightKg: 120, reps: 5 })).toThrow(
      'simulated',
    );
    expect(repo.listSets(session.id)[0]?.completedAt).toBeNull();
    db.execute('DROP TRIGGER reject_rest');
    repo.completeSet({ ...set, weightKg: 120, reps: 5 });
    expect(() => repo.completeSet({ ...set, weightKg: 120, reps: 5 })).toThrow(
      'available',
    );
    repo.undoSet(repo.listSets(session.id)[0]!);
    expect(repo.getEditorState(session.id).runtime.restEndsAt).toBeNull();
    expect(repo.listSets(session.id)[0]?.completedAt).toBeNull();
  } finally {
    db.close();
  }
});
test('exercise membership, set ordering, removal and finished-session protection', () => {
  const { db, repo, session } = setup();
  try {
    expect(() => repo.addExercise(session.id, 'barbell-bench-press')).toThrow(
      'already',
    );
    expect(() => repo.addSet(session.id, 'unknown')).toThrow();
    repo.addSet(session.id, 'barbell-bench-press');
    const sets = repo.listSets(session.id);
    expect(sets.map(set => set.setOrder)).toEqual([0, 1]);
    repo.removeSet(session.id, sets[1]!.id);
    expect(repo.listSets(session.id)).toHaveLength(1);
    expect(() => repo.finishSession(session.id, 'completed')).toThrow(
      'at least one',
    );
    repo.completeSet({ ...sets[0]!, weightKg: 80, reps: 10 });
    repo.finishSession(session.id, 'completed');
    expect(repo.getEditorState(session.id).runtime.restEndsAt).toBeNull();
    expect(() => repo.addSet(session.id, 'barbell-bench-press')).toThrow(
      'active',
    );
    expect(() =>
      repo.removeExercise(session.id, 'barbell-bench-press'),
    ).toThrow('active');
    expect(() => repo.extendRest(session.id)).toThrow('active');
  } finally {
    db.close();
  }
});
test('bodyweight and assistance remain distinct from external loading', () => {
  const { db, repo, session } = setup();
  try {
    repo.addExercise(session.id, 'pull-up');
    repo.addExercise(session.id, 'assisted-pull-up');
    const state = repo.getEditorState(session.id);
    const body = state.exercises.find(group => group.exercise.id === 'pull-up')!
      .sets[0]!;
    const assist = state.exercises.find(
      group => group.exercise.id === 'assisted-pull-up',
    )!.sets[0]!;
    expect(body.weightKg).toBeNull();
    expect(assist.loadType).toBe('assisted');
    repo.completeSet({ ...body, reps: 8 });
    repo.completeSet({ ...assist, weightKg: 20, reps: 10 });
    repo.removeExercise(session.id, 'barbell-bench-press');
    expect(repo.getEditorState(session.id).exercises).toHaveLength(2);
    expect(
      repo
        .listSets(session.id)
        .every(set => set.exerciseId !== 'barbell-bench-press'),
    ).toBe(true);
  } finally {
    db.close();
  }
});
test('input validation preserves canonical load when editing reps in pounds', () => {
  const base: WorkoutSet = {
    id: 'set',
    sessionId: 's',
    exerciseId: 'e',
    setOrder: 0,
    loadType: 'external',
    kind: 'working',
    weightKg: 100.12345,
    reps: 5,
    rpe: null,
    completedAt: null,
  };
  const input = getSetInput(base, 'lb');
  const result = parseSetInput(
    base,
    { ...input, reps: '6' },
    'lb',
    true,
    false,
  );
  expect(result.valid && result.set.weightKg).toBe(base.weightKg);
  expect(
    parseSetInput(
      base,
      { weight: '120,5', reps: '5', rpe: '9.5' },
      'kg',
      true,
      true,
    ),
  ).toMatchObject({ valid: true, set: { weightKg: 120.5, rpe: 9.5 } });
  for (const reps of ['0', '-1', '1.5', 'Infinity']) {
    expect(
      parseSetInput(base, { ...input, reps }, 'kg', true, false).valid,
    ).toBe(false);
  }
  expect(
    parseSetInput(base, { ...input, rpe: '11' }, 'kg', true, false).valid,
  ).toBe(false);
  expect(
    parseSetInput(base, { ...input, weight: '.' }, 'kg', true, true).valid,
  ).toBe(false);
});
test('clock uses wall time, rounds countdown up and clamps expired progress', () => {
  expect(formatWorkoutClock(2_322_000)).toBe('38:42');
  expect(formatWorkoutClock(3_661_000)).toBe('1:01:01');
  expect(
    getRestState(now + DEFAULT_REST_MS, DEFAULT_REST_MS, now + 1).label,
  ).toBe('02:00');
  expect(getRestState(now - 1, DEFAULT_REST_MS, now)).toMatchObject({
    label: '00:00',
    active: false,
    progress: 0,
  });
});
test('PR notices require a new external working-set load, never a warmup or estimate', () => {
  const { db, repo, session } = setup();
  try {
    const group = repo.getEditorState(session.id).exercises[0]!;
    const set = { ...group.sets[0]!, weightKg: 120, reps: 5 };
    expect(isNewRecordedLoad(set, group)).toBe(true);
    expect(isNewRecordedLoad({ ...set, kind: 'warmup' }, group)).toBe(false);
    expect(isNewRecordedLoad({ ...set, loadType: 'assisted' }, group)).toBe(
      false,
    );
    expect(
      isNewRecordedLoad(set, {
        ...group,
        previousBest: { weightKg: 120, reps: 3 },
      }),
    ).toBe(false);
  } finally {
    db.close();
  }
});
