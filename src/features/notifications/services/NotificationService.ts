import notifee, {EventType} from '@notifee/react-native';
import type {RemoteMessage} from '@react-native-firebase/messaging';
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
  attachIdentityToNotification,
  dedupeFamilyForKind,
  resolveNotificationIdentity,
} from '../utils/notificationIdentity';
import {
  describeRemoteMessageKind,
  remoteMessageToAppNotification,
} from '../utils/remoteMessageMapper';
import {
  buildAppNotification,
  validateNotificationPayload,
} from '../utils/validatePayload';
import {NotificationDedupeStore} from './dedupeStore';
import {probeFirebaseRuntime} from './firebaseStatus';
import {PendingNotificationQueue} from './pendingNotificationQueue';
import {createPlatformPushAdapter} from './platform';
import {registerNotifeeBackgroundHandler} from './registerBackgroundHandler';
import {registerTokenWithBackend} from './tokenBackend';
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
  firebaseConfigured: boolean;
  fcmAvailable: boolean;
  lastRemoteMessageSummary?: string;
  lastTapSummary?: string;
  lastError?: string;
  apnsDeviceToken?: string;
};

type SnapshotListener = (snapshot: NotificationServiceSnapshot) => void;

/**
 * Central notification orchestrator.
 *
 * Remote: FCM → Firebase Messaging → adapter → NotificationService
 * Presentation: Notifee (channels / foreground local display / local press)
 *
 * Initialization is idempotent.
 */
class NotificationServiceImpl {
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private permissionStatus: NotificationPermissionStatus = 'UNKNOWN';
  private token: PushTokenRecord | null = null;
  private appState: PlaygroundAppState = getCurrentPlaygroundAppState();
  private lastAppStateChangeAt: string | null = null;
  private lastRemoteMessageSummary?: string;
  private lastTapSummary?: string;
  private lastError?: string;
  private readonly dedupe = new NotificationDedupeStore();
  private readonly pending = new PendingNotificationQueue();
  private readonly adapter = createPlatformPushAdapter();
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private appStateSub: NativeEventSubscription | null = null;
  private notifeeUnsubscribe: (() => void) | null = null;
  private firebaseUnsubscribe: (() => void) | null = null;

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

    const firebaseStatus = probeFirebaseRuntime();
    logNotificationEvent({
      eventType: 'FIREBASE_STATUS',
      source: 'service',
      payload: firebaseStatus,
      result: firebaseStatus.messagingAvailable ? 'ok' : 'pending',
    });

    this.token = await loadStoredToken();
    this.permissionStatus = await this.adapter.checkPermission();

    this.appStateSub = AppState.addEventListener('change', next => {
      this.appState = mapAppState(next);
      this.lastAppStateChangeAt = new Date().toISOString();
      this.emitSnapshot();
    });

