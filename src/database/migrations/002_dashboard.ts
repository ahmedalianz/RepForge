/** One shared eligibility boundary for recorded load analytics and PR queries. */
export const dashboardSchema = [
  `CREATE VIEW completed_external_working_sets AS
 SELECT s.id, s.exercise_id, s.weight_kg, s.reps, s.completed_at
 FROM workout_sets s JOIN workout_sessions w ON w.id = s.session_id
 WHERE w.status = 'completed' AND s.completed_at IS NOT NULL
   AND s.load_type = 'external' AND s.kind = 'working' AND s.reps > 0`,
];
