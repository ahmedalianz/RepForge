import { useTranslation } from 'react-i18next';
import { localizeError } from '../../../localization/errors';
import { t } from '../../../localization/i18n';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import type { WorkoutSession } from '../domain/types';
/** Reads SQLite on focus; no authoritative workout state is copied into a global store. */
export function useWorkoutSession(sessionId?: string) {
  useTranslation();
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
      setError(localizeError(failure, t('workouts:readError')));
    } finally {
      setLoading(false);
    }
  }, [sessionId, workouts]);
  useFocusEffect(refresh);
  return { session, error, loading, refresh };
}
