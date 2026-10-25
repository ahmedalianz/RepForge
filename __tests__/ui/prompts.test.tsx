import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  PromptProvider,
  usePrompt,
} from '../../src/app/providers/PromptProvider';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { Button } from '../../src/shared/components/Button';
import { Icon } from '../../src/shared/components/Icon';
import { initializeLocalization } from '../../src/localization/i18n';

test('skip mirrors in Arabic, returns to LTR in English, and non-directional icons stay unchanged', async () => {
  await initializeLocalization('ar-EG');
  const view = await render(<Icon name="skip" color="#fff" />);
  expect(StyleSheet.flatten(screen.root!.props.style).transform).toEqual([
    { scaleX: -1 },
  ]);
  await act(() => initializeLocalization('en-US'));
  expect(
    StyleSheet.flatten(screen.root!.props.style).transform,
  ).toBeUndefined();
  await act(() => initializeLocalization('ar-EG'));
  await view.rerender(<Icon name="timer" color="#fff" />);
  expect(
    StyleSheet.flatten(screen.root!.props.style).transform,
  ).toBeUndefined();
});

test('themed menus support nested confirmations and Android Back cancels without taking an action', async () => {
  const remove = jest.fn();
  const cancel = jest.fn();
  function Example() {
    const prompt = usePrompt();
    return (
      <Button
        title="Options"
        onPress={() =>
          prompt('Exercise options', undefined, [
            {
              text: 'Remove exercise',
              style: 'destructive',
              onPress: () =>
                prompt('Remove?', 'Saved sets will be removed.', [
                  { text: 'Keep exercise', style: 'cancel', onPress: cancel },
                  {
                    text: 'Confirm removal',
                    style: 'destructive',
                    onPress: remove,
                  },
                ]),
            },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
      />
    );
  }
  await render(
    <SafeAreaProvider>
      <ThemeProvider>
        <PromptProvider>
          <Example />
        </PromptProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Options' }));
  expect(screen.queryByRole('button', { name: 'Options' })).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove exercise' }),
  );
  expect(screen.getByRole('header', { name: 'Remove?' })).toBeOnTheScreen();
  await act(() =>
    screen.container
      .queryAll(node => typeof node.props.onRequestClose === 'function')[0]!
      .props.onRequestClose(),
  );
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(remove).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Options' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Options' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove exercise' }),
  );
  const confirmation = screen.getByRole('button', { name: 'Confirm removal' });
  await fireEvent.press(confirmation);
  await fireEvent.press(confirmation);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Remove?')).toBeNull();
});
