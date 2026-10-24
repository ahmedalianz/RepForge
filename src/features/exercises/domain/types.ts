export type ExerciseType = 'external' | 'bodyweight' | 'assisted';
export type Exercise = {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: readonly string[];
  equipment: string;
  exerciseType: ExerciseType;
  category: 'compound' | 'isolation' | 'other';
};
