export const NOTIFICATION_CHANNEL_ID = 'rnlab-default';
export const NOTIFICATION_CHANNEL_NAME = 'RN Lab Default';

export const TOKEN_STORAGE_KEY = '@rnlab/push-token-v1';

/** How long a processed notification id stays in the dedupe window. */
export const DEDUPE_TTL_MS = 5 * 60 * 1000;

export const KNOWN_NOTIFICATION_TYPES = [
  'order',
  'promo',
  'system',
  'message',
] as const;

export type KnownNotificationType = (typeof KNOWN_NOTIFICATION_TYPES)[number];
