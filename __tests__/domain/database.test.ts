import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { createWorkoutRepository } from '../../src/database/repositories/workoutRepository';
import {
  loadPreferences,
  savePreferences,
} from '../../src/services/storage/preferences';
import type { WorkoutSet } from '../../src/features/workouts/domain/types';

test('migrations run once, preserve data, and enable foreign keys', () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    savePreferences(db, { theme: 'light', weightUnit: 'lb' });
    migrateDatabase(db);
    expect(loadPreferences(db)).toEqual({ theme: 'light', weightUnit: 'lb' });
    expect(db.execute('PRAGMA user_version').rows[0]?.user_version).toBe(3);
    expect(db.execute('PRAGMA foreign_keys').rows[0]?.foreign_keys).toBe(1);
    expect(() =>
      db.execute(
        "INSERT INTO exercise_secondary_muscles VALUES('missing','back')",
      ),
    ).toThrow();
    db.execute('PRAGMA user_version = 99');
    expect(() => migrateDatabase(db)).toThrow('newer');
  } finally {
    db.close();
  }
});

test('migration failure rolls back all schema changes and version', () => {
  const db = openDatabase();
  const failing = {
    ...db,
    execute: (sql: string) => {
      if (sql.startsWith('CREATE TABLE workout_sets')) {
        throw new Error('simulated disk failure');
      }
      return db.execute(sql);
    },
  };
  // Inject through transaction as well, matching the production transaction boundary.
  failing.transaction = work => db.transaction(() => work(failing));
  try {
    expect(() => migrateDatabase(failing)).toThrow('simulated');
    expect(
      db.execute("SELECT name FROM sqlite_master WHERE type='table'").rows,
    ).toEqual([]);
    expect(db.execute('PRAGMA user_version').rows[0]?.user_version).toBe(0);
    migrateDatabase(db);
  } finally {
    db.close();
  }
});

test('workout and saved sets survive a close/reopen; completed sessions are immutable', () => {
  const directory = mkdtempSync(join(tmpdir(), 'repforge-'));
  const path = join(directory, 'workouts.sqlite');
  let db = openDatabase(path);
  try {
    migrateDatabase(db);
    db.execute(
      'INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES(?, ?, ?, ?, ?)',
      ['squat', 'Squat', 'quads', 'barbell', 'external'],
    );
    let repository = createWorkoutRepository(db);
    const session = repository.startSession();
    expect(repository.startSession().id).toBe(session.id);
    const set: WorkoutSet = {
      id: 'set-1',
      sessionId: session.id,
      exerciseId: 'squat',
      setOrder: 0,
      weightKg: 80,
      reps: 5,
      rpe: 8,
      kind: 'working',
      loadType: 'external',
      completedAt: Date.now(),
    };
    repository.saveSet(set);
    repository.saveSet({ ...set, reps: 6 });
    expect(() =>
      repository.saveSet({ ...set, id: 'other', setOrder: 0 }),
    ).toThrow();
    expect(() =>
      repository.saveSet({ ...set, loadType: 'bodyweight', weightKg: null }),
    ).toThrow('load type');
    expect(() => repository.saveSet({ ...set, weightKg: -1 })).toThrow();
    expect(() => repository.saveSet({ ...set, reps: 2.5 })).toThrow();
    expect(() => repository.saveSet({ ...set, rpe: 11 })).toThrow();
    db.close();
    db = openDatabase(path);
    migrateDatabase(db);
    repository = createWorkoutRepository(db);
    expect(repository.getActiveSession()?.id).toBe(session.id);
    expect(repository.listSets(session.id)).toEqual([{ ...set, reps: 6 }]);
    repository.finishSession(session.id, 'completed');
    expect(repository.getActiveSession()).toBeNull();
    expect(repository.getSession(session.id)?.status).toBe('completed');
    expect(() => repository.saveSet(set)).toThrow('active');
    expect(() => repository.finishSession(session.id, 'completed')).toThrow();
    expect(repository.startSession().id).not.toBe(session.id);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('constraints enforce load semantics, goal scope, and transactional writes', () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    const session = createWorkoutRepository(db).startSession();
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('pullup','Pull-up','back','bar','bodyweight')",
    );
    const insert =
      'INSERT INTO workout_sets(id,session_id,exercise_id,set_order,load_type,weight_kg,reps,kind) VALUES(?,?,?,?,?,?,?,?)';
    expect(() =>
      db.execute(insert, [
        'bad',
        session.id,
        'pullup',
        0,
        'bodyweight',
        40,
        5,
        'working',
      ]),
    ).toThrow();
    expect(() =>
      db.execute(
        "INSERT INTO goals VALUES('goal',NULL,'reps',10,NULL,'active')",
      ),
    ).toThrow();
    db.execute(
      "INSERT INTO goals VALUES('goal',NULL,'session_count',10,NULL,'active')",
    );
    expect(() =>
      db.transaction(tx => {
        tx.execute(insert, [
          'valid',
          session.id,
          'pullup',
          0,
          'bodyweight',
          null,
          5,
          'working',
        ]);
        tx.execute(insert, [
          'invalid',
          session.id,
          'missing',
          1,
          'external',
          10,
          5,
          'working',
        ]);
      }),
    ).toThrow();
    expect(db.execute('SELECT * FROM workout_sets').rows).toEqual([]);
  } finally {
    db.close();
  }
});
