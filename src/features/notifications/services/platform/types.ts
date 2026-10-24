import type {
  NotificationPermissionStatus,
  PushTokenKind,
  PushTokenRecord,
} from '../../types';
import type {FirebaseMessagingBindings} from '../firebaseMessaging';

export type PlatformPushAdapter = {
  readonly name: string;
  /** Expected remote token kind for this platform when fully configured. */
  readonly remoteTokenKind: PushTokenKind;
  initialize(): Promise<void>;
  checkPermission(): Promise<NotificationPermissionStatus>;
  requestPermission(): Promise<NotificationPermissionStatus>;
  /**
   * Attempts to retrieve a real remote push token (FCM registration token when
   * Firebase is configured). Returns null when unavailable.
   */
  getRemoteToken(): Promise<PushTokenRecord | null>;
  /** Optional Firebase messaging bindings (null when not configured). */
  getFirebaseMessaging?(): FirebaseMessagingBindings | null;
  ensureAndroidChannel?(): Promise<void>;
  cleanup(): void;
};
