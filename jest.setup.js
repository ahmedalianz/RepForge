jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn(() => false),
  useHideAnimation: jest.fn().mockReturnValue({
    container: {},
    logo: {source: 0},
    brand: {source: 0},
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

jest.mock('@notifee/react-native', () => {
  const AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  const EventType = {
    PRESS: 1,
    DISMISSED: 0,
    DELIVERED: 3,
  };
  return {
    __esModule: true,
    default: {
      createChannel: jest.fn(async () => 'rnlab-default'),
      getNotificationSettings: jest.fn(async () => ({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })),
      requestPermission: jest.fn(async () => ({
        authorizationStatus: AuthorizationStatus.AUTHORIZED,
      })),
      displayNotification: jest.fn(async () => 'id'),
      onForegroundEvent: jest.fn(() => jest.fn()),
      onBackgroundEvent: jest.fn(),
      getInitialNotification: jest.fn(async () => null),
    },
    AuthorizationStatus,
    EventType,
  };
});
