import type { VolumeSet } from './strength';
import type { Exercise } from '../../exercises/domain/types';
export type WorkoutRoutine = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};
export type SessionStatus = 'active' | 'completed' | 'abandoned';
/** All timestamps are UTC Unix milliseconds; weight is always kilograms. */
export type WorkoutSession = {
  id: string;
  routineId: string | null;
  startedAt: number;
  completedAt: number | null;
  status: SessionStatus;
};
export type WorkoutSet = VolumeSet & {
  id: string;
  sessionId: string;
  exerciseId: string;
  setOrder: number;
  rpe: number | null;
};
export type WorkoutSessionRepository = {
  getActiveSession(): WorkoutSession | null;
  getSession(id: string): WorkoutSession | null;
  startSession(): WorkoutSession;
  listSets(sessionId: string): WorkoutSet[];
  saveSet(set: WorkoutSet): void;
  finishSession(id: string, status: 'completed' | 'abandoned'): void;
};

export type WorkoutRuntime = {
  activeExerciseId: string | null;
  activeSetId: string | null;
  restEndsAt: number | null;
  restDurationMs: number;
};
export type WorkoutExercise = {
  exercise: Exercise;
  sets: WorkoutSet[];
  previousSets: WorkoutSet[];
  previousBest: { weightKg: number; reps: number } | null;
};
export type WorkoutEditorState = {
  title: string;
  exercises: WorkoutExercise[];
  runtime: WorkoutRuntime;
};
export type WorkoutEditorRepository = {
  getEditorState(sessionId: string): WorkoutEditorState;
  addExercise(sessionId: string, exerciseId: string): void;
  selectExercise(sessionId: string, exerciseId: string, setId?: string): void;
  addSet(sessionId: string, exerciseId: string): void;
  removeSet(sessionId: string, setId: string): void;
  removeExercise(sessionId: string, exerciseId: string): void;
  completeSet(set: WorkoutSet): void;
  undoSet(set: WorkoutSet): void;
  extendRest(sessionId: string): void;
  skipRest(sessionId: string): void;
};
export type WorkoutRepository = WorkoutSessionRepository &
  WorkoutEditorRepository;
