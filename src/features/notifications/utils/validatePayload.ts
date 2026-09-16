import {
  KNOWN_NOTIFICATION_TYPES,
  type KnownNotificationType,
} from '../config/constants';
import type {
  AppNotification,
  NotificationDataPayload,
  ValidatedNotificationPayload,
} from '../types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function normalizeData(raw: unknown): NotificationDataPayload {
  if (!isPlainObject(raw)) {
    return {};
  }

  const data: NotificationDataPayload = {};
  for (const [key, value] of Object.entries(raw)) {
    const asStr = asString(value);
    if (asStr !== undefined) {
      data[key] = asStr;
    }
  }
  return data;
}

/**
 * Validates notification payloads before any app side-effects.
 * Never throws — malformed input becomes { valid: false }.
 */
export function validateNotificationPayload(
  notification: AppNotification | null | undefined,
): ValidatedNotificationPayload {
  if (!notification || !isPlainObject(notification as unknown)) {
    return {valid: false, reason: 'Missing notification object'};
  }

  const data = normalizeData(notification.data);
  const type = asString(data.type) ?? asString(notification.data?.type);
  const id = asString(data.id) ?? asString(notification.id);

  if (!type) {
    return {valid: false, reason: 'Missing notification type', data};
  }

  if (!id) {
    return {valid: false, reason: 'Missing notification id', data};
  }

  if (type === 'unknown' || type === 'invalid') {
    return {
      valid: false,
      reason: `Unknown notification type: ${type}`,
      data,
    };
  }

  const known = KNOWN_NOTIFICATION_TYPES.includes(
    type as KnownNotificationType,
  );

  return {
    valid: true,
    type: known ? (type as KnownNotificationType) : type,
    id,
    route: asString(data.route),
    deepLink: asString(data.deepLink),
    title: asString(notification.title),
    body: asString(notification.body),
    data: {
      ...data,
      type,
      id,
    },
  };
}

export function buildAppNotification(input: {
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  raw?: unknown;
}): AppNotification {
  const data = normalizeData(input.data);
  const id =
    asString(input.id) ??
    asString(data.id) ??
    `generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    title: asString(input.title),
    body: asString(input.body),
    data,
    raw: input.raw,
  };
}
