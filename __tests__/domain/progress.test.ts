import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { readProgress } from '../../src/features/progress/data/progressRepository';
import {
  summarizeProgress,
  getRangeStart,
} from '../../src/features/progress/domain/analytics';
import { readLoadRecords } from '../../src/database/repositories/loadRecordRepository';
import type { Database } from '../../src/database/types';
const now = new Date(2026, 9, 24, 12).getTime();
function workout(
  db: Database,
  id: string,
  at: number,
  exercise: string,
  weight: number | null,
  reps = 5,
  status = 'completed',
  kind = 'working',
  load = 'external',
) {
  db.execute('INSERT INTO workout_sessions VALUES(?,NULL,?,?,?)', [
    id,
    at - 3_600_000,
    status === 'active' ? null : at,
    status,
  ]);
  db.execute('INSERT INTO workout_sets VALUES(?,?,?,0,?,?,?,8,?,?)', [
    id + '-set',
    id,
    exercise,
    load,
    weight,
    reps,
    kind,
    at - 1,
  ]);
}
let db: ReturnType<typeof openDatabase>;
beforeEach(() => {
  db = openDatabase();
  migrateDatabase(db);
});
afterEach(() => db.close());
test('analytics exclude unfinished, abandoned, warm-up and future data while counting bodyweight and assisted work separately from external load', () => {
  workout(db, 'work', now - 1000, 'barbell-bench-press', 120);
  workout(
    db,
    'warm',
    now - 2000,
    'barbell-bench-press',
    200,
    1,
    'completed',
    'warmup',
  );
  workout(
    db,
    'bw',
    now - 3000,
    'pull-up',
    null,
    10,
    'completed',
    'working',
    'bodyweight',
  );
  workout(
    db,
    'assist',
    now - 4000,
    'assisted-pull-up',
    20,
    8,
    'completed',
    'working',
    'assisted',
  );
  workout(
    db,
    'discarded',
    now - 5000,
    'barbell-bench-press',
    300,
    5,
    'abandoned',
  );
  workout(db, 'future', now + 5000, 'barbell-bench-press', 400);
  workout(db, 'active', now - 6000, 'barbell-bench-press', 500, 5, 'active');
  const snapshot = readProgress(db, now);
  expect(snapshot.sets).toHaveLength(3);
  const view = summarizeProgress(snapshot, 'barbell-bench-press', '3M', now);
  expect(view.volumeKg).toBe(600);
  expect(view.workingSets).toBe(3);
  expect(view.workouts).toBe(4); // Completed warm-up-only sessions still count as sessions.
  expect(view.best?.weightKg).toBe(120);
  expect(view.estimatedMaxKg).toBe(140);
  expect(view.weeks[5]).toMatchObject({ push: 1, pull: 2, legs: 0, other: 0 });
});
test('all-time recorded load is independent of the selected range and estimates use daily best eligible sets without inventing a baseline', () => {
  workout(
    db,
    'older',
    new Date(2026, 3, 1, 12).getTime(),
    'barbell-bench-press',
    130,
    3,
  );
  workout(db, 'recent', now - 10_000, 'barbell-bench-press', 120, 5);
  workout(db, 'highrep', now - 5000, 'barbell-bench-press', 100, 15);
  const view = summarizeProgress(
    readProgress(db, now),
    'barbell-bench-press',
    '1M',
    now,
  );
  expect(view.best).toMatchObject({ weightKg: 130, reps: 3 });
  expect(view.points).toHaveLength(1);
  expect(view.points[0]?.value).toBe(140);
  expect(view.estimateChangePercent).toBeNull();
  expect(view.estimatedMaxKg).toBe(140);
  expect(view.volumeKg).toBe(2100);
});
test('range comparisons use nonoverlapping equal calendar periods and clamp month-end dates', () => {
  expect(
    new Date(getRangeStart('1M', new Date(2024, 2, 31, 12).getTime())),
  ).toEqual(new Date(2024, 1, 29));
  const start = new Date(2026, 8, 24).getTime();
  workout(db, 'before', start - 1, 'barbell-bench-press', 100);
  workout(db, 'boundary', start + 1, 'barbell-bench-press', 120);
  const view = summarizeProgress(
    readProgress(db, now),
    'barbell-bench-press',
    '1M',
    now,
  );
  expect(view.volumeKg).toBe(600);
  expect(view.previousVolumeKg).toBe(500);
  expect(view.volumeChangePercent).toBe(20);
});
test('daily estimated strength can decline and ineligible rep ranges do not enter the curve', () => {
  workout(db, 'day1', now - 172_800_000, 'barbell-bench-press', 120, 5);
  workout(db, 'day2', now - 86_400_000, 'barbell-bench-press', 100, 3);
  workout(db, 'day3', now - 1000, 'barbell-bench-press', 80, 20);
  const view = summarizeProgress(
    readProgress(db, now),
    'barbell-bench-press',
    'ALL',
    now,
  );
  expect(view.points.map(point => Math.round(point.value))).toEqual([140, 110]);
  expect(view.estimateChangePercent).toBeCloseTo(-21.428571);
});
test('record history keeps only strictly increased recorded loads, resolves equal-time ties by ID, and includes source sessions', () => {
  workout(db, 'a', now - 2000, 'barbell-bench-press', 100);
  workout(db, 'b', now - 2000, 'barbell-bench-press', 110);
  workout(db, 'c', now - 1000, 'barbell-bench-press', 105);
  workout(db, 'd', now - 500, 'barbell-bench-press', 110, 8);
  expect(
    readLoadRecords(db, now).map(record => [record.sessionId, record.weightKg]),
  ).toEqual([
    ['b', 110],
    ['a', 100],
  ]);
  expect(readLoadRecords(db, now, 1)[0]).toMatchObject({
    sessionId: 'b',
    previousWeightKg: 100,
  });
});
test('unknown muscle groups remain Other and six weekly buckets are local Monday-based', () => {
  db.execute(
    "INSERT INTO exercises(id,name,primary_muscle_group,equipment,exercise_type) VALUES('neck','Neck','neck','band','external')",
  );
  workout(db, 'neck-session', now - 1000, 'neck', 10);
  const view = summarizeProgress(readProgress(db, now), 'neck', '3M', now);
  expect(view.weeks).toHaveLength(6);
  expect(new Date(view.weeks[0]!.date).getDay()).toBe(1);
  expect(view.weeks[5]).toMatchObject({ push: 0, pull: 0, legs: 0, other: 1 });
  expect(view.streakDays).toBe(1);
});

