import { PromptProvider } from '../../src/app/providers/PromptProvider';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../../src/app/navigation/RootNavigator';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import type { WorkoutSession } from '../../src/features/workouts/domain/types';
const session: WorkoutSession = {
  id: 'session-1',
  routineId: null,
  status: 'active',
  startedAt: 1000,
  completedAt: null,
};
const mockWorkouts = {
  getActiveSession: jest.fn((): WorkoutSession | null => null),
  getSession: jest.fn(() => session),
  startSession: jest.fn(() => session),
  finishSession: jest.fn(),
  getEditorState: jest.fn(() => ({
    title: 'Freestyle workout',
    exercises: [],
    runtime: {
      activeExerciseId: null,
      activeSetId: null,
      restEndsAt: null,
      restDurationMs: 120000,
    },
  })),
};
jest.mock('../../src/app/providers/DatabaseProvider', () => ({
  useDatabase: () => ({ workouts: mockWorkouts }),
}));
jest.mock('../../src/features/home/data/dashboardRepository', () => {
  const { getWeekDays } = jest.requireActual<
    typeof import('../../src/features/home/domain/dashboard')
  >('../../src/features/home/domain/dashboard');
  return {
    readDashboard: jest.fn((_database: unknown, now: number) => ({
      days: getWeekDays(now).map(day => ({
        date: day.start,
        label: day.label,
        workouts: 0,
        volumeKg: 0,
        isToday: false,
        isFuture: false,
      })),
      weeklyWorkouts: 0,
      totalWorkouts: 0,
      weeklyVolumeKg: 0,
      activeTimeMs: 0,
      streakDays: 0,
      recentRecord: null,
      recentVolumeKg: 0,
      previousVolumeKg: 0,
    })),
  };
});
jest.mock('../../src/features/progress/data/progressRepository', () => ({
  readProgress: () => ({ exercises: [], sets: [], sessions: [], records: [] }),
}));
beforeEach(() => {
  mockWorkouts.getActiveSession.mockReturnValue(null);
  jest.clearAllMocks();
});
function TestNavigation() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PromptProvider>
          <RootNavigator />
        </PromptProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
test('Home starts a workout through the real stack', async () => {
  await render(<TestNavigation />);
  await fireEvent.press(screen.getByRole('button', { name: 'Start Workout' }));
  await waitFor(() =>
    expect(screen.getByText('Build your workout')).toBeOnTheScreen(),
  );
  expect(mockWorkouts.startSession).toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Minimize workout' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Start Workout' }),
  ).toBeOnTheScreen();
});
test('Progress tab opens personal records', async () => {
  await render(<TestNavigation />);
  await fireEvent.press(screen.getByText('Progress'));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Personal Records' }),
  );
  expect(await screen.findByText('No records yet')).toBeOnTheScreen();
});

test('dashboard resumes an existing workout directly', async () => {
  mockWorkouts.getActiveSession.mockReturnValue(session);
  await render(<TestNavigation />);
  await fireEvent.press(screen.getByRole('button', { name: 'Resume Workout' }));
  expect(await screen.findByText('Build your workout')).toBeOnTheScreen();
});
test('raised quick-start action opens the active workout directly', async () => {
  await render(<TestNavigation />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Quick start workout' }),
  );
  expect(await screen.findByText('Build your workout')).toBeOnTheScreen();
});

test('dashboard profile shortcut selects the Profile tab', async () => {
  await render(<TestNavigation />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open profile' }));
  expect(await screen.findByText('Appearance')).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'Profile' })).toBeSelected();
});
