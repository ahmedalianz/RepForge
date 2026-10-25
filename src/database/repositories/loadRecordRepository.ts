import type { Database } from '../types';
import type { LoadRecord } from '../../features/progress/domain/types';
/** Recorded external working-set load milestones; estimates and rep-max claims stay separate. */
export function readLoadRecords(
  database: Database,
  now: number,
  limit = -1,
): LoadRecord[] {
  return database
    .execute(
      `WITH history AS (
    SELECT v.*, s.session_id, MAX(v.weight_kg) OVER (PARTITION BY v.exercise_id ORDER BY v.completed_at, v.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS previous_weight
    FROM completed_external_working_sets v
    JOIN workout_sets s ON s.id = v.id JOIN workout_sessions w ON w.id = s.session_id
    WHERE v.completed_at <= ? AND w.completed_at <= ?
  ) SELECT h.*, e.name FROM history h JOIN exercises e ON e.id = h.exercise_id
  WHERE h.weight_kg > 0 AND (h.previous_weight IS NULL OR h.weight_kg > h.previous_weight)
  ORDER BY h.completed_at DESC, h.id DESC LIMIT ?`,
      [now, now, limit],
    )
    .rows.map(row => ({
      setId: String(row.id),
      sessionId: String(row.session_id),
      exerciseId: String(row.exercise_id),
      exerciseName: String(row.name),
      weightKg: Number(row.weight_kg),
      previousWeightKg:
        row.previous_weight === null ? null : Number(row.previous_weight),
      reps: Number(row.reps),
      completedAt: Number(row.completed_at),
    }));
}
