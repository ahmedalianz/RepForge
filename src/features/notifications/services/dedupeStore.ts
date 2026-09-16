import {DEDUPE_TTL_MS} from '../config/constants';

type DedupeEntry = {
  key: string;
  seenAt: number;
  eventFamily: string;
};

/**
 * Prevents the same logical notification from being processed twice when
 * multiple lifecycle listeners observe it (common on cold start + resume).
 */
export class NotificationDedupeStore {
  private readonly seen = new Map<string, DedupeEntry>();

  buildKey(notificationId: string, eventFamily: string): string {
    return `${eventFamily}:${notificationId}`;
  }

  /**
   * @returns true if this is the first time we see the key within the TTL.
   */
  claim(notificationId: string, eventFamily: string): boolean {
    this.prune();
    const key = this.buildKey(notificationId, eventFamily);
    if (this.seen.has(key)) {
      return false;
    }
    this.seen.set(key, {
      key,
      seenAt: Date.now(),
      eventFamily,
    });
    return true;
  }

  /** Test helper — force-clear the window. */
  clear(): void {
    this.seen.clear();
  }

  size(): number {
    this.prune();
    return this.seen.size;
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.seen.entries()) {
      if (now - entry.seenAt > DEDUPE_TTL_MS) {
        this.seen.delete(key);
      }
    }
  }
}
