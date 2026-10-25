import { useTranslation } from 'react-i18next';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
export function GoalsScreen() {
  const { t } = useTranslation('goals');
  return (
    <Screen>
      <EmptyState title={t('title')} message={t('empty')} />
    </Screen>
  );
}
