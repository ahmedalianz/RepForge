/**
 * Shared diagnostics snapshot used by the Diagnostics screen and
 * updated by feature modules as they come online.
 */

export type PushDiagnostics = {
  permissionStatus: 'unknown' | 'not-configured' | string;
  tokenStatus: 'unknown' | 'not-configured' | 'available' | 'unavailable' | string;
  lastEventSummary?: string;
  firebaseConfigured?: 'CONFIGURED' | 'NOT CONFIGURED' | string;
  fcmStatus?: 'AVAILABLE' | 'UNAVAILABLE' | string;
  tokenSource?: string;
  fcmTokenPreview?: string;
  lastRemoteMessage?: string;
  lastTap?: string;
  lastError?: string;
};

export type DeepLinkDiagnostics = {
  lastUrl?: string;
  lastEventSummary?: string;
  queueSize: number;
};

export type SslPinningDiagnostics = {
  mode: 'not-configured' | 'valid' | 'invalid' | 'backup' | string;
  lastRequestSummary?: string;
};

export type DiagnosticsSnapshot = {
  navigationReady: boolean;
  push: PushDiagnostics;
  deepLinking: DeepLinkDiagnostics;
  sslPinning: SslPinningDiagnostics;
};

type Listener = (snapshot: DiagnosticsSnapshot) => void;

const listeners = new Set<Listener>();

let snapshot: DiagnosticsSnapshot = {
  navigationReady: false,
  push: {
    permissionStatus: 'not-configured',
    tokenStatus: 'not-configured',
    firebaseConfigured: 'NOT CONFIGURED',
    fcmStatus: 'UNAVAILABLE',
  },
  deepLinking: {
    queueSize: 0,
  },
  sslPinning: {
    mode: 'not-configured',
  },
};

function notify(): void {
  const copy = {...snapshot};
  listeners.forEach(listener => listener(copy));
}

export function getDiagnosticsSnapshot(): DiagnosticsSnapshot {
  return {...snapshot};
}

export function setNavigationReady(ready: boolean): void {
  snapshot = {...snapshot, navigationReady: ready};
  notify();
}

export function updatePushDiagnostics(partial: Partial<PushDiagnostics>): void {
  snapshot = {...snapshot, push: {...snapshot.push, ...partial}};
  notify();
}

export function updateDeepLinkDiagnostics(
  partial: Partial<DeepLinkDiagnostics>,
): void {
  snapshot = {
    ...snapshot,
    deepLinking: {...snapshot.deepLinking, ...partial},
  };
  notify();
}

export function updateSslPinningDiagnostics(
  partial: Partial<SslPinningDiagnostics>,
): void {
  snapshot = {
    ...snapshot,
    sslPinning: {...snapshot.sslPinning, ...partial},
  };
  notify();
}

export function subscribeToDiagnostics(listener: Listener): () => void {
  listeners.add(listener);
  listener(getDiagnosticsSnapshot());
  return () => {
    listeners.delete(listener);
  };
}
