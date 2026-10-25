import { useTranslation } from 'react-i18next';
import { localizeError } from '../../../localization/errors';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { usePreferencesStore } from '../../../app/config/preferencesStore';
import type { WorkoutSession } from '../../workouts/domain/types';
import { readDashboard } from '../data/dashboardRepository';
import {
  getDashboardPresentation,
  type DashboardPresentation,
} from '../domain/presentation';
type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      dashboard: DashboardPresentation;
      activeSession: WorkoutSession | null;
    };
const CLOCK_REFRESH_MS = 60_000;
export function useDashboard() {
  const { t } = useTranslation('home');
  const { database, workouts } = useDatabase();
  const unit = usePreferencesStore(state => state.weightUnit);
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const refresh = useCallback(() => {
    try {
      const now = Date.now();
      setState({
        status: 'ready',
        dashboard: getDashboardPresentation(
          readDashboard(database, now),
          unit,
          now,
        ),
        activeSession: workouts.getActiveSession(),
      });
    } catch (error) {
      setState({
        status: 'error',
        message: localizeError(error, t('loadError')),
      });
    }
  }, [database, workouts, unit, t]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(refresh, CLOCK_REFRESH_MS);
      const subscription = AppState.addEventListener('change', status => {
        if (status === 'active') {
          refresh();
        }
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [refresh]),
  );
  return { state, refresh };
}
