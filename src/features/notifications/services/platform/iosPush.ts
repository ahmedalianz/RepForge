import notifee, {AuthorizationStatus} from '@notifee/react-native';
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
  // Always re-probe — never cache a "not configured" result from early boot.
  return createFirebaseMessagingBindings();
}

/**
 * iOS push adapter.
 *
 * Permissions: Notifee → UNUserNotificationCenter.
 * Remote token via Firebase: FCM registration token (NOT the raw APNs device token).
 * APNs device token is exposed separately via getAPNSToken for learning.
 */
export function createIosPushAdapter(): PlatformPushAdapter {
  return {
    get name() {
      return resolveFirebase().status.messagingAvailable
        ? 'ios-fcm+notifee'
        : 'ios-notifee';
    },
    remoteTokenKind: 'fcm',

    async initialize(): Promise<void> {},

    async checkPermission(): Promise<NotificationPermissionStatus> {
      const settings = await notifee.getNotificationSettings();
      return mapNotifeeAuth(settings.authorizationStatus);
    },

    async requestPermission(): Promise<NotificationPermissionStatus> {
      const settings = await notifee.requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      });
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
