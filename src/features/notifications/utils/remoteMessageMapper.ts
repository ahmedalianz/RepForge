import type {RemoteMessage} from '@react-native-firebase/messaging';
import type {AppNotification} from '../types';
import {
  attachIdentityToNotification,
  resolveNotificationIdentity,
} from '../utils/notificationIdentity';
import {buildAppNotification} from '../utils/validatePayload';

function stringifyData(
  data: RemoteMessage['data'],
): Record<string, unknown> | undefined {
  if (!data) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = value;
  }
  return out;
}

/**
 * Maps an FCM RemoteMessage into the lab's AppNotification shape.
 */
export function remoteMessageToAppNotification(
  remoteMessage: RemoteMessage,
): AppNotification {
  const data = stringifyData(remoteMessage.data);
  const base = buildAppNotification({
    id: remoteMessage.messageId ?? undefined,
    title: remoteMessage.notification?.title ?? undefined,
    body: remoteMessage.notification?.body ?? undefined,
    data,
    raw: remoteMessage,
  });

  const identity = resolveNotificationIdentity({
    providerMessageId: remoteMessage.messageId ?? undefined,
    notificationId: remoteMessage.messageId ?? base.id,
    title: base.title,
    body: base.body,
    data: base.data,
  });

  return attachIdentityToNotification(base, identity);
}

export function describeRemoteMessageKind(remoteMessage: RemoteMessage): string {
  const hasNotification = Boolean(remoteMessage.notification);
  const hasData = Boolean(
    remoteMessage.data && Object.keys(remoteMessage.data).length > 0,
  );
  if (hasNotification && hasData) {
    return 'notification+data';
  }
  if (hasNotification) {
    return 'notification';
  }
  if (hasData) {
    return 'data-only';
  }
  return 'empty';
}