test('a future-dated completed session cannot contribute a past-dated set to recorded milestones', () => {
  workout(db, 'future-session', now + 60_000, 'barbell-bench-press', 300);
  db.execute(
    "UPDATE workout_sets SET completed_at = ? WHERE session_id = 'future-session'",
    [now - 1000],
  );
  expect(readProgress(db, now).records).toHaveLength(0);
});

test('consistency includes zero-workout calendar days and preserves multiple sessions on a training day', () => {
  const first = new Date(2026, 9, 1, 12).getTime();
  workout(db, 'first', first, 'barbell-bench-press', 100);
  workout(db, 'second-same-day', first + 60_000, 'barbell-bench-press', 110);
  workout(db, 'last', now, 'barbell-bench-press', 120);
  const view = summarizeProgress(
    readProgress(db, now),
    'barbell-bench-press',
    '1M',
    now,
  );
  expect(view.activityPoints).toHaveLength(31);
  expect(view.activityPoints[0]).toEqual({
    date: new Date(2026, 8, 24).getTime(),
    value: 0,
  });
  expect(
    view.activityPoints.find(
      point => point.date === new Date(2026, 9, 1).getTime(),
    )?.value,
  ).toBe(2);
  const inactive = view.activityPoints.filter(
    point =>
      point.date > new Date(2026, 9, 1).getTime() &&
      point.date < new Date(2026, 9, 24).getTime(),
  );
  expect(inactive).toHaveLength(22);
  expect(inactive.every(point => point.value === 0)).toBe(true);
  expect(view.activityPoints.at(-1)).toEqual({
    date: new Date(2026, 9, 24).getTime(),
    value: 1,
  });
  expect(view.trainingDays).toBe(2);
});

test('all-time consistency begins at the first recorded day and empty ranges stay empty', () => {
  expect(
    summarizeProgress(readProgress(db, now), null, 'ALL', now).activityPoints,
  ).toEqual([]);
  workout(
    db,
    'old',
    new Date(2026, 7, 1, 12).getTime(),
    'barbell-bench-press',
    100,
  );
  expect(
    summarizeProgress(readProgress(db, now), null, '1M', now).activityPoints,
  ).toEqual([]);
  const points = summarizeProgress(
    readProgress(db, now),
    null,
    'ALL',
    now,
  ).activityPoints;
  expect(points[0]).toEqual({ date: new Date(2026, 7, 1).getTime(), value: 1 });
  expect(points.at(-1)).toEqual({
    date: new Date(2026, 9, 24).getTime(),
    value: 0,
  });
});
