import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
/** Refresh wall-clock time, not a decrementing counter that drifts while JS is suspended. */
export function useWorkoutClock(): number {
  const [now, setNow] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      const update = () => setNow(Date.now());
      update();
      const timer = setInterval(update, 1000);
      const subscription = AppState.addEventListener('change', status => {
        if (status === 'active') {
          update();
        }
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, []),
  );
  return now;
}
