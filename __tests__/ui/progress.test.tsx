import { PromptProvider } from '../../src/app/providers/PromptProvider';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { createWorkoutRepository } from '../../src/database/repositories/workoutRepository';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { RootNavigator } from '../../src/app/navigation/RootNavigator';
import { usePreferencesStore } from '../../src/app/config/preferencesStore';
let mockDatabase: ReturnType<typeof openDatabase>;
let mockWorkouts: ReturnType<typeof createWorkoutRepository>;
jest.mock('../../src/app/providers/DatabaseProvider', () => ({
  useDatabase: () => ({ database: mockDatabase, workouts: mockWorkouts }),
}));
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 24, 12));
  mockDatabase = openDatabase();
  migrateDatabase(mockDatabase);
  mockWorkouts = createWorkoutRepository(mockDatabase);
  usePreferencesStore
    .getState()
    .setPreferences({ theme: 'dark', weightUnit: 'kg', language: 'en-US' });
});
afterEach(() => {
  mockDatabase.close();
  jest.useRealTimers();
});
async function openProgress() {
  await render(
    <SafeAreaProvider>
      <ThemeProvider>
        <PromptProvider>
          <RootNavigator />
        </PromptProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByRole('tab', { name: 'Progress' }));
}
function seed() {
  const at = Date.now() - 1000;
  mockDatabase.execute(
    "INSERT INTO workout_sessions VALUES('logged',NULL,?,?,'completed')",
    [at - 3600000, at],
  );
  mockDatabase.execute(
    "INSERT INTO workout_sets VALUES('lift','logged','barbell-bench-press',0,'external',120,5,9,'working',?)",
    [at - 1],
  );
  mockDatabase.execute(
    "INSERT INTO session_exercises VALUES('logged','barbell-bench-press',0)",
  );
}
test('progress filters, display units and source-workout history use real persisted data', async () => {
  seed();
  await openProgress();
  expect(
    await screen.findByLabelText(/Estimated 1RM trajectory:.*140 kg/),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'lb' }));
  expect(
    await screen.findByLabelText(/Estimated 1RM trajectory:.*308.6 lb/),
  ).toBeOnTheScreen();
  expect(
    mockDatabase.execute('SELECT weight_kg FROM workout_sets').rows[0]
      ?.weight_kg,
  ).toBe(120);
  expect(
    mockDatabase.execute('SELECT weight_unit FROM app_preferences').rows[0]
      ?.weight_unit,
  ).toBe('lb');
  await fireEvent.press(screen.getByRole('button', { name: 'Volume' }));
  expect(
    await screen.findByLabelText(
      /External volume by training day:.*1,322.8 lb/,
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Consistency' }));
  expect(
    await screen.findByLabelText(/Workouts by calendar day:.*1 workout/),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Personal Records' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', {
      name: /Open workout for Barbell Bench Press/,
    }),
  );
  expect(
    await screen.findByText('Session completed. Completed sets are saved.'),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Minimize workout' }),
  );
  expect(await screen.findByText('Recorded Load History')).toBeOnTheScreen();
});
test('empty analytics remain usable and exercise/range filters update their context', async () => {
  await openProgress();
  expect(
    await screen.findByText('No strength data in this range'),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: /Choose exercise/ }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Select Pull-up' }),
  );
  expect(
    await screen.findByText(
      'Bodyweight and assisted sets are tracked separately from external-load estimates.',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '1 month' }));
  expect(screen.getByRole('button', { name: '1 month' })).toBeSelected();
});

test('failed preference persistence leaves the display unit unchanged and reports the error', async () => {
  seed();
  mockDatabase.execute(
    "CREATE TRIGGER reject_unit BEFORE UPDATE ON app_preferences BEGIN SELECT RAISE(ABORT, 'preference write failed'); END",
  );
  await openProgress();
  await fireEvent.press(await screen.findByRole('button', { name: 'lb' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /preference write failed|could not be saved/,
  );
  expect(screen.getByRole('button', { name: 'kg' })).toBeSelected();
  expect(
    mockDatabase.execute('SELECT weight_unit FROM app_preferences').rows[0]
      ?.weight_unit,
  ).toBe('kg');
});

function seedTrainingDay(day: number) {
  const at = new Date(2026, 9, day, 11).getTime();
  mockDatabase.execute(
    "INSERT INTO workout_sessions VALUES(?,NULL,?,?,'completed')",
    [`day-${day}`, at - 3_600_000, at],
  );
  mockDatabase.execute(
    "INSERT INTO workout_sets VALUES(?,?,'barbell-bench-press',0,'external',?,5,8,'working',?)",
    [`lift-${day}`, `day-${day}`, 100 + day * 5, at - 1],
  );
}

test('refresh preserves an inspected training date when a new training day is appended', async () => {
  jest.setSystemTime(new Date(2026, 9, 3, 12));
  [1, 2, 3].forEach(seedTrainingDay);
  await openProgress();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Previous chart point' }),
  );
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 2,/),
  ).toBeOnTheScreen();
  jest.setSystemTime(new Date(2026, 9, 4, 12));
  seedTrainingDay(4);
  await act(() => jest.advanceTimersByTime(60_000));
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 2,/),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Next chart point' }),
  );
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 3,/),
  ).toBeOnTheScreen();
});

test('an untouched chart follows the latest day and a removed selection falls back to the latest remaining day', async () => {
  jest.setSystemTime(new Date(2026, 9, 3, 12));
  [1, 2, 3].forEach(seedTrainingDay);
  await openProgress();
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 3,/),
  ).toBeOnTheScreen();
  jest.setSystemTime(new Date(2026, 9, 4, 12));
  seedTrainingDay(4);
  await act(() => jest.advanceTimersByTime(60_000));
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 4,/),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Previous chart point' }),
  );
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 3,/),
  ).toBeOnTheScreen();
  mockDatabase.execute("DELETE FROM workout_sets WHERE session_id = 'day-3'");
  mockDatabase.execute("DELETE FROM workout_sessions WHERE id = 'day-3'");
  await act(() => jest.advanceTimersByTime(60_000));
  expect(
    await screen.findByLabelText(/^Estimated 1RM trajectory: Oct 4,/),
  ).toBeOnTheScreen();
});

test('consistency permits inspecting zero-workout days between logged sessions', async () => {
  [1, 24].forEach(seedTrainingDay);
  await openProgress();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Consistency' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Previous chart point' }),
  );
  expect(
    await screen.findByLabelText(
      /^Workouts by calendar day: Oct 23, 0 workouts/,
    ),
  ).toBeOnTheScreen();
});
