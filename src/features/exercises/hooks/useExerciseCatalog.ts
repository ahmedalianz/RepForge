import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { searchExercises } from '../data/exerciseRepository';
import type { Exercise } from '../domain/types';
export function useExerciseCatalog(visible: boolean) {
  const { database } = useDatabase();
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => {
    try {
      setExercises(searchExercises(database, query));
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Exercises could not load',
      );
    }
  }, [database, query]);
  useEffect(() => {
    if (visible) {
      refresh();
    }
  }, [visible, refresh]);
  return { query, setQuery, exercises, error, refresh };
}
