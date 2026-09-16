import notifee, {EventType} from '@notifee/react-native';
import {AppState, Platform, type NativeEventSubscription} from 'react-native';
import {
  getDiagnosticsSnapshot,
  updatePushDiagnostics,
} from '../../diagnostics/services/diagnosticsStore';
import {NOTIFICATION_CHANNEL_ID} from '../config/constants';
import {logNotificationEvent} from '../notificationLogger';
import type {
  AppNotification,
  NotificationLifecycleKind,
  NotificationPermissionStatus,
  PlaygroundAppState,
  PushTokenRecord,
} from '../types';
import {getCurrentPlaygroundAppState, mapAppState} from '../utils/appState';
import {
  buildAppNotification,
  validateNotificationPayload,
} from '../utils/validatePayload';
import {NotificationDedupeStore} from './dedupeStore';
import {PendingNotificationQueue} from './pendingNotificationQueue';
import {createPlatformPushAdapter} from './platform';
import {registerNotifeeBackgroundHandler} from './registerBackgroundHandler';
import {
  clearStoredToken,
  loadStoredToken,
  saveStoredToken,
} from './tokenStore';

export type NotificationServiceSnapshot = {
  initialized: boolean;
  permissionStatus: NotificationPermissionStatus;
  token: PushTokenRecord | null;
  tokenStatus: string;
  appState: PlaygroundAppState;
  lastAppStateChangeAt: string | null;
  pendingCount: number;
  remoteTransport: string;
};

type SnapshotListener = (snapshot: NotificationServiceSnapshot) => void;

/**
 * Central notification orchestrator.
 *
 * UI → NotificationService → Platform adapter → (FCM/APNs when configured) → OS
 *
 * Initialization is idempotent. Simulations enter through the same pipelines
 * as native events (validate → dedupe → pending/process → log).
 */
