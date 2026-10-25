/* eslint-env jest */
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return { GestureHandlerRootView: View };
});
// Keep the real navigators and route behavior; replace only native platform views.
jest.mock('react-native-screens', () => {
  const screens = jest.requireActual('react-native-screens');
  const { View } = require('react-native');
  return {
    ...screens,
    Screen: View,
    ScreenContainer: View,
    ScreenStack: View,
    ScreenStackItem: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    FullWindowOverlay: View,
    ScreenContentWrapper: View,
  };
});

jest.mock('react-native-localize', () => ({
  getTimeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
}));
beforeEach(() =>
  require('./src/localization/i18n').initializeLocalization('en-US'),
);
