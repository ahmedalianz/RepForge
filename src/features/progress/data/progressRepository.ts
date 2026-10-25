import type { Database } from '../../../database/types';
import { readLoadRecords } from '../../../database/repositories/loadRecordRepository';
import type { ProgressSnapshot, ProgressSet } from '../domain/types';
export function readProgress(
  database: Database,
  now: number,
): ProgressSnapshot {
  return database.transaction(tx => ({
    exercises: tx
      .execute('SELECT id,name,exercise_type FROM exercises ORDER BY name')
      .rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        exerciseType: row.exercise_type as ProgressSet['loadType'],
      })),
    // ponytail: read history once per focus; move to SQL daily aggregates if history size makes this costly.
    sets: tx
      .execute(
        `SELECT s.*, e.name, e.primary_muscle_group FROM workout_sets s
      JOIN workout_sessions w ON w.id = s.session_id JOIN exercises e ON e.id = s.exercise_id
      WHERE w.status = 'completed' AND w.completed_at <= ? AND s.completed_at <= ? AND s.kind = 'working' AND s.reps > 0
      ORDER BY s.completed_at, s.id`,
        [now, now],
      )
      .rows.map(row => ({
        id: String(row.id),
        sessionId: String(row.session_id),
        exerciseId: String(row.exercise_id),
        exerciseName: String(row.name),
        muscle: String(row.primary_muscle_group),
        loadType: row.load_type as ProgressSet['loadType'],
        weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
        reps: Number(row.reps),
        rpe: row.rpe === null ? null : Number(row.rpe),
        completedAt: Number(row.completed_at),
      })),
    sessions: tx
      .execute(
        "SELECT id,started_at,completed_at FROM workout_sessions WHERE status = 'completed' AND completed_at <= ? ORDER BY completed_at,id",
        [now],
      )
      .rows.map(row => ({
        id: String(row.id),
        completedAt: Number(row.completed_at),
        durationMs: Number(row.completed_at) - Number(row.started_at),
      })),
    records: readLoadRecords(tx, now),
  }));
}