class NotificationServiceImpl {
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private permissionStatus: NotificationPermissionStatus = 'UNKNOWN';
  private token: PushTokenRecord | null = null;
  private appState: PlaygroundAppState = getCurrentPlaygroundAppState();
  private lastAppStateChangeAt: string | null = null;
  private readonly dedupe = new NotificationDedupeStore();
  private readonly pending = new PendingNotificationQueue();
  private readonly adapter = createPlatformPushAdapter();
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private appStateSub: NativeEventSubscription | null = null;
  private notifeeUnsubscribe: (() => void) | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.initializing = this.doInitialize();
    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async doInitialize(): Promise<void> {
    registerNotifeeBackgroundHandler();
    await this.adapter.initialize();

    this.token = await loadStoredToken();
    this.permissionStatus = await this.adapter.checkPermission();

    this.appStateSub = AppState.addEventListener('change', next => {
      this.appState = mapAppState(next);
      this.lastAppStateChangeAt = new Date().toISOString();
      this.emitSnapshot();
    });

    // Foreground presentation / press events from Notifee (local + displayed).
    this.notifeeUnsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification) {
        const notification = this.fromNotifee(detail.notification);
        this.handleOpened(notification, 'notifee').catch(() => undefined);
      }
    });

    try {
      const initial = await notifee.getInitialNotification();
      if (initial?.notification) {
        const notification = this.fromNotifee(initial.notification);
        await this.handleInitial(notification, 'notifee');
      }
    } catch (error) {
      logNotificationEvent({
        eventType: 'NOTIFICATION_ERROR',
        source: 'notifee',
        error: error instanceof Error ? error.message : String(error),
        result: 'error',
      });
    }

    this.initialized = true;
    this.syncDiagnostics();
    logNotificationEvent({
      eventType: 'SERVICE_INITIALIZED',
      source: 'service',
      payload: {
        adapter: this.adapter.name,
        remoteTokenKind: this.adapter.remoteTokenKind,
        platform: Platform.OS,
        firebaseConfigured: false,
      },
      result: 'ok',
    });
    this.emitSnapshot();
  }

  subscribe(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  getSnapshot(): NotificationServiceSnapshot {
    return {
      initialized: this.initialized,
      permissionStatus: this.permissionStatus,
      token: this.token,
      tokenStatus: this.describeTokenStatus(),
      appState: this.appState,
      lastAppStateChangeAt: this.lastAppStateChangeAt,
      pendingCount: this.pending.size(),
      remoteTransport:
        this.adapter.remoteTokenKind === 'fcm'
          ? 'FCM (not configured — simulation available)'
          : 'APNs (not configured — simulation available)',
    };
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    await this.ensureInitialized();
    const previous = this.permissionStatus;
    this.permissionStatus = await this.adapter.checkPermission();
    logNotificationEvent({
      eventType: 'PERMISSION_CHECKED',
      source: 'user',
      payload: {status: this.permissionStatus, previous},
      result: 'ok',
    });
    if (previous !== this.permissionStatus) {
      logNotificationEvent({
        eventType: 'PERMISSION_CHANGED',
        source: 'os',
        payload: {from: previous, to: this.permissionStatus},
      });
    }
    this.syncDiagnostics();
    this.emitSnapshot();
    return this.permissionStatus;
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    await this.ensureInitialized();
    const previous = this.permissionStatus;
    this.permissionStatus = await this.adapter.requestPermission();
    logNotificationEvent({
      eventType: 'PERMISSION_REQUESTED',
      source: 'user',
      payload: {status: this.permissionStatus, previous},
      result:
        this.permissionStatus === 'AUTHORIZED' ||
        this.permissionStatus === 'PROVISIONAL'
          ? 'ok'
          : 'ignored',
    });
    if (previous !== this.permissionStatus) {
      logNotificationEvent({
        eventType: 'PERMISSION_CHANGED',
        source: 'os',
        payload: {from: previous, to: this.permissionStatus},
      });
    }
    this.syncDiagnostics();
    this.emitSnapshot();
    return this.permissionStatus;
  }

  async getToken(): Promise<PushTokenRecord | null> {
    await this.ensureInitialized();
    try {
      const remote = await this.adapter.getRemoteToken();
      if (remote) {
        await this.applyToken(remote, 'TOKEN_RETRIEVED');
        return remote;
      }

      if (this.token) {
        logNotificationEvent({
          eventType: 'TOKEN_RETRIEVED',
          source: 'service',
          payload: {
            token: this.token,
            note: 'Returning stored token. Native remote transport not configured.',
          },
          result: 'ok',
        });
        this.syncDiagnostics();
        this.emitSnapshot();
        return this.token;
      }

      logNotificationEvent({
        eventType: 'TOKEN_ERROR',
        source: 'service',
        result: 'error',
        error:
          Platform.OS === 'android'
            ? 'FCM registration token unavailable — Firebase Messaging is not configured.'
            : 'APNs device token unavailable — Push capability / APNs wiring is not configured.',
        payload: {
          expectedKind: this.adapter.remoteTokenKind,
          hint: 'Use Simulate Token Refresh for lab tokens, or wire Firebase/APNs later.',
        },
      });
      this.syncDiagnostics();
      this.emitSnapshot();
      return null;
    } catch (error) {
      logNotificationEvent({
        eventType: 'TOKEN_ERROR',
        source: 'service',
        result: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      this.syncDiagnostics();
      this.emitSnapshot();
      return null;
    }
  }

  async refreshToken(): Promise<PushTokenRecord | null> {
    // Without a real push SDK, refresh == re-query native (likely null) then keep stored.
    return this.getToken();
  }

  async clearToken(): Promise<void> {
    await this.ensureInitialized();
    await clearStoredToken();
    this.token = null;
    logNotificationEvent({
      eventType: 'TOKEN_CLEARED',
      source: 'user',
      result: 'ok',
    });
    this.syncDiagnostics();
    this.emitSnapshot();
  }

  /**
   * Called when navigation container reports ready.
   * Flushes a single pending cold-start notification if present.
   */
  async onNavigationReady(): Promise<void> {
    await this.ensureInitialized();
    const queued = this.pending.drain();
    if (!queued) {
      return;
    }

    logNotificationEvent({
      eventType: 'PENDING_FLUSHED',
      source: 'service',
      payload: queued,
      result: 'ok',
    });

    await this.processValidatedLifecycle(
      queued.notification,
      queued.kind,
      'service',
      {skipPendingGate: true},
    );
  }

  // ─── Lifecycle handlers ─────────────────────────────────────────────

  async handleReceived(
    notification: AppNotification,
    source: 'os' | 'fcm' | 'apns' | 'notifee' | 'simulation' = 'os',
  ): Promise<void> {
    await this.processLifecycle(notification, 'received', source);
  }

  async handleOpened(
    notification: AppNotification,
    source: 'os' | 'fcm' | 'apns' | 'notifee' | 'simulation' = 'os',
  ): Promise<void> {
    await this.processLifecycle(notification, 'opened', source);
  }

  async handleInitial(
    notification: AppNotification,
    source: 'os' | 'fcm' | 'apns' | 'notifee' | 'simulation' = 'os',
  ): Promise<void> {
    await this.processLifecycle(notification, 'initial', source);
  }

  // ─── Simulations (must go through real pipelines) ───────────────────

  async simulateForegroundNotification(): Promise<void> {
    await this.ensureInitialized();
    const notification = buildAppNotification({
      id: `sim-fg-${Date.now()}`,
      title: 'Order #123',
      body: 'Your order has shipped',
      data: {
        type: 'order',
        id: '123',
        route: 'OrderDetails',
        deepLink: 'myapp://orders/123',
      },
    });

    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'foreground'},
    });

    // Optionally display a local notification so OS/Notifee path is exercised.
    try {
      const data: Record<string, string> = {};
      for (const [key, value] of Object.entries(notification.data)) {
        if (typeof value === 'string') {
          data[key] = value;
        }
      }

      await notifee.displayNotification({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          pressAction: {id: 'default'},
        },
      });
    } catch {
      // Display may fail if permission denied — still process through service.
    }

    await this.handleReceived(notification, 'simulation');
  }

  async simulateNotificationTap(): Promise<void> {
    await this.ensureInitialized();
    const notification = buildAppNotification({
      id: `sim-tap-${Date.now()}`,
      title: 'Order #123',
      body: 'Tap simulation',
      data: {
        type: 'order',
        id: '123',
        route: 'OrderDetails',
        deepLink: 'myapp://orders/123',
      },
    });
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'tap'},
    });
    await this.handleOpened(notification, 'simulation');
  }

  async simulateInitialNotification(): Promise<void> {
    await this.ensureInitialized();
    const notification = buildAppNotification({
      id: `sim-initial-${Date.now()}`,
      title: 'Cold start',
      body: 'Launched from notification',
      data: {
        type: 'order',
        id: '999',
        route: 'OrderDetails',
        deepLink: 'myapp://orders/999',
      },
    });
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'initial'},
    });

    // Force the pending-queue path even if navigation is already ready,
    // by temporarily treating navigation as not ready when explicitly simulating.
    this.pending.enqueue({
      notification,
      kind: 'initial',
      queuedAt: new Date().toISOString(),
    });
    logNotificationEvent({
      eventType: 'PENDING_QUEUED',
      source: 'simulation',
      payload: {notification, reason: 'simulate-initial-before-ready'},
      result: 'queued',
    });
    logNotificationEvent({
      eventType: 'INITIAL_NOTIFICATION',
      source: 'simulation',
      payload: notification,
      result: 'queued',
    });

    // If navigation is already ready, flush immediately (lab convenience).
    if (getDiagnosticsSnapshot().navigationReady) {
      await this.onNavigationReady();
    }
  }

  async simulateDuplicateNotification(): Promise<void> {
    await this.ensureInitialized();
    const notification = buildAppNotification({
      id: 'sim-duplicate-fixed-id',
      title: 'Duplicate lab',
      body: 'Same id delivered twice',
      data: {type: 'order', id: 'dup-1', route: 'OrderDetails'},
    });
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'duplicate'},
    });
    await this.handleReceived(notification, 'simulation');
    await this.handleReceived(notification, 'simulation');
  }

  async simulateInvalidPayload(): Promise<void> {
    await this.ensureInitialized();
    const notification = buildAppNotification({
      id: `sim-invalid-${Date.now()}`,
      title: 'Bad payload',
      body: 'Missing type',
      data: {id: 'x'},
    });
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'invalid-payload'},
    });
    await this.handleReceived(notification, 'simulation');
  }

  async simulateTokenRefresh(): Promise<void> {
    await this.ensureInitialized();
    const kind =
      this.adapter.remoteTokenKind === 'fcm'
        ? 'simulated-fcm'
        : 'simulated-apns';
    const record: PushTokenRecord = {
      token: `sim-${kind}-${Date.now().toString(36)}`,
      kind,
      updatedAt: new Date().toISOString(),
      source: 'simulated',
    };
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'token-refresh', kind},
    });
    await this.applyToken(record, 'TOKEN_REFRESHED');
  }

  cleanup(): void {
    this.appStateSub?.remove();
    this.appStateSub = null;
    this.notifeeUnsubscribe?.();
    this.notifeeUnsubscribe = null;
    this.adapter.cleanup();
    this.initialized = false;
    this.emitSnapshot();
  }

  /** Test helper */
  clearDedupe(): void {
    this.dedupe.clear();
  }

  // ─── Internals ──────────────────────────────────────────────────────

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private fromNotifee(notification: {
    id?: string;
    title?: string | null;
    body?: string | null;
    data?: Record<string, unknown>;
  }): AppNotification {
    return buildAppNotification({
      id: notification.id,
      title: notification.title ?? undefined,
      body: notification.body ?? undefined,
      data: notification.data,
      raw: notification,
    });
  }

  private async processLifecycle(
    notification: AppNotification,
    kind: NotificationLifecycleKind,
    source: 'os' | 'fcm' | 'apns' | 'notifee' | 'simulation' | 'service',
  ): Promise<void> {
    await this.ensureInitialized();
    await this.processValidatedLifecycle(notification, kind, source, {
      skipPendingGate: false,
    });
  }

  private async processValidatedLifecycle(
    notification: AppNotification,
    kind: NotificationLifecycleKind,
    source: 'os' | 'fcm' | 'apns' | 'notifee' | 'simulation' | 'service',
    options: {skipPendingGate: boolean},
  ): Promise<void> {
    const eventType =
      kind === 'received'
        ? 'NOTIFICATION_RECEIVED'
        : kind === 'opened'
          ? 'NOTIFICATION_OPENED'
          : 'INITIAL_NOTIFICATION';

    if (!this.dedupe.claim(notification.id, kind)) {
      logNotificationEvent({
        eventType: 'DUPLICATE_NOTIFICATION',
        source,
        payload: {notification, kind},
        result: 'ignored',
      });
      return;
    }

    const validation = validateNotificationPayload(notification);
    if (!validation.valid) {
      logNotificationEvent({
        eventType: 'INVALID_PAYLOAD',
        source,
        payload: {notification, reason: validation.reason},
        result: 'error',
        error: validation.reason,
      });
      return;
    }

    const navigationReady = getDiagnosticsSnapshot().navigationReady;
    if (
      !options.skipPendingGate &&
      (kind === 'initial' || kind === 'opened') &&
      !navigationReady
    ) {
      this.pending.enqueue({
        notification,
        kind,
        queuedAt: new Date().toISOString(),
      });
      logNotificationEvent({
        eventType: 'PENDING_QUEUED',
        source,
        payload: {notification, kind},
        result: 'queued',
      });
      logNotificationEvent({
        eventType,
        source,
        payload: notification,
        result: 'queued',
      });
      this.emitSnapshot();
      return;
    }

    logNotificationEvent({
      eventType,
      source,
      payload: {notification, validation},
      result: 'ok',
    });

    if (validation.route || validation.deepLink) {
      logNotificationEvent({
        eventType: 'NAVIGATION_REQUEST',
        source: 'service',
        payload: {
          message: 'Navigation request received',
          route: validation.route,
          deepLink: validation.deepLink,
          type: validation.type,
          id: validation.id,
        },
        result: 'pending',
      });
    }

    this.syncDiagnostics(eventType);
    this.emitSnapshot();
  }

  private async applyToken(
    record: PushTokenRecord,
    eventType: 'TOKEN_RETRIEVED' | 'TOKEN_REFRESHED',
  ): Promise<void> {
    const previous = this.token?.token;
    this.token = await saveStoredToken(record);
    logNotificationEvent({
      eventType,
      source: record.source === 'simulated' ? 'simulation' : 'service',
      payload: {
        token: this.token,
        previous,
        changed: previous !== this.token.token,
        note:
          record.kind === 'fcm' || record.kind === 'simulated-fcm'
            ? 'This is an FCM registration token (or simulated FCM token), not an APNs device token.'
            : 'This is an APNs device token (or simulated APNs token), not an FCM registration token.',
      },
      result: 'ok',
    });
    this.syncDiagnostics();
    this.emitSnapshot();
  }

  private describeTokenStatus(): string {
    if (!this.token) {
      return 'unavailable';
    }
    if (
      this.token.kind === 'simulated-fcm' ||
      this.token.kind === 'simulated-apns'
    ) {
      return `simulated (${this.token.kind})`;
    }
    return `available (${this.token.kind})`;
  }

  private syncDiagnostics(lastEvent?: string): void {
    updatePushDiagnostics({
      permissionStatus: this.permissionStatus,
      tokenStatus: this.describeTokenStatus(),
      lastEventSummary: lastEvent ?? getDiagnosticsSnapshot().push.lastEventSummary,
    });
  }

  private emitSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.snapshotListeners.forEach(listener => listener(snapshot));
  }
}

export const NotificationService = new NotificationServiceImpl();