    // Notifee presses — used for locally displayed foreground FCM messages.
    this.notifeeUnsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification) {
        const notification = this.fromNotifee(detail.notification);
        this.lastTapSummary = `notifee:${notification.id}`;
        this.handleOpened(notification, 'notifee').catch(() => undefined);
      }
    });

    this.ensureFirebaseSubscriptions();

    // Notifee initial — only if we displayed it ourselves (avoids double FCM initial).
    try {
      const initial = await notifee.getInitialNotification();
      if (
        initial?.notification &&
        initial.notification.data?.__rnlabDisplayedBy === 'notifee'
      ) {
        const notification = this.fromNotifee(initial.notification);
        this.lastTapSummary = `notifee-initial:${notification.id}`;
        await this.handleInitial(notification, 'notifee');
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      logNotificationEvent({
        eventType: 'NOTIFICATION_ERROR',
        source: 'notifee',
        error: this.lastError,
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
        firebaseConfigured: firebaseStatus.nativeConfigured,
        fcmAvailable: firebaseStatus.messagingAvailable,
      },
      result: 'ok',
    });
    this.emitSnapshot();

    // Best-effort token fetch when Firebase is ready.
    if (firebaseStatus.messagingAvailable) {
      this.getToken().catch(() => undefined);
    }
  }

  subscribe(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  getSnapshot(): NotificationServiceSnapshot {
    const firebase = probeFirebaseRuntime();
    return {
      initialized: this.initialized,
      permissionStatus: this.permissionStatus,
      token: this.token,
      tokenStatus: this.describeTokenStatus(),
      appState: this.appState,
      lastAppStateChangeAt: this.lastAppStateChangeAt,
      pendingCount: this.pending.size(),
      remoteTransport: firebase.messagingAvailable
        ? 'FCM (native)'
        : 'FCM (NOT CONFIGURED — simulation available)',
      firebaseConfigured: firebase.nativeConfigured,
      fcmAvailable: firebase.messagingAvailable,
      lastRemoteMessageSummary: this.lastRemoteMessageSummary,
      lastTapSummary: this.lastTapSummary,
      lastError: this.lastError,
      apnsDeviceToken: this.token?.apnsDeviceToken,
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
      // FCM on iOS needs notification permission + APNs registration first.
      this.permissionStatus = await this.adapter.checkPermission();
      if (
        this.permissionStatus !== 'AUTHORIZED' &&
        this.permissionStatus !== 'PROVISIONAL'
      ) {
        this.permissionStatus = await this.adapter.requestPermission();
      }
      if (
        this.permissionStatus !== 'AUTHORIZED' &&
        this.permissionStatus !== 'PROVISIONAL'
      ) {
        throw new Error(
          `Notification permission is ${this.permissionStatus}. Authorize notifications, then tap Get Token again.`,
        );
      }

      // Ensure Firebase listeners attach if native became ready after first init.
      this.ensureFirebaseSubscriptions();

      const remote = await this.adapter.getRemoteToken();
      if (remote) {
        this.lastError = undefined;
        await this.applyToken(remote, 'TOKEN_RETRIEVED');
        return remote;
      }

      if (this.token && this.token.source !== 'simulated') {
        logNotificationEvent({
          eventType: 'TOKEN_RETRIEVED',
          source: 'service',
          payload: {
            token: this.token,
            note: 'Returning cached native token (live retrieval unavailable).',
          },
          result: 'ok',
        });
        this.syncDiagnostics();
        this.emitSnapshot();
        return this.token;
      }

      const detail = probeFirebaseRuntime().detail;
      this.lastError = detail;
      logNotificationEvent({
        eventType: 'TOKEN_ERROR',
        source: 'service',
        result: 'error',
        error:
          'FCM registration token unavailable — Firebase Messaging is not configured or failed to initialize.',
        payload: {
          expectedKind: 'fcm',
          provider: 'FCM',
          detail,
          permissionStatus: this.permissionStatus,
          hint: 'Add google-services.json / GoogleService-Info.plist, then rebuild. Simulations remain available.',
        },
      });
      this.syncDiagnostics();
      this.emitSnapshot();
      return null;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      logNotificationEvent({
        eventType: 'TOKEN_ERROR',
        source: 'service',
        result: 'error',
        error: this.lastError,
        payload: {
          permissionStatus: this.permissionStatus,
          firebase: probeFirebaseRuntime(),
        },
      });
      this.syncDiagnostics();
      this.emitSnapshot();
      return null;
    }
  }

  async refreshToken(): Promise<PushTokenRecord | null> {
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

  async handleReceived(
    notification: AppNotification,
    source: 'os' | 'fcm' | 'apns' | 'notifee' | 'simulation' = 'os',
  ): Promise<void> {
    await this.processLifecycle(notification, 'received', source);
  }

  /** Public entry for FCM setBackgroundMessageHandler (index.js). */
  async handleBackgroundRemoteMessage(message: RemoteMessage): Promise<void> {
    await this.ensureInitialized();
    await this.handleBackgroundRemote(message);
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

  // ─── Real FCM handlers ──────────────────────────────────────────────

  private async handleForegroundRemote(message: RemoteMessage): Promise<void> {
    const kind = describeRemoteMessageKind(message);
    const notification = remoteMessageToAppNotification(message);
    this.lastRemoteMessageSummary = `foreground:${kind}:${notification.id}`;

    logNotificationEvent({
      eventType: 'FOREGROUND_REMOTE_MESSAGE',
      source: 'fcm',
      payload: {
        kind,
        identity: notification.identity,
        messageId: message.messageId,
        notification: message.notification,
        data: message.data,
      },
      result: 'ok',
    });

    // OS typically does NOT show a banner in foreground — decide explicitly.
    if (message.notification) {
      await this.displayViaNotifee(notification);
    }

    await this.handleReceived(notification, 'fcm');
  }

  private async handleBackgroundRemote(message: RemoteMessage): Promise<void> {
    const kind = describeRemoteMessageKind(message);
    const notification = remoteMessageToAppNotification(message);
    this.lastRemoteMessageSummary = `background:${kind}:${notification.id}`;

    logNotificationEvent({
      eventType: 'BACKGROUND_REMOTE_MESSAGE',
      source: 'fcm',
      payload: {
        kind,
        identity: notification.identity,
        messageId: message.messageId,
        note: 'JS background handler ran. Notification UI may still be OS-owned for notification payloads.',
      },
      result: 'ok',
    });

    await this.handleReceived(notification, 'fcm');
  }

  private async handleRemoteOpened(message: RemoteMessage): Promise<void> {
    const notification = remoteMessageToAppNotification(message);
    this.lastTapSummary = `fcm-opened:${notification.id}`;
    await this.handleOpened(notification, 'fcm');
  }

  private async handleRemoteInitial(message: RemoteMessage): Promise<void> {
    const notification = remoteMessageToAppNotification(message);
    this.lastTapSummary = `fcm-initial:${notification.id}`;
    await this.handleInitial(notification, 'fcm');
  }

  private async handleNativeTokenRefresh(token: string): Promise<void> {
    const record: PushTokenRecord = {
      token,
      kind: 'fcm',
      updatedAt: new Date().toISOString(),
      source: 'native',
      apnsDeviceToken: this.token?.apnsDeviceToken,
    };
    await this.applyToken(record, 'TOKEN_REFRESHED');
  }

  private async displayViaNotifee(notification: AppNotification): Promise<void> {
    try {
      const data: Record<string, string> = {
        __rnlabDisplayedBy: 'notifee',
      };
      for (const [key, value] of Object.entries(notification.data)) {
        if (typeof value === 'string') {
          data[key] = value;
        }
      }
      if (notification.identity?.providerMessageId) {
        data.__rnlabProviderMessageId = notification.identity.providerMessageId;
        data.providerMessageId = notification.identity.providerMessageId;
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
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      logNotificationEvent({
        eventType: 'NOTIFICATION_ERROR',
        source: 'notifee',
        error: this.lastError,
        payload: {phase: 'foreground-display'},
        result: 'error',
      });
    }
  }

  // ─── Simulations ────────────────────────────────────────────────────

  async simulateForegroundNotification(): Promise<void> {
    await this.ensureInitialized();
    const notification = this.withIdentity(
      buildAppNotification({
        id: `sim-fg-${Date.now()}`,
        title: 'Order #123',
        body: 'Your order has shipped',
        data: {
          type: 'order',
          id: '123',
          route: 'OrderDetails',
          deepLink: 'myapp://orders/123',
        },
      }),
    );
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'foreground'},
    });
    await this.displayViaNotifee(notification);
    await this.handleReceived(notification, 'simulation');
  }

  async simulateNotificationTap(): Promise<void> {
    await this.ensureInitialized();
    const notification = this.withIdentity(
      buildAppNotification({
        id: `sim-tap-${Date.now()}`,
        title: 'Order #123',
        body: 'Tap simulation',
        data: {
          type: 'order',
          id: '123',
          route: 'OrderDetails',
          deepLink: 'myapp://orders/123',
        },
      }),
    );
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'tap'},
    });
    await this.handleOpened(notification, 'simulation');
  }

  async simulateInitialNotification(): Promise<void> {
    await this.ensureInitialized();
    const notification = this.withIdentity(
      buildAppNotification({
        id: `sim-initial-${Date.now()}`,
        title: 'Cold start',
        body: 'Launched from notification',
        data: {
          type: 'order',
          id: '999',
          route: 'OrderDetails',
          deepLink: 'myapp://orders/999',
        },
      }),
    );
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'initial'},
    });

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
      payload: {notification, identity: notification.identity},
      result: 'queued',
    });

    if (getDiagnosticsSnapshot().navigationReady) {
      await this.onNavigationReady();
    }
  }

  async simulateDuplicateNotification(): Promise<void> {
    await this.ensureInitialized();
    const notification = this.withIdentity(
      buildAppNotification({
        id: 'sim-duplicate-fixed-id',
        title: 'Duplicate lab',
        body: 'Same id delivered twice',
        data: {type: 'order', id: 'dup-1', route: 'OrderDetails'},
      }),
      'sim-duplicate-provider-id',
    );
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'duplicate', identity: notification.identity},
    });
    await this.handleReceived(notification, 'simulation');
    await this.handleOpened(notification, 'simulation');
    await this.handleInitial(notification, 'simulation');
    await this.handleReceived(notification, 'fcm');
    await this.handleOpened(notification, 'notifee');
  }

  async simulateInvalidPayload(): Promise<void> {
    await this.ensureInitialized();
    const notification = this.withIdentity(
      buildAppNotification({
        id: `sim-invalid-${Date.now()}`,
        title: 'Bad payload',
        body: 'Missing type',
        data: {id: 'x'},
      }),
    );
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'invalid-payload'},
    });
    await this.handleReceived(notification, 'simulation');
  }

  async simulateTokenRefresh(): Promise<void> {
    await this.ensureInitialized();
    const record: PushTokenRecord = {
      token: `sim-fcm-${Date.now().toString(36)}`,
      kind: 'simulated-fcm',
      updatedAt: new Date().toISOString(),
      source: 'simulated',
    };
    logNotificationEvent({
      eventType: 'SIMULATION',
      source: 'simulation',
      payload: {action: 'token-refresh', kind: record.kind},
    });
    await this.applyToken(record, 'TOKEN_REFRESHED');
  }

  cleanup(): void {
    this.appStateSub?.remove();
    this.appStateSub = null;
    this.notifeeUnsubscribe?.();
    this.notifeeUnsubscribe = null;
    this.firebaseUnsubscribe?.();
    this.firebaseUnsubscribe = null;
    this.adapter.cleanup();
    this.initialized = false;
    this.emitSnapshot();
  }

  clearDedupe(): void {
    this.dedupe.clear();
  }

  // ─── Internals ──────────────────────────────────────────────────────

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private ensureFirebaseSubscriptions(): void {
    if (this.firebaseUnsubscribe) {
      return;
    }
    const firebase = this.adapter.getFirebaseMessaging?.() ?? null;
    if (!firebase) {
      return;
    }
    this.firebaseUnsubscribe = firebase.subscribe({
      onForegroundMessage: message => this.handleForegroundRemote(message),
      onOpened: message => this.handleRemoteOpened(message),
      onInitial: message => this.handleRemoteInitial(message),
      onTokenRefresh: token => this.handleNativeTokenRefresh(token),
    });
  }

  private withIdentity(
    notification: AppNotification,
    providerMessageId?: string,
  ): AppNotification {
    const identity = resolveNotificationIdentity({
      providerMessageId,
      notificationId: notification.id,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });
    return attachIdentityToNotification(notification, identity);
  }

  private fromNotifee(notification: {
    id?: string;
    title?: string | null;
    body?: string | null;
    data?: Record<string, unknown>;
  }): AppNotification {
    const base = buildAppNotification({
      id: notification.id,
      title: notification.title ?? undefined,
      body: notification.body ?? undefined,
      data: notification.data,
      raw: notification,
    });
    const identity = resolveNotificationIdentity({
      providerMessageId:
        typeof notification.data?.__rnlabProviderMessageId === 'string'
          ? notification.data.__rnlabProviderMessageId
          : typeof notification.data?.providerMessageId === 'string'
            ? notification.data.providerMessageId
            : undefined,
      notificationId: notification.id,
      title: base.title,
      body: base.body,
      data: base.data,
    });
    return attachIdentityToNotification(base, identity);
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

    const identity =
      notification.identity ??
      resolveNotificationIdentity({
        notificationId: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    const enriched = attachIdentityToNotification(notification, identity);
    const family = dedupeFamilyForKind(kind);

    if (!this.dedupe.claim(identity.dedupeKey, family)) {
      logNotificationEvent({
        eventType: 'DUPLICATE_NOTIFICATION',
        source,
        payload: {notification: enriched, kind, family, identity},
        result: 'ignored',
      });
      return;
    }

    const validation = validateNotificationPayload(enriched);
    if (!validation.valid) {
      logNotificationEvent({
        eventType: 'INVALID_PAYLOAD',
        source,
        payload: {notification: enriched, reason: validation.reason, identity},
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
        notification: enriched,
        kind,
        queuedAt: new Date().toISOString(),
      });
      logNotificationEvent({
        eventType: 'PENDING_QUEUED',
        source,
        payload: {notification: enriched, kind, identity},
        result: 'queued',
      });
      logNotificationEvent({
        eventType,
        source,
        payload: {notification: enriched, identity},
        result: 'queued',
      });
      this.emitSnapshot();
      return;
    }

    logNotificationEvent({
      eventType,
      source,
      payload: {notification: enriched, validation, identity},
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
          identity,
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
      source: record.source === 'simulated' ? 'simulation' : 'fcm',
      payload: {
        provider: 'FCM',
        tokenKind: 'FCM registration token',
        token: this.token,
        previous,
        changed: previous !== this.token.token,
        apnsDeviceToken: this.token.apnsDeviceToken,
        note:
          'FCM registration token is what the app should send to a backend. ' +
          'APNs device token (iOS) is a different value — exposed separately when available.',
      },
      result: 'ok',
    });
    await registerTokenWithBackend(this.token);
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
    return `available (${this.token.kind}/${this.token.source})`;
  }

  private syncDiagnostics(lastEvent?: string): void {
    const firebase = probeFirebaseRuntime();
    updatePushDiagnostics({
      permissionStatus: this.permissionStatus,
      tokenStatus: this.describeTokenStatus(),
      lastEventSummary:
        lastEvent ?? getDiagnosticsSnapshot().push.lastEventSummary,
      firebaseConfigured: firebase.nativeConfigured ? 'CONFIGURED' : 'NOT CONFIGURED',
      fcmStatus: firebase.messagingAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      tokenSource: this.token?.source ?? 'none',
      fcmTokenPreview: this.token
        ? `${this.token.token.slice(0, 16)}…`
        : 'none',
      lastRemoteMessage: this.lastRemoteMessageSummary,
      lastTap: this.lastTapSummary,
      lastError: this.lastError,
    });
  }

  private emitSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.snapshotListeners.forEach(listener => listener(snapshot));
  }
}

export const NotificationService = new NotificationServiceImpl();
