const catalog = [
  [
    'barbell-bench-press',
    'Barbell Bench Press',
    'chest',
    'barbell',
    'external',
    'compound',
    ['front delts', 'triceps'],
  ],
  [
    'incline-dumbbell-press',
    'Incline Dumbbell Press',
    'chest',
    'dumbbell',
    'external',
    'compound',
    ['front delts', 'triceps'],
  ],
  [
    'standing-overhead-press',
    'Standing Overhead Press',
    'shoulders',
    'barbell',
    'external',
    'compound',
    ['triceps'],
  ],
  [
    'barbell-back-squat',
    'Barbell Back Squat',
    'quads',
    'barbell',
    'external',
    'compound',
    ['glutes', 'hamstrings'],
  ],
  [
    'barbell-deadlift',
    'Barbell Deadlift',
    'posterior chain',
    'barbell',
    'external',
    'compound',
    ['back', 'glutes'],
  ],
  [
    'pull-up',
    'Pull-up',
    'back',
    'pull-up bar',
    'bodyweight',
    'compound',
    ['biceps'],
  ],
  [
    'assisted-pull-up',
    'Assisted Pull-up',
    'back',
    'assisted machine',
    'assisted',
    'compound',
    ['biceps'],
  ],
  [
    'push-up',
    'Push-up',
    'chest',
    'none',
    'bodyweight',
    'compound',
    ['triceps'],
  ],
  [
    'dumbbell-curl',
    'Dumbbell Curl',
    'biceps',
    'dumbbell',
    'external',
    'isolation',
    [],
  ],
  [
    'cable-triceps-pushdown',
    'Cable Triceps Pushdown',
    'triceps',
    'cable',
    'external',
    'isolation',
    [],
  ],
] as const;
// All values below are controlled catalog literals, never user input.
const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;
export const workoutEditorSchema = [
  `ALTER TABLE exercises ADD COLUMN category TEXT NOT NULL DEFAULT 'other' CHECK(category IN ('compound','isolation','other'))`,
  ...catalog.map(
    ([id, name, muscle, equipment, type, category]) =>
      `INSERT OR IGNORE INTO exercises(id,name,primary_muscle_group,equipment,exercise_type,category) VALUES(${[id, name, muscle, equipment, type, category].map(quote).join(',')})`,
  ),
  ...catalog.flatMap(([id, , , , , , muscles]) =>
    muscles.map(
      muscle =>
        `INSERT OR IGNORE INTO exercise_secondary_muscles VALUES(${quote(id)},${quote(muscle)})`,
    ),
  ),
  `CREATE TABLE session_exercises (
   session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
   exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
   exercise_order INTEGER NOT NULL CHECK(exercise_order >= 0),
   PRIMARY KEY(session_id,exercise_id), UNIQUE(session_id,exercise_order)
 )`,
  `INSERT INTO session_exercises SELECT session_id, exercise_id, MIN(set_order) FROM workout_sets GROUP BY session_id,exercise_id`,
  `CREATE INDEX session_exercise_catalog ON session_exercises(exercise_id)`,
  `CREATE TABLE workout_runtime (
   session_id TEXT PRIMARY KEY NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
   active_exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
   active_set_id TEXT REFERENCES workout_sets(id) ON DELETE SET NULL,
   rest_ends_at INTEGER CHECK(rest_ends_at >= 0),
   rest_duration_ms INTEGER NOT NULL DEFAULT 120000 CHECK(rest_duration_ms > 0)
 )`,
];
