import type { Database, SqlRow, SqlValue } from '../../../database/types';
import type { Exercise } from '../domain/types';
const EXERCISE_SELECT = `SELECT e.*, COALESCE(GROUP_CONCAT(m.muscle_group,'|'),'') AS secondary_muscles FROM exercises e LEFT JOIN exercise_secondary_muscles m ON m.exercise_id = e.id`;
function mapExercise(row: SqlRow): Exercise {
  return {
    id: String(row.id),
    name: String(row.name),
    primaryMuscleGroup: String(row.primary_muscle_group),
    secondaryMuscleGroups: String(row.secondary_muscles)
      .split('|')
      .filter(Boolean),
    equipment: String(row.equipment),
    exerciseType: row.exercise_type as Exercise['exerciseType'],
    category: row.category as Exercise['category'],
  };
}
function read(
  database: Database,
  filter: string,
  params: SqlValue[],
): Exercise[] {
  return database
    .execute(
      `${EXERCISE_SELECT} ${filter} GROUP BY e.id ORDER BY e.name LIMIT 100`,
      params,
    )
    .rows.map(mapExercise);
}
export function searchExercises(database: Database, query: string): Exercise[] {
  return read(
    database,
    'WHERE e.name LIKE ? OR e.primary_muscle_group LIKE ?',
    [`%${query.trim()}%`, `%${query.trim()}%`],
  );
}
export function getExercise(database: Database, id: string): Exercise {
  const exercise = read(database, 'WHERE e.id = ?', [id])[0];
  if (!exercise) {
    throw new Error('Exercise not found');
  }
  return exercise;
}
