import { useTranslation } from 'react-i18next';
import { localizeError } from '../../../localization/errors';
import { t } from '../../../localization/i18n';
import { usePrompt } from '../../../app/providers/PromptProvider';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
/** Session creation is idempotent: every entry point resumes SQLite's active session. */
export function useStartWorkout() {
  useTranslation();
  const showPrompt = usePrompt();
  const navigation = useNavigation();
  const { workouts } = useDatabase();
  return () => {
    try {
      const session = workouts.startSession();
      navigation.navigate('WorkoutDetails', { sessionId: session.id });
    } catch (error) {
      showPrompt(
        t('workouts:startError'),
        localizeError(error, t('workouts:startAgain')),
      );
    }
  };
}
