import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { darkColors, lightColors } from '../../src/app/theme/tokens';
import { Text } from '../../src/shared/components/Text';
import { Button } from '../../src/shared/components/Button';
import { usePreferencesStore } from '../../src/app/config/preferencesStore';

afterEach(() =>
  usePreferencesStore.setState({ theme: 'dark', weightUnit: 'kg' }),
);
test('theme follows the preference and updates rendered text', async () => {
  await render(
    <ThemeProvider>
      <Text>RepForge</Text>
    </ThemeProvider>,
  );
  expect(screen.getByText('RepForge')).toHaveStyle({
    color: darkColors.text,
  });
  await act(() => usePreferencesStore.setState({ theme: 'light' }));
  expect(screen.getByText('RepForge')).toHaveStyle({
    color: lightColors.text,
  });
});
test('disabled button exposes state and prevents actions', async () => {
  const action = jest.fn();
  await render(
    <ThemeProvider>
      <Button title="Start" disabled onPress={action} />
    </ThemeProvider>,
  );
  expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  await fireEvent.press(screen.getByText('Start'));
  expect(action).not.toHaveBeenCalled();
});
