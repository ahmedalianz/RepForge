import { useTranslation } from 'react-i18next';
import { localizeError } from '../../../localization/errors';
import { useCallback, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { usePreferencesStore } from '../../../app/config/preferencesStore';
import { savePreferences } from '../../../services/storage/preferences';
import type { WeightUnit } from '../../workouts/domain/strength';
import { readProgress } from '../data/progressRepository';
import { summarizeProgress } from '../domain/analytics';
import type {
  ProgressRange,
  ProgressSnapshot,
  ProgressView,
} from '../domain/types';
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; snapshot: ProgressSnapshot; now: number };
export function useProgress() {
  const { t } = useTranslation('progress');
  const { database } = useDatabase();
  const unit = usePreferencesStore(state => state.weightUnit);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [range, setRange] = useState<ProgressRange>('3M');
  const [view, setView] = useState<ProgressView>('strength');
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const refresh = useCallback(() => {
    try {
      const now = Date.now();
      setState({ status: 'ready', snapshot: readProgress(database, now), now });
    } catch (error) {
      setState({
        status: 'error',
        message: localizeError(error, t('loadError')),
      });
    }
  }, [database, t]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(refresh, 60_000);
      const listener = AppState.addEventListener('change', status => {
        if (status === 'active') {
          refresh();
        }
      });
      return () => {
        clearInterval(timer);
        listener.remove();
      };
    }, [refresh]),
  );
  const snapshot = state.status === 'ready' ? state.snapshot : null;
  const selectedId =
    exerciseId ??
    snapshot?.sets.find(set => set.loadType === 'external')?.exerciseId ??
    null;
  const exercise =
    snapshot?.exercises.find(candidate => candidate.id === selectedId) ?? null;
  const summary = useMemo(
    () =>
      state.status === 'ready'
        ? summarizeProgress(
            state.snapshot,
            exercise?.id ?? null,
            range,
            state.now,
          )
        : null,
    [state, exercise?.id, range],
  );
  function changeUnit(weightUnit: WeightUnit) {
    try {
      const preferences = {
        theme: usePreferencesStore.getState().theme,
        language: usePreferencesStore.getState().language,
        weightUnit,
      };
      savePreferences(database, preferences);
      usePreferencesStore.getState().setPreferences(preferences);
      setPreferenceError(null);
    } catch (error) {
      setPreferenceError(localizeError(error, t('unitSaveError')));
    }
  }
  return {
    state,
    summary,
    exercise,
    unit,
    changeUnit,
    range,
    setRange,
    view,
    setView,
    setExerciseId,
    preferenceError,
    refresh,
  };
}
export type ProgressViewModel = ReturnType<typeof useProgress>;
