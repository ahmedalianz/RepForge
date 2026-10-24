import type {AppNotification, NotificationDataPayload} from '../types';

/**
 * Normalized identity used for deduplication across FCM / Notifee / OS events.
 *
 * Priority:
 * 1. providerMessageId (FCM messageId) — best cross-handler key
 * 2. notificationId (Notifee / local id)
 * 3. fallbackHash (stable hash of content fields)
 */
export type NotificationIdentity = {
  providerMessageId?: string;
  notificationId: string;
  fallbackHash: string;
  /** Key used by the dedupe store. */
  dedupeKey: string;
};

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    // Simple string hash (djb2-ish without bitwise ops for lint cleanliness).
    hash = (hash * 33 + input.charCodeAt(i)) % 2147483647;
  }
  return `h${hash}`;
}

export function buildFallbackHash(parts: {
  title?: string;
  body?: string;
  type?: string;
  id?: string;
  route?: string;
}): string {
  return stableHash(
    [parts.title, parts.body, parts.type, parts.id, parts.route]
      .map(value => value ?? '')
      .join('|'),
  );
}

export function resolveNotificationIdentity(input: {
  providerMessageId?: string;
  notificationId?: string;
  title?: string;
  body?: string;
  data?: NotificationDataPayload;
}): NotificationIdentity {
  const fromData = input.data?.providerMessageId ?? input.data?.__rnlabProviderMessageId;
  const providerMessageId = input.providerMessageId ?? fromData;
  const fallbackHash = buildFallbackHash({
    title: input.title,
    body: input.body,
    type: input.data?.type,
    id: input.data?.id,
    route: input.data?.route,
  });
  const notificationId =
    input.notificationId ??
    providerMessageId ??
    input.data?.id ??
    fallbackHash;

  const dedupeKey = providerMessageId ?? notificationId ?? fallbackHash;

  return {
    providerMessageId,
    notificationId,
    fallbackHash,
    dedupeKey,
  };
}

/**
 * Dedupe family for lifecycle kinds.
 * opened + initial share "open" so cold-start tap + opened listener don't double-navigate.
 */
export function dedupeFamilyForKind(
  kind: 'received' | 'opened' | 'initial',
): 'received' | 'open' {
  return kind === 'received' ? 'received' : 'open';
}

export function attachIdentityToNotification(
  notification: AppNotification,
  identity: NotificationIdentity,
): AppNotification {
  return {
    ...notification,
    id: identity.notificationId,
    identity,
    data: {
      ...notification.data,
      ...(identity.providerMessageId
        ? {
            providerMessageId: identity.providerMessageId,
            __rnlabProviderMessageId: identity.providerMessageId,
          }
        : {}),
    },
  };
}
