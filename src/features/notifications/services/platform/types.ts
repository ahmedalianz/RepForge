import type {
  NotificationPermissionStatus,
  PushTokenKind,
  PushTokenRecord,
} from '../../types';

export type PlatformPushAdapter = {
  readonly name: string;
  /** Expected remote token kind for this platform when fully configured. */
  readonly remoteTokenKind: PushTokenKind;
  initialize(): Promise<void>;
  checkPermission(): Promise<NotificationPermissionStatus>;
  requestPermission(): Promise<NotificationPermissionStatus>;
  /**
   * Attempts to retrieve a real remote push token.
   * Returns null when the platform push stack is not configured
   * (e.g. Firebase missing on Android).
   */
  getRemoteToken(): Promise<PushTokenRecord | null>;
  ensureAndroidChannel?(): Promise<void>;
  cleanup(): void;
};
