import notifee, {AuthorizationStatus} from '@notifee/react-native';
import type {NotificationPermissionStatus} from '../../types';
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

/**
 * iOS push adapter.
 *
 * Permissions: Notifee → UNUserNotificationCenter.
 * Remote token: APNs device token — requires Push capability + registerForRemoteNotifications.
 * Without Firebase/APNs entitlement wiring, getRemoteToken returns null.
 * Simulation in NotificationService can mint a clearly labeled simulated-apns token.
 */
export function createIosPushAdapter(): PlatformPushAdapter {
  return {
    name: 'ios-notifee',
    remoteTokenKind: 'apns',

    async initialize(): Promise<void> {
      // No Android-style channels on iOS.
    },

    async checkPermission(): Promise<NotificationPermissionStatus> {
      const settings = await notifee.getNotificationSettings();
      // iOS has no separate "blocked" enum in Notifee; repeated deny is DENIED.
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
      // Real APNs device token requires native registerForRemoteNotifications
      // and usually a push provider (often Firebase as the APNs broker).
      return null;
    },

    cleanup(): void {},
  };
}
