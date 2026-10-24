import {Platform} from 'react-native';
import type {RemoteMessage} from '@react-native-firebase/messaging';
import type {FirebaseRuntimeStatus} from './firebaseStatus';
import {probeFirebaseRuntime} from './firebaseStatus';
import type {PushTokenRecord} from '../types';

export type FirebaseMessagingBindings = {
  status: FirebaseRuntimeStatus;
  getToken: () => Promise<PushTokenRecord | null>;
  getApnsToken: () => Promise<string | null>;
  subscribe: (handlers: {
    onForegroundMessage: (message: RemoteMessage) => Promise<void>;
    onOpened: (message: RemoteMessage) => Promise<void>;
    onInitial: (message: RemoteMessage) => Promise<void>;
    onTokenRefresh: (token: string) => Promise<void>;
  }) => () => void;
};

let backgroundHandlerRegistered = false;

/**
 * Registers the FCM background handler exactly once (must be early — index.js).
 * Safe no-op when Firebase native is not configured.
 */
export function registerFirebaseBackgroundHandler(
  handler: (message: RemoteMessage) => Promise<void>,
): void {
  if (backgroundHandlerRegistered) {
    return;
  }
  backgroundHandlerRegistered = true;

  try {
    const status = probeFirebaseRuntime();
    if (!status.messagingAvailable) {
      return;
    }
    const {
      getMessaging,
      setBackgroundMessageHandler,
    } = require('@react-native-firebase/messaging') as {
      getMessaging: () => unknown;
      setBackgroundMessageHandler: (
        messaging: unknown,
        cb: (message: RemoteMessage) => Promise<void>,
      ) => void;
    };
    setBackgroundMessageHandler(getMessaging(), handler);
  } catch {
    // Native Firebase not ready — leave background handler unregistered.
  }
}

type MessagingModule = {
  getMessaging: () => unknown;
  getToken: (messaging: unknown) => Promise<string>;
  getAPNSToken: (messaging: unknown) => Promise<string | null>;
  onMessage: (
    messaging: unknown,
    listener: (message: RemoteMessage) => void,
  ) => () => void;
  onNotificationOpenedApp: (
    messaging: unknown,
    listener: (message: RemoteMessage) => void,
  ) => () => void;
  getInitialNotification: (messaging: unknown) => Promise<RemoteMessage | null>;
  onTokenRefresh: (
    messaging: unknown,
    listener: (token: string) => void,
  ) => () => void;
  registerDeviceForRemoteMessages: (messaging: unknown) => Promise<void>;
  isDeviceRegisteredForRemoteMessages: (messaging: unknown) => boolean;
};

function loadMessagingModule(): MessagingModule {
  return require('@react-native-firebase/messaging') as MessagingModule;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * iOS FCM tokens require an APNs device token first. After permission +
 * registerForRemoteNotifications, APNs can arrive a moment later.
 */
async function waitForApnsToken(
  messagingApi: MessagingModule,
  messaging: unknown,
  attempts = 8,
  delayMs = 250,
): Promise<string | null> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const apns = await messagingApi.getAPNSToken(messaging);
      if (apns) {
        return apns;
      }
    } catch {
      // Keep polling — APNs may not be ready yet.
    }
    await sleep(delayMs);
  }
  return null;
}

/**
 * Always re-probes Firebase. Do not cache a "not configured" result from
 * early module evaluation — native Firebase may become ready after JS starts.
 */
export function createFirebaseMessagingBindings(): FirebaseMessagingBindings {
  const status = probeFirebaseRuntime();

  if (!status.messagingAvailable) {
    return {
      status,
      async getToken() {
        const again = probeFirebaseRuntime();
        if (!again.messagingAvailable) {
          throw new Error(
            `FCM unavailable: ${again.detail}. Rebuild after adding GoogleService-Info.plist / google-services.json.`,
          );
        }
        return createFirebaseMessagingBindings().getToken();
      },
      async getApnsToken() {
        return null;
      },
      subscribe() {
        return () => undefined;
      },
    };
  }

  const messagingApi = loadMessagingModule();
  const messaging = messagingApi.getMessaging();

  return {
    status,
    async getToken() {
      if (Platform.OS === 'ios') {
        try {
          if (!messagingApi.isDeviceRegisteredForRemoteMessages(messaging)) {
            await messagingApi.registerDeviceForRemoteMessages(messaging);
          }
        } catch (error) {
          throw new Error(
            `iOS registerDeviceForRemoteMessages failed: ${
              error instanceof Error ? error.message : String(error)
            }. On Simulator, push registration is limited — use a physical device if this persists.`,
          );
        }

        const apns = await waitForApnsToken(messagingApi, messaging);
        if (!apns) {
          // Still attempt getToken — some Simulator builds can mint FCM without
          // exposing APNs via getAPNSToken. Surface a clear error if it fails.
          try {
            const token = await messagingApi.getToken(messaging);
            if (token) {
              return {
                token,
                kind: 'fcm',
                updatedAt: new Date().toISOString(),
                source: 'native',
              };
            }
          } catch (error) {
            throw new Error(
              `No APNs device token yet, and FCM getToken failed: ${
                error instanceof Error ? error.message : String(error)
              }. ` +
                'Tap Request Permission first, then Get Token. iOS Simulator often cannot obtain a real APNs/FCM token — use a physical iPhone.',
            );
          }
          throw new Error(
            'No APNs device token and empty FCM token. Tap Request Permission, then retry. Prefer a physical iPhone over Simulator.',
          );
        }

        try {
          const token = await messagingApi.getToken(messaging);
          if (!token) {
            throw new Error(
              'Firebase getToken() returned empty after APNs registration.',
            );
          }
          return {
            token,
            kind: 'fcm',
            updatedAt: new Date().toISOString(),
            source: 'native',
            apnsDeviceToken: apns,
          };
        } catch (error) {
          throw new Error(
            `FCM getToken failed (APNs present): ${
              error instanceof Error ? error.message : String(error)
            }. Check that an APNs key/certificate is uploaded in Firebase Console → Project settings → Cloud Messaging.`,
          );
        }
      }

      try {
        const token = await messagingApi.getToken(messaging);
        if (!token) {
          throw new Error(
            'Firebase getToken() returned empty. Request notification permission first.',
          );
        }
        return {
          token,
          kind: 'fcm',
          updatedAt: new Date().toISOString(),
          source: 'native',
        };
      } catch (error) {
        throw new Error(
          `FCM getToken failed: ${
            error instanceof Error ? error.message : String(error)
          }. Ensure google-services.json is present and Google Play services are available.`,
        );
      }
    },
    async getApnsToken() {
      if (Platform.OS !== 'ios') {
        return null;
      }
      try {
        return (await messagingApi.getAPNSToken(messaging)) ?? null;
      } catch {
        return null;
      }
    },
    subscribe(handlers) {
      const unsubForeground = messagingApi.onMessage(messaging, message => {
        handlers.onForegroundMessage(message).catch(() => undefined);
      });
      const unsubOpened = messagingApi.onNotificationOpenedApp(
        messaging,
        message => {
          handlers.onOpened(message).catch(() => undefined);
        },
      );
      const unsubRefresh = messagingApi.onTokenRefresh(messaging, token => {
        handlers.onTokenRefresh(token).catch(() => undefined);
      });

      messagingApi
        .getInitialNotification(messaging)
        .then(message => {
          if (message) {
            return handlers.onInitial(message);
          }
          return undefined;
        })
        .catch(() => undefined);

      return () => {
        unsubForeground();
        unsubOpened();
        unsubRefresh();
      };
    },
  };
}
