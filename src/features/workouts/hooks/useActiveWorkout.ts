import { useTranslation } from 'react-i18next';
import { localizeError } from '../../../localization/errors';
import { t } from '../../../localization/i18n';
import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { usePreferencesStore } from '../../../app/config/preferencesStore';
import { isNewRecordedLoad } from '../domain/setInput';
import type { WorkoutEditorState, WorkoutSet } from '../domain/types';
import { useWorkoutSession } from './useWorkoutSession';
import { useSetInput } from './useSetInput';
export type WorkoutNotice = { kind: 'error' | 'success'; message: string };
export function useActiveWorkout(sessionId: string) {
  useTranslation();
  const { workouts } = useDatabase();
  const lifecycle = useWorkoutSession(sessionId);
  const unit = usePreferencesStore(state => state.weightUnit);
  const [viewedExerciseId, setViewedExerciseId] = useState<string | null>(null);
  const [editor, setEditor] = useState<WorkoutEditorState | null>(null);
  const [notice, setNotice] = useState<WorkoutNotice | null>(null);
  const reportError = useCallback(
    (message: string) => setNotice({ kind: 'error', message }),
    [],
  );
  const refresh = useCallback(() => {
    try {
      setEditor(workouts.getEditorState(sessionId));
    } catch (failure) {
      reportError(localizeError(failure, t('workouts:loadError')));
    }
  }, [workouts, sessionId, reportError]);
  useEffect(() => {
    if (lifecycle.session) {
      refresh();
    }
  }, [lifecycle.session, refresh]);
  useEffect(() => {
    if (notice?.kind !== 'success') {
      return;
    }
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  const selected =
    editor?.exercises.find(
      group =>
        group.exercise.id ===
        (viewedExerciseId ?? editor.runtime.activeExerciseId),
    ) ?? editor?.exercises[0];
  const activeSet = selected?.sets.find(
    set => set.id === editor?.runtime.activeSetId && set.completedAt === null,
  );
  const run = useCallback(
    (action: () => void): boolean => {
      try {
        action();
        setNotice(null);
        refresh();
        return true;
      } catch (failure) {
        reportError(localizeError(failure, t('workouts:saveError')));
        return false;
      }
    },
    [refresh, reportError],
  );
  const saveDraft = (set: WorkoutSet): boolean => {
    try {
      workouts.saveSet(set);
      setNotice(null);
      // Preserve structural sharing and avoid history/catalog reads on every keystroke.
      setEditor(previous =>
        previous
          ? {
              ...previous,
              exercises: previous.exercises.map(group =>
                group.exercise.id === set.exerciseId
                  ? {
                      ...group,
                      sets: group.sets.map(candidate =>
                        candidate.id === set.id ? set : candidate,
                      ),
                    }
                  : group,
              ),
            }
          : previous,
      );
      return true;
    } catch (failure) {
      reportError(localizeError(failure, t('workouts:draftError')));
      return false;
    }
  };
  const draft = useSetInput(activeSet, unit, saveDraft, reportError);
  const isActive = lifecycle.session?.status === 'active';
  const completedSets =
    editor?.exercises
      .flatMap(group => group.sets)
      .filter(set => set.completedAt !== null).length ?? 0;
  const pendingSets =
    editor?.exercises
      .flatMap(group => group.sets)
      .filter(set => set.completedAt === null).length ?? 0;
  function checkpoint(): boolean {
    if (!isActive || !activeSet) {
      return true;
    }
    const parsed = draft.parse(false);
    return parsed ? saveDraft(parsed) : false;
  }
  function complete(set: WorkoutSet): void {
    if (set.completedAt !== null) {
      if (!checkpoint()) {
        return;
      }
      run(() => workouts.undoSet(set));
      return;
    }
    if (set.id !== activeSet?.id) {
      if (!checkpoint()) {
        return;
      }
      run(() => workouts.selectExercise(sessionId, set.exerciseId, set.id));
      return;
    }
    const parsed = draft.parse(true);
    if (!parsed || !selected) {
      return;
    }
    const pr = isNewRecordedLoad(parsed, selected);
    if (run(() => workouts.completeSet(parsed))) {
      setNotice({
        kind: 'success',
        message: pr ? t('workouts:savedPr') : t('workouts:savedRest'),
      });
    }
  }
  function finish(status: 'completed' | 'abandoned'): boolean {
    if (status === 'completed' && !checkpoint()) {
      return false;
    }
    const finished = run(() => workouts.finishSession(sessionId, status));
    if (finished) {
      lifecycle.refresh();
    }
    return finished;
  }
  return {
    session: lifecycle.session,
    loading: lifecycle.loading,
    editor,
    selected,
    activeSet,
    unit,
    isActive,
    notice,
    error: lifecycle.error,
    completedSets,
    pendingSets,
    draft,
    refresh,
    retry: () => {
      lifecycle.refresh();
      refresh();
    },
    checkpoint,
    reportError,
    complete,
    finish,
    addExercise: (id: string) =>
      checkpoint() && run(() => workouts.addExercise(sessionId, id)),
    selectExercise: (id: string) => {
      if (!isActive) {
        setViewedExerciseId(id);
        return true;
      }
      return checkpoint() && run(() => workouts.selectExercise(sessionId, id));
    },
    selectSet: (set: WorkoutSet) =>
      checkpoint() &&
      run(() => workouts.selectExercise(sessionId, set.exerciseId, set.id)),
    addSet: () =>
      selected &&
      checkpoint() &&
      run(() => workouts.addSet(sessionId, selected.exercise.id)),
    removeSet: () =>
      activeSet && run(() => workouts.removeSet(sessionId, activeSet.id)),
    toggleKind: () =>
      activeSet &&
      saveDraft({
        ...activeSet,
        kind: activeSet.kind === 'working' ? 'warmup' : 'working',
      }),
    removeExercise: () =>
      selected &&
      run(() => workouts.removeExercise(sessionId, selected.exercise.id)),
    extendRest: () => run(() => workouts.extendRest(sessionId)),
    skipRest: () => run(() => workouts.skipRest(sessionId)),
  };
}
export type ActiveWorkoutViewModel = ReturnType<typeof useActiveWorkout>;
