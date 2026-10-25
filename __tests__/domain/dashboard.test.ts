import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { initialSchema } from '../../src/database/migrations/001_initial';
import { readDashboard } from '../../src/features/home/data/dashboardRepository';
import {
  calculateTrainingStreak,
  getWeekDays,
  localDayKey,
  shiftDays,
} from '../../src/features/home/domain/dashboard';
import { getDashboardPresentation } from '../../src/features/home/domain/presentation';
import { calculateVolumeLoad } from '../../src/features/workouts/domain/strength';
import type { Database } from '../../src/database/types';
const now = new Date(2026, 9, 23, 12).getTime();
function completeWorkout(
  db: Database,
  id: string,
  completedAt: number,
  weight: number,
) {
  db.execute("INSERT INTO workout_sessions VALUES(?,NULL,?,?,'completed')", [
    id,
    completedAt - 3_600_000,
    completedAt,
  ]);
  db.execute(
    "INSERT INTO workout_sets VALUES(?,?,'bench',0,'external',?,5,8,'working',?)",
    [id + '-set', id, weight, completedAt - 1],
  );
}
test('v1 upgrades without losing saved preferences or workout data', () => {
  const db = openDatabase();
  try {
    for (const statement of initialSchema) {
      db.execute(statement);
    }
    db.execute('PRAGMA user_version = 1');
    db.execute("UPDATE app_preferences SET theme = 'light'");
    db.execute(
      "INSERT INTO workout_sessions VALUES('existing-session',NULL,?,NULL,'active')",
      [now],
    );
    migrateDatabase(db);
    expect(db.execute('PRAGMA user_version').rows[0]?.user_version).toBe(4);
    expect(db.execute('SELECT theme FROM app_preferences').rows[0]?.theme).toBe(
      'light',
    );
    expect(readDashboard(db, now).weeklyWorkouts).toBe(0);
    expect(
      db.execute("SELECT id FROM workout_sessions WHERE status = 'active'")
        .rows[0]?.id,
    ).toBe('existing-session');
  } finally {
    db.close();
  }
});
test('dashboard uses completed working sets and distinguishes recorded PRs from estimates', () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('bench','Barbell Bench Press','chest','barbell','external')",
    );
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('pullup','Pull-up','back','bar','bodyweight')",
    );
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('assisted','Assisted pull-up','back','machine','assisted')",
    );
    completeWorkout(db, 'mon', new Date(2026, 9, 19, 11).getTime(), 100);
    completeWorkout(db, 'thu', new Date(2026, 9, 22, 11).getTime(), 115);
    const friday = new Date(2026, 9, 23, 11).getTime();
    completeWorkout(db, 'fri', friday, 120);
    db.execute(
      "INSERT INTO workout_sets VALUES('warmup','fri','bench',1,'external',200,1,8,'warmup',?)",
      [friday - 1],
    );
    db.execute(
      "INSERT INTO workout_sets VALUES('bodyweight','fri','pullup',2,'bodyweight',NULL,10,8,'working',?)",
      [friday - 1],
    );
    db.execute(
      "INSERT INTO workout_sets VALUES('assisted','fri','assisted',3,'assisted',20,8,8,'working',?)",
      [friday - 1],
    );
    db.execute(
      "INSERT INTO workout_sessions VALUES('active',NULL,?,NULL,'active')",
      [friday],
    );
    db.execute(
      "INSERT INTO workout_sets VALUES('unfinished','active','bench',0,'external',300,5,8,'working',?)",
      [friday],
    );
    const summary = readDashboard(db, now);
    expect(summary.weeklyWorkouts).toBe(3);
    expect(summary.weeklyVolumeKg).toBe(1675);
    expect(summary.activeTimeMs).toBe(3 * 3_600_000);
    expect(summary.streakDays).toBe(2);
    expect(summary.recentRecord).toMatchObject({
      weightKg: 120,
      previousWeightKg: 115,
      reps: 5,
    });
    const view = getDashboardPresentation(summary, 'kg', now);
    expect(view.estimate).toBe('140');
    expect(view.record?.delta).toBe('+5 kg');
    expect(view.loadChange).toBe('—');
    expect(getDashboardPresentation(summary, 'lb', now).record?.weight).toBe(
      '264.6',
    );
    expect(summary.weeklyVolumeKg).toBe(
      calculateVolumeLoad(
        [100, 115, 120].map(weightKg => ({
          weightKg,
          reps: 5,
          loadType: 'external',
          kind: 'working',
          completedAt: friday,
        })),
      ),
    );
  } finally {
    db.close();
  }
});
test('record selection keeps per-exercise maxima and ignores lower subsequent loads', () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('bench','Bench','chest','barbell','external')",
    );
    completeWorkout(db, 'record', now - 10_000, 120);
    completeWorkout(db, 'backoff', now - 1000, 100);
    expect(readDashboard(db, now).recentRecord?.setId).toBe('record-set');
  } finally {
    db.close();
  }
});
test('week begins Monday, handles Sunday, and streaks use calendar days', () => {
  const sunday = new Date(2026, 9, 25, 12).getTime();
  const days = getWeekDays(sunday);
  expect(days).toHaveLength(7);
  expect(localDayKey(days[0]!.start)).toBe('2026-10-19');
  expect(localDayKey(days[6]!.start)).toBe('2026-10-25');
  const yesterday = shiftDays(new Date(sunday), -1);
  expect(
    calculateTrainingStreak([localDayKey(yesterday.getTime())], sunday),
  ).toBe(1);
  expect(calculateTrainingStreak([], sunday)).toBe(0);
});

test('load comparison uses contiguous 30-day windows and a finite prior baseline', () => {
  const db = openDatabase();
  try {
    migrateDatabase(db);
    db.execute(
      "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('bench','Bench','chest','barbell','external')",
    );
    completeWorkout(db, 'prior', shiftDays(new Date(now), -31).getTime(), 50);
    completeWorkout(db, 'recent', now - 1000, 100);
    const summary = readDashboard(db, now);
    expect(summary.totalWorkouts).toBe(2);
    expect(summary.weeklyWorkouts).toBe(1);
    expect(summary.previousVolumeKg).toBe(250);
    expect(summary.recentVolumeKg).toBe(500);
    expect(getDashboardPresentation(summary, 'kg', now).loadChange).toBe(
      '+100%',
    );
  } finally {
    db.close();
  }
});
