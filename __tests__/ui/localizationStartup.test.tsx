import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { act, render, screen } from '@testing-library/react-native';
import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { savePreferences } from '../../src/services/storage/preferences';
import { DatabaseProvider } from '../../src/app/providers/DatabaseProvider';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { Text } from '../../src/shared/components/Text';
import { initializeLocalization, t } from '../../src/localization/i18n';

let mockDatabase: ReturnType<typeof openDatabase>;
jest.mock('../../src/database/connection', () => ({
  getDatabase: () => mockDatabase,
}));
function Child() {
  const { t: translate } = useTranslation('home');
  return <Text testID="initialized-content">{translate('start')}</Text>;
}
async function start() {
  await render(
    <ThemeProvider>
      <DatabaseProvider>
        <Child />
      </DatabaseProvider>
    </ThemeProvider>,
  );
  expect(screen.queryByTestId('initialized-content')).toBeNull();
  await act(async () => {
    await jest.runOnlyPendingTimersAsync();
  });
}
beforeEach(() => {
  jest.useFakeTimers();
  mockDatabase = openDatabase();
  migrateDatabase(mockDatabase);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  mockDatabase.close();
});
test('first launch hydrates Arabic before mounting application content', async () => {
  jest.replaceProperty(I18nManager, 'isRTL', true);
  await start();
  expect(screen.getByTestId('initialized-content')).toHaveTextContent(
    'ابدأ التمرين',
  );
});
test('saved English overrides the initial Arabic locale before mounting content', async () => {
  await initializeLocalization('ar-EG');
  savePreferences(mockDatabase, {
    theme: 'dark',
    weightUnit: 'kg',
    language: 'en-US',
  });
  jest.replaceProperty(I18nManager, 'isRTL', false);
  await start();
  expect(screen.getByTestId('initialized-content')).toHaveTextContent(
    'Start Workout',
  );
});
test('a stale native direction is repaired without mounting mixed-direction navigation', async () => {
  savePreferences(mockDatabase, {
    theme: 'dark',
    weightUnit: 'kg',
    language: 'en-US',
  });
  jest.replaceProperty(I18nManager, 'isRTL', true);
  const force = jest.spyOn(I18nManager, 'forceRTL');
  await start();
  expect(screen.queryByTestId('initialized-content')).toBeNull();
  expect(screen.getByText(t('settings:pendingRestart'))).toBeOnTheScreen();
  expect(force).toHaveBeenLastCalledWith(false);
});
