import type {KnownNotificationType} from '../config/constants';
import type {NotificationIdentity} from '../utils/notificationIdentity';

/**
 * Distinguishes remote token kinds.
 * APNs device token ≠ FCM registration token.
 *
 * With React Native Firebase on both platforms, messaging.getToken() returns an
 * FCM registration token. On iOS, getAPNSToken() exposes the underlying APNs
 * device token separately for learning — never treat them as interchangeable.
 */
export type PushTokenKind = 'apns' | 'fcm' | 'simulated-apns' | 'simulated-fcm';

export type PushTokenRecord = {
  token: string;
  kind: PushTokenKind;
  updatedAt: string;
  source: 'native' | 'simulated' | 'storage';
  /** iOS only — underlying APNs device token when Firebase exposes it. */
  apnsDeviceToken?: string;
};

export type NotificationPermissionStatus =
  | 'AUTHORIZED'
  | 'DENIED'
  | 'BLOCKED'
  | 'PROVISIONAL'
  | 'NOT_DETERMINED'
  | 'UNKNOWN';

export type PlaygroundAppState =
  | 'FOREGROUND'
  | 'BACKGROUND'
  | 'INACTIVE'
  | 'UNKNOWN';

export type NotificationEventType =
  | 'PERMISSION_CHECKED'
  | 'PERMISSION_REQUESTED'
  | 'PERMISSION_CHANGED'
  | 'TOKEN_RETRIEVED'
  | 'TOKEN_REFRESHED'
  | 'TOKEN_CLEARED'
  | 'TOKEN_ERROR'
  | 'TOKEN_BACKEND_REGISTER_STUB'
  | 'NOTIFICATION_RECEIVED'
  | 'NOTIFICATION_OPENED'
  | 'INITIAL_NOTIFICATION'
  | 'NAVIGATION_REQUEST'
  | 'INVALID_PAYLOAD'
  | 'DUPLICATE_NOTIFICATION'
  | 'PENDING_QUEUED'
  | 'PENDING_FLUSHED'
  | 'NOTIFICATION_ERROR'
  | 'SERVICE_INITIALIZED'
  | 'FIREBASE_STATUS'
  | 'FOREGROUND_REMOTE_MESSAGE'
  | 'BACKGROUND_REMOTE_MESSAGE'
  | 'SIMULATION';

export type NotificationEventSource =
  | 'user'
  | 'os'
  | 'fcm'
  | 'apns'
  | 'notifee'
  | 'simulation'
  | 'service';

export type NotificationDataPayload = {
  type?: string;
  id?: string;
  route?: string;
  deepLink?: string;
  providerMessageId?: string;
  __rnlabProviderMessageId?: string;
  __rnlabDisplayedBy?: string;
  [key: string]: string | undefined;
};

export type NotificationContent = {
  title?: string;
  body?: string;
};

/**
 * Normalized remote/local notification used across the playground.
 */
export type AppNotification = {
  /** Prefer provider message id when available. */
  id: string;
  title?: string;
  body?: string;
  data: NotificationDataPayload;
  identity?: NotificationIdentity;
  raw?: unknown;
};

export type ValidatedNotificationPayload =
  | {
      valid: true;
      type: KnownNotificationType | string;
      id: string;
      route?: string;
      deepLink?: string;
      title?: string;
      body?: string;
      data: NotificationDataPayload;
    }
  | {
      valid: false;
      reason: string;
      data?: NotificationDataPayload;
    };

export type NotificationLifecycleKind =
  | 'received'
  | 'opened'
  | 'initial';
