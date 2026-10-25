import { PromptProvider } from '../../src/app/providers/PromptProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { createWorkoutRepository } from '../../src/database/repositories/workoutRepository';
import {
  loadPreferences,
  savePreferences,
} from '../../src/services/storage/preferences';
import { usePreferencesStore } from '../../src/app/config/preferencesStore';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { LanguageSettings } from '../../src/localization/LanguageSettings';
import {
  initializeLocalization,
  getLanguage,
  t,
} from '../../src/localization/i18n';
import {
  needsDirectionRestart,
  prepareNativeDirection,
} from '../../src/localization/direction';
import { Text } from '../../src/shared/components/Text';
let mockDatabase: ReturnType<typeof openDatabase>;
let mockWorkouts: ReturnType<typeof createWorkoutRepository>;
jest.mock('../../src/app/providers/DatabaseProvider', () => ({
  useDatabase: () => ({ database: mockDatabase, workouts: mockWorkouts }),
}));
beforeEach(async () => {
  mockDatabase = openDatabase();
  migrateDatabase(mockDatabase);
  mockWorkouts = createWorkoutRepository(mockDatabase);
  jest.replaceProperty(I18nManager, 'isRTL', true);
  usePreferencesStore.getState().setPreferences(loadPreferences(mockDatabase));
  await initializeLocalization('ar-EG');
});
afterEach(() => {
  jest.restoreAllMocks();
  mockDatabase.close();
});
function TranslatedText() {
  useTranslation();
  return <Text>{t('home:start')}</Text>;
}
test('Arabic uses translated labels, Arabic typography and RTL text; English switches to LTR typography', async () => {
  await render(
    <ThemeProvider>
      <TranslatedText />
    </ThemeProvider>,
  );
  expect(screen.getByText('ابدأ التمرين')).toHaveStyle({
    writingDirection: 'rtl',
    textAlign: 'start',
    fontFamily: 'IBMPlexSansArabic-Regular',
  });
  await act(() => initializeLocalization('en-US'));
  expect(screen.getByText('Start Workout')).toHaveStyle({
    writingDirection: 'ltr',
    textAlign: 'start',
    fontFamily: 'PlusJakartaSans-Regular',
  });
});
test('direction policy overrides the device for each explicit app language', () => {
  const allow = jest.spyOn(I18nManager, 'allowRTL');
  const force = jest.spyOn(I18nManager, 'forceRTL');
  expect(needsDirectionRestart('ar-EG', false)).toBe(true);
  expect(needsDirectionRestart('en-US', true)).toBe(true);
  expect(needsDirectionRestart('en-US', false)).toBe(false);
  prepareNativeDirection('en-US');
  expect(allow).toHaveBeenLastCalledWith(false);
  expect(force).toHaveBeenLastCalledWith(false);
  prepareNativeDirection('ar-EG');
  expect(allow).toHaveBeenLastCalledWith(true);
  expect(force).toHaveBeenLastCalledWith(true);
});
test('language confirmation persists English without restarting or changing an active workout or current Arabic UI', async () => {
  const session = mockWorkouts.startSession();
  mockWorkouts.addExercise(session.id, 'barbell-bench-press');
  const set = mockWorkouts.listSets(session.id)[0]!;
  mockWorkouts.saveSet({ ...set, weightKg: 82.5, reps: 6 });
  const before = mockDatabase.execute('SELECT * FROM workout_sets').rows;
  const force = jest.spyOn(I18nManager, 'forceRTL');
  await render(
    <ThemeProvider>
      <SafeAreaProvider>
        <PromptProvider>
          <LanguageSettings />
        </PromptProvider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'English (US)' }));
  expect(loadPreferences(mockDatabase).language).toBe('ar-EG');
  expect(
    screen.getByText(new RegExp(t('settings:activeWorkoutNotice'))),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: t('settings:confirmLanguage') }),
  );
  expect(loadPreferences(mockDatabase).language).toBe('en-US');
  expect(force).toHaveBeenLastCalledWith(false);
  expect(getLanguage()).toBe('ar-EG');
  expect(screen.getByText(t('settings:pendingRestart'))).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'English (US)' })).toBeSelected();
  expect(mockDatabase.execute('SELECT * FROM workout_sets').rows).toEqual(
    before,
  );
  expect(mockWorkouts.getActiveSession()?.id).toBe(session.id);
});
test('canceling a direction change leaves the language and native flags untouched', async () => {
  const force = jest.spyOn(I18nManager, 'forceRTL');
  await render(
    <ThemeProvider>
      <SafeAreaProvider>
        <PromptProvider>
          <LanguageSettings />
        </PromptProvider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'English (US)' }));
  await fireEvent.press(
    screen.getByRole('button', { name: t('common:cancel') }),
  );
  expect(loadPreferences(mockDatabase).language).toBe('ar-EG');
  expect(force).not.toHaveBeenCalled();
});
test('a failed language write neither changes native flags nor selects the unsaved language', async () => {
  mockDatabase.execute(
    "CREATE TRIGGER reject_language BEFORE UPDATE ON app_preferences BEGIN SELECT RAISE(ABORT, 'storage unavailable'); END",
  );
  const force = jest.spyOn(I18nManager, 'forceRTL');
  await render(
    <ThemeProvider>
      <SafeAreaProvider>
        <PromptProvider>
          <LanguageSettings />
        </PromptProvider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'English (US)' }));
  await fireEvent.press(
    screen.getByRole('button', { name: t('settings:confirmLanguage') }),
  );
  expect(await screen.findByText(t('settings:saveError'))).toBeOnTheScreen();
  expect(loadPreferences(mockDatabase).language).toBe('ar-EG');
  expect(force).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: t('settings:arabic') }),
  ).toBeSelected();
});
test('returning English selection remains persisted when other preferences change', () => {
  savePreferences(mockDatabase, {
    theme: 'dark',
    weightUnit: 'kg',
    language: 'en-US',
  });
  savePreferences(mockDatabase, {
    ...loadPreferences(mockDatabase),
    weightUnit: 'lb',
  });
  expect(loadPreferences(mockDatabase)).toEqual({
    theme: 'dark',
    weightUnit: 'lb',
    language: 'en-US',
  });
});
