import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import type { WorkoutSession } from '../domain/types';
/** Reads SQLite on focus; no authoritative workout state is copied into a global store. */
export function useWorkoutSession(sessionId?: string) {
  const { workouts } = useDatabase();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => {
    try {
      setSession(
        sessionId
          ? workouts.getSession(sessionId)
          : workouts.getActiveSession(),
      );
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Unable to read workout',
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, workouts]);
  useFocusEffect(refresh);
  function start(): WorkoutSession | null {
    try {
      const active = workouts.startSession();
      setSession(active);
      setError(null);
      return active;
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Unable to start workout',
      );
      return null;
    }
  }
  function finish(status: 'completed' | 'abandoned'): void {
    if (!session) {
      return;
    }
    try {
      workouts.finishSession(session.id, status);
      refresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Unable to finish workout',
      );
    }
  }
  return { session, error, loading, refresh, start, finish };
}
