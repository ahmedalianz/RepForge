import { useTranslation } from 'react-i18next';
import { t } from '../../../localization/i18n';
import type { RootScreenProps } from '../../../app/navigation/types';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
export function ExerciseDetailsScreen({
  route,
}: RootScreenProps<'ExerciseDetails'>) {
  useTranslation();
  return (
    <Screen>
      <EmptyState
        title={t('exercises:details')}
        message={t('exercises:planned', {
          id: route.params?.exerciseId ?? t('exercises:noneSelected'),
        })}
      />
    </Screen>
  );
}
