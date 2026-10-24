
import {logNotificationEvent} from '../notificationLogger';
import type {PushTokenRecord} from '../types';

/**
 * Production apps must upsert the FCM registration token on the backend so the
 * server can target this device. Stale tokens must be removed/replaced.
 *
 * This learning project intentionally does NOT call a real backend.
 */
export async function registerTokenWithBackend(
  token: PushTokenRecord,
): Promise<void> {
  logNotificationEvent({
    eventType: 'TOKEN_BACKEND_REGISTER_STUB',
    source: 'service',
    payload: {
      message:
        'registerTokenWithBackend() is a stub. Wire your API here in production.',
      tokenKind: token.kind,
      tokenPreview: `${token.token.slice(0, 12)}…`,
      updatedAt: token.updatedAt,
    },
    result: 'pending',
  });
}