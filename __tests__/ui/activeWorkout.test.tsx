import { PromptProvider } from '../../src/app/providers/PromptProvider';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { openDatabase } from '../support/database';
import { migrateDatabase } from '../../src/database/migrations';
import { createWorkoutRepository } from '../../src/database/repositories/workoutRepository';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { RootNavigator } from '../../src/app/navigation/RootNavigator';
let mockDatabase: ReturnType<typeof openDatabase>;
let mockWorkouts: ReturnType<typeof createWorkoutRepository>;
jest.mock('../../src/app/providers/DatabaseProvider', () => ({
  useDatabase: () => ({ database: mockDatabase, workouts: mockWorkouts }),
}));
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 24, 18));
  mockDatabase = openDatabase();
  migrateDatabase(mockDatabase);
  mockWorkouts = createWorkoutRepository(mockDatabase);
});
afterEach(() => {
  jest.restoreAllMocks();
  mockDatabase.close();
  jest.useRealTimers();
});
async function begin() {
  await render(
    <SafeAreaProvider>
      <ThemeProvider>
        <PromptProvider>
          <RootNavigator />
        </PromptProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Start Workout' }));
}
test('real repository flow: pick, validate, log, rest, finish, and update the dashboard', async () => {
  await begin();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Add Exercise' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Add Barbell Bench Press' }),
  );
  await fireEvent.changeText(
    await screen.findByLabelText('Load for set 1 in kg'),
    '120',
  );
  await fireEvent.changeText(screen.getByLabelText('Reps for set 1'), '5');
  await fireEvent.changeText(screen.getByLabelText('RPE for set 1'), '9');
  await fireEvent.press(
    screen.getByRole('checkbox', { name: 'Complete set 1' }),
  );
  expect(
    await screen.findByText('Set saved • New recorded load PR'),
  ).toBeOnTheScreen();
  const id = mockWorkouts.getActiveSession()!.id;
  expect(mockWorkouts.listSets(id)[0]).toMatchObject({
    weightKg: 120,
    reps: 5,
    rpe: 9,
    completedAt: expect.any(Number),
  });
  expect(screen.getByLabelText('Rest remaining 02:00')).toBeOnTheScreen();
  await act(() => jest.advanceTimersByTime(10_000));
  expect(screen.getByLabelText('Rest remaining 01:50')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '+30s' }));
  expect(screen.getByLabelText('Rest remaining 02:20')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Skip rest' }));
  expect(mockWorkouts.getEditorState(id).runtime.restEndsAt).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Add Set' }));
  await fireEvent.press(
    screen.getByRole('checkbox', { name: 'Complete set 2' }),
  );
  expect(await screen.findByText(/whole rep count/)).toBeOnTheScreen();
  expect(
    mockWorkouts.listSets(id).filter(set => set.completedAt !== null),
  ).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Finish' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Finish Workout' }));
  expect(mockWorkouts.getSession(id)?.status).toBe('completed');
  expect(mockWorkouts.getActiveSession()).toBeNull();
  expect(await screen.findByText('1 workout completed')).toBeOnTheScreen();
  expect(screen.getByText('Barbell Bench Press')).toBeOnTheScreen();
});
test('minimize and resume keep valid drafts and selected set', async () => {
  await begin();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Add Exercise' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Add Barbell Bench Press' }),
  );
  await fireEvent.changeText(
    await screen.findByLabelText('Load for set 1 in kg'),
    '82.5',
  );
  await fireEvent.changeText(screen.getByLabelText('Reps for set 1'), '6');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Minimize workout' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Resume Workout' }),
  );
  expect(
    await screen.findByLabelText('Load for set 1 in kg'),
  ).toHaveDisplayValue('82.5');
  expect(screen.getByLabelText('Reps for set 1')).toHaveDisplayValue('6');
});

test('tab-bar quick start resumes the same session from another tab without creating a duplicate', async () => {
  await begin();
  expect(await screen.findByText('Build your workout')).toBeOnTheScreen();
  const id = mockWorkouts.getActiveSession()!.id;
  await fireEvent.press(
    screen.getByRole('button', { name: 'Minimize workout' }),
  );
  await fireEvent.press(screen.getByRole('tab', { name: 'Progress' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Quick start workout' }),
  );
  expect(await screen.findByText('Build your workout')).toBeOnTheScreen();
  expect(mockWorkouts.getActiveSession()?.id).toBe(id);
  expect(
    mockDatabase.execute('SELECT COUNT(*) AS count FROM workout_sessions')
      .rows[0]?.count,
  ).toBe(1);
});

test('failed session creation reports an error and keeps Home available', async () => {
  mockDatabase.execute(
    "CREATE TRIGGER reject_session BEFORE INSERT ON workout_sessions BEGIN SELECT RAISE(ABORT, 'cannot create workout'); END",
  );
  await begin();
  expect(screen.getByText('Workout could not start')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(mockWorkouts.getActiveSession()).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Start Workout' }),
  ).toBeOnTheScreen();
});
