import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
} from '../../config/constants';
import type {NotificationPermissionStatus} from '../../types';
import {
  createFirebaseMessagingBindings,
  type FirebaseMessagingBindings,
} from '../firebaseMessaging';
import type {PlatformPushAdapter} from './types';

function mapNotifeeAuth(
  status: AuthorizationStatus,
): NotificationPermissionStatus {
  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
      return 'AUTHORIZED';
    case AuthorizationStatus.DENIED:
      return 'DENIED';
    case AuthorizationStatus.NOT_DETERMINED:
      return 'NOT_DETERMINED';
    case AuthorizationStatus.PROVISIONAL:
      return 'PROVISIONAL';
    default:
      return 'UNKNOWN';
  }
}

function resolveFirebase(): FirebaseMessagingBindings {
  return createFirebaseMessagingBindings();
}

/**
 * Android push adapter.
 *
 * Permissions: Notifee + POST_NOTIFICATIONS (API 33+).
 * Remote token: FCM registration token via React Native Firebase when configured.
 */
export function createAndroidPushAdapter(): PlatformPushAdapter {
  return {
    get name() {
      return resolveFirebase().status.messagingAvailable
        ? 'android-fcm+notifee'
        : 'android-notifee';
    },
    remoteTokenKind: 'fcm',

    async initialize(): Promise<void> {
      await this.ensureAndroidChannel?.();
    },

    async ensureAndroidChannel(): Promise<void> {
      await notifee.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: NOTIFICATION_CHANNEL_NAME,
        importance: 4,
      });
    },

    async checkPermission(): Promise<NotificationPermissionStatus> {
      const apiLevel =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : Number.parseInt(String(Platform.Version), 10);
      if (apiLevel >= 33) {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (!result) {
          const settings = await notifee.getNotificationSettings();
          if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
            return 'BLOCKED';
          }
          return mapNotifeeAuth(settings.authorizationStatus);
        }
      }

      const settings = await notifee.getNotificationSettings();
      return mapNotifeeAuth(settings.authorizationStatus);
    },

    async requestPermission(): Promise<NotificationPermissionStatus> {
      const apiLevel =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : Number.parseInt(String(Platform.Version), 10);

      if (apiLevel >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return 'BLOCKED';
        }
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          return 'DENIED';
        }
      }

      const settings = await notifee.requestPermission();
      return mapNotifeeAuth(settings.authorizationStatus);
    },

    async getRemoteToken() {
      return resolveFirebase().getToken();
    },

    getFirebaseMessaging() {
      const firebase = resolveFirebase();
      return firebase.status.messagingAvailable ? firebase : null;
    },

    cleanup(): void {},
  };
}
