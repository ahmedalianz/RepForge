export const initialSchema = [
  `CREATE TABLE exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    primary_muscle_group TEXT NOT NULL,
    equipment TEXT NOT NULL,
    exercise_type TEXT NOT NULL CHECK(exercise_type IN ('external','bodyweight','assisted'))
  )`,
  `CREATE TABLE exercise_secondary_muscles (
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group TEXT NOT NULL,
    PRIMARY KEY(exercise_id, muscle_group)
  )`,
  `CREATE TABLE workout_routines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    created_at INTEGER NOT NULL CHECK(created_at >= 0),
    updated_at INTEGER NOT NULL CHECK(updated_at >= created_at)
  )`,
  `CREATE TABLE routine_exercises (
    routine_id TEXT NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    exercise_order INTEGER NOT NULL CHECK(exercise_order >= 0),
    PRIMARY KEY(routine_id, exercise_order)
  )`,
  `CREATE INDEX routine_exercise_lookup ON routine_exercises(exercise_id)`,
  `CREATE TABLE workout_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    routine_id TEXT REFERENCES workout_routines(id) ON DELETE SET NULL,
    started_at INTEGER NOT NULL CHECK(started_at >= 0),
    completed_at INTEGER,
    status TEXT NOT NULL CHECK(status IN ('active','completed','abandoned')),
    CHECK((status = 'active' AND completed_at IS NULL) OR
      (status IN ('completed','abandoned') AND completed_at >= started_at AND completed_at IS NOT NULL))
  )`,
  `CREATE UNIQUE INDEX one_active_session ON workout_sessions(status) WHERE status = 'active'`,
  `CREATE INDEX sessions_started_at ON workout_sessions(started_at DESC)`,
  `CREATE INDEX sessions_routine ON workout_sessions(routine_id)`,
  `CREATE TABLE workout_sets (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    set_order INTEGER NOT NULL CHECK(set_order >= 0),
    load_type TEXT NOT NULL CHECK(load_type IN ('external','bodyweight','assisted')),
    weight_kg REAL CHECK(weight_kg >= 0),
    reps INTEGER NOT NULL CHECK(reps >= 0),
    rpe REAL CHECK(rpe BETWEEN 0 AND 10),
    kind TEXT NOT NULL CHECK(kind IN ('working','warmup')),
    completed_at INTEGER CHECK(completed_at >= 0),
    CHECK((load_type = 'bodyweight' AND weight_kg IS NULL) OR
      (load_type IN ('external','assisted') AND weight_kg IS NOT NULL)),
    CHECK(completed_at IS NULL OR reps > 0),
    UNIQUE(session_id, set_order)
  )`,
  `CREATE INDEX sets_exercise_completed ON workout_sets(exercise_id, completed_at DESC)`,
  `CREATE TABLE goals (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_id TEXT REFERENCES exercises(id) ON DELETE RESTRICT,
    goal_type TEXT NOT NULL CHECK(goal_type IN ('weight_kg','reps','session_count')),
    target_value REAL NOT NULL CHECK(target_value > 0),
    target_date INTEGER CHECK(target_date >= 0),
    status TEXT NOT NULL CHECK(status IN ('active','achieved','archived')),
    CHECK((goal_type = 'session_count' AND exercise_id IS NULL) OR
      (goal_type IN ('weight_kg','reps') AND exercise_id IS NOT NULL)),
    CHECK(goal_type = 'weight_kg' OR target_value = CAST(target_value AS INTEGER))
  )`,
  `CREATE INDEX goals_exercise_status ON goals(exercise_id, status)`,
  `CREATE TABLE app_preferences (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    theme TEXT NOT NULL CHECK(theme IN ('dark','light','system')),
    weight_unit TEXT NOT NULL CHECK(weight_unit IN ('kg','lb'))
  )`,
  `INSERT INTO app_preferences(id, theme, weight_unit) VALUES(1, 'dark', 'kg')`,
] as const;
