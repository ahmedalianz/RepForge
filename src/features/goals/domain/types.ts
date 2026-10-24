export type Goal = {
  id: string;
  exerciseId: string | null;
  goalType: 'weight_kg' | 'reps' | 'session_count';
  targetValue: number;
  targetDate: number | null;
  status: 'active' | 'achieved' | 'archived';
};
